import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../notifications/email.service';
import { PrismaService } from '../prisma/prisma.service';

export const SALT_ROUNDS = 10;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 h
const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // 3 days

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/**
 * One-time links for "forgot password" and team invitations. Only the SHA-256
 * of the token is stored, so a leaked database row can't be replayed. These
 * flows run before login, so they use the owner connection (no tenant context);
 * the table has RLS enabled with no policy, which locks the runtime role out.
 */
@Injectable()
export class PasswordTokensService {
  private readonly logger = new Logger(PasswordTokensService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  private async issue(userId: string, ttlMs: number): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
    return token;
  }

  private link(token: string, invite: boolean) {
    const base = this.configService.getOrThrow<string>('WEB_APP_URL');
    return `${base}/reset-password?token=${token}${invite ? '&invite=1' : ''}`;
  }

  /**
   * Always resolves the same way whether or not the email exists, and sends in
   * the background, so the response time doesn't reveal registered accounts.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!user) return;
    void (async () => {
      const token = await this.issue(user.id, RESET_TTL_MS);
      await this.emailService.send(
        user.email,
        'Restablece tu contraseña de Souvenirs',
        `Hola ${user.name},\n\nPara elegir una contraseña nueva entra aquí (el enlace vale 1 hora):\n` +
          `${this.link(token, false)}\n\nSi no lo pediste, ignora este correo.`,
      );
    })().catch((error) =>
      this.logger.error('Failed to send password reset email', error),
    );
  }

  async sendInvitation(
    user: { id: string; email: string; name: string },
    studioName: string,
  ) {
    const token = await this.issue(user.id, INVITE_TTL_MS);
    await this.emailService.send(
      user.email,
      `Te invitaron a ${studioName} en Souvenirs`,
      `Hola ${user.name},\n\n${studioName} te invitó a su panel de Souvenirs.\n` +
        `Elige tu contraseña para entrar (el enlace vale 3 días):\n${this.link(token, true)}`,
    );
  }

  /** Consumes the token and sets the password. Every other open token of that user is burned too. */
  async consume(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('El enlace no es válido o ya expiró');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: now },
      }),
    ]);
    return record.user;
  }
}

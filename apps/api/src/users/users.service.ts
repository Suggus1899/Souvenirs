import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { TenantsRepository } from '../tenants/tenants.repository';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { PasswordTokensService, SALT_ROUNDS } from './password-tokens.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tenantsRepository: TenantsRepository,
    private readonly passwordTokens: PasswordTokensService,
  ) {}

  registerPushToken(
    tenantId: string,
    userId: string,
    dto: RegisterPushTokenDto,
  ) {
    return this.usersRepository.upsertPushToken(
      tenantId,
      userId,
      dto.token,
      dto.platform,
    );
  }

  async unregisterPushToken(tenantId: string, userId: string, token: string) {
    await this.usersRepository.deletePushToken(tenantId, userId, token);
  }

  listTeam(tenantId: string) {
    return this.usersRepository.listTeam(tenantId);
  }

  async getProfile(tenantId: string, userId: string) {
    const user = await this.usersRepository.findById(tenantId, userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }

  updateProfile(tenantId: string, userId: string, name: string) {
    return this.usersRepository.updateProfile(tenantId, userId, name);
  }

  async changePassword(
    tenantId: string,
    userId: string,
    dto: ChangePasswordDto,
  ) {
    const user = await this.usersRepository.findById(tenantId, userId);
    if (
      !user ||
      !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La contraseña nueva debe ser distinta');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersRepository.updatePasswordHash(
      tenantId,
      userId,
      passwordHash,
    );
  }

  /**
   * Creates an ASSISTANT with an unusable random password and emails them a
   * one-time link to choose their own. Emails are unique across tenants.
   */
  async invite(tenantId: string, dto: InviteUserDto) {
    const email = dto.email.toLowerCase();
    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException('Ese email ya tiene una cuenta en Souvenirs');
    }
    const tenant = await this.tenantsRepository.findById(tenantId);
    const passwordHash = await bcrypt.hash(
      randomBytes(32).toString('hex'),
      SALT_ROUNDS,
    );
    const member = await this.usersRepository.createMember(tenantId, {
      name: dto.name,
      email,
      passwordHash,
      role: Role.ASSISTANT,
    });
    await this.passwordTokens.sendInvitation(
      member,
      tenant?.name ?? 'Tu estudio',
    );
    return member;
  }

  async removeMember(tenantId: string, actingUserId: string, memberId: string) {
    if (memberId === actingUserId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }
    const member = await this.usersRepository.findById(tenantId, memberId);
    if (!member) throw new NotFoundException('Usuario no encontrado');
    if (member.role === Role.OWNER) {
      throw new ForbiddenException('No se puede eliminar al dueño del estudio');
    }
    await this.usersRepository.remove(tenantId, memberId);
  }
}

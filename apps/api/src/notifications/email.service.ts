import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    const from = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL');
    await this.resend.emails.send({ from, to, subject, text });
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  async send(to: string, subject: string, text: string): Promise<void> {
    const resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
    const from = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL');
    await resend.emails.send({ from, to, subject, text });
  }
}

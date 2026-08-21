import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PushService } from './push.service';

@Module({
  providers: [PushService, EmailService],
  exports: [PushService, EmailService],
})
export class NotificationsModule {}

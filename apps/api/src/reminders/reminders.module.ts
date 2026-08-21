import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { RemindersController } from './reminders.controller';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';

@Module({
  imports: [NotificationsModule, UsersModule],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersRepository],
  exports: [RemindersService],
})
export class RemindersModule {}

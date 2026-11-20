import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PasswordTokensService } from './password-tokens.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [NotificationsModule, TenantsModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, PasswordTokensService],
  exports: [UsersRepository, PasswordTokensService],
})
export class UsersModule {}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/push-tokens')
  registerPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.usersService.registerPushToken(user.tenantId, user.userId, dto);
  }
}

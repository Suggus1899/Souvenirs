import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listTeam(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listTeam(user.tenantId);
  }

  @Post('invitations')
  @Roles(Role.OWNER)
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteUserDto) {
    return this.usersService.invite(user.tenantId, dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.tenantId, user.userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      user.tenantId,
      user.userId,
      dto.name,
    );
  }

  @Post('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.tenantId, user.userId, dto);
  }

  @Post('me/push-tokens')
  registerPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.usersService.registerPushToken(user.tenantId, user.userId, dto);
  }

  /** Called by the mobile app on logout so the device stops receiving this user's reminders. */
  @Delete('me/push-tokens/:token')
  @HttpCode(HttpStatus.NO_CONTENT)
  unregisterPushToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.usersService.unregisterPushToken(
      user.tenantId,
      user.userId,
      token,
    );
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.usersService.removeMember(user.tenantId, user.userId, id);
  }
}

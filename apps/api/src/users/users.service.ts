import { Injectable } from '@nestjs/common';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../jwt-payload.interface';

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();
    return request.user.tenantId;
  },
);

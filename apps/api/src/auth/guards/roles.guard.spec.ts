import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function buildContext(role: Role, requiredRoles: Role[] | undefined) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    };
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
    } as unknown as ExecutionContext;
    return {
      guard: new RolesGuard(reflector as unknown as Reflector),
      context,
    };
  }

  it('allows access when no roles are required', () => {
    const { guard, context } = buildContext(Role.ASSISTANT, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies an ASSISTANT from an OWNER-only route', () => {
    const { guard, context } = buildContext(Role.ASSISTANT, [Role.OWNER]);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows an OWNER on an OWNER-only route', () => {
    const { guard, context } = buildContext(Role.OWNER, [Role.OWNER]);
    expect(guard.canActivate(context)).toBe(true);
  });
});

import { Injectable } from '@nestjs/common';
import { Plan, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantPrismaService } from '../prisma/tenant-prisma.service';

interface CreateWithOwnerInput {
  tenantName: string;
  ownerName: string;
  ownerEmail: string;
  passwordHash: string;
}

interface ApplySubscriptionStateInput {
  plan: Plan;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
}

@Injectable()
export class TenantsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantDb: TenantPrismaService,
  ) {}

  /** Pre-auth: no tenant exists yet, so this must run on the owner connection. */
  createWithOwner(input: CreateWithOwnerInput) {
    return this.prisma.tenant.create({
      data: {
        name: input.tenantName,
        users: {
          create: {
            name: input.ownerName,
            email: input.ownerEmail,
            passwordHash: input.passwordHash,
            role: Role.OWNER,
          },
        },
      },
      include: { users: true },
    });
  }

  /** Authenticated self-lookup — tenantId is the tenant's own id, matches the RLS policy on `tenants`. */
  findById(tenantId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.tenant.findUnique({ where: { id: tenantId } }),
    );
  }

  /** Called from the Stripe webhook, before any tenant context is known — stays on the owner connection. */
  findByStripeAccountId(stripeAccountId: string) {
    return this.prisma.tenant.findFirst({ where: { stripeAccountId } });
  }

  setStripeAccountId(tenantId: string, stripeAccountId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.tenant.update({ where: { id: tenantId }, data: { stripeAccountId } }),
    );
  }

  /** Called from the Stripe webhook (no tenant context yet) — stays on the owner connection. */
  setStripeOnboarded(id: string, stripeOnboarded: boolean) {
    return this.prisma.tenant.update({
      where: { id },
      data: { stripeOnboarded },
    });
  }

  setStripeCustomerId(tenantId: string, stripeCustomerId: string) {
    return this.tenantDb.run(tenantId, (tx) =>
      tx.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId } }),
    );
  }

  /** Called from the Stripe webhook, before any tenant context is known — stays on the owner connection. */
  findByStripeCustomerId(stripeCustomerId: string) {
    return this.prisma.tenant.findFirst({ where: { stripeCustomerId } });
  }

  /** Called from the Stripe webhook — stays on the owner connection. */
  applySubscriptionState(id: string, input: ApplySubscriptionStateInput) {
    return this.prisma.tenant.update({ where: { id }, data: input });
  }
}

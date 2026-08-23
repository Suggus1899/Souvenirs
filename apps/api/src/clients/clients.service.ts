import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  create(tenantId: string, dto: CreateClientDto) {
    return this.clientsRepository.create(tenantId, dto);
  }

  findAll(tenantId: string) {
    return this.clientsRepository.findAll(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.clientsRepository.findOne(tenantId, id);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);
    return this.clientsRepository.update(tenantId, id, dto);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    try {
      await this.clientsRepository.remove(tenantId, id);
    } catch (error) {
      // Postgres reports a blocked ON DELETE RESTRICT as SQLSTATE 23001, which
      // Prisma surfaces as PrismaClientUnknownRequestError rather than the P2003
      // known error code (that one covers implicit FK checks on insert/update).
      const isForeignKeyRestriction =
        (error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2003') ||
        (error instanceof Error &&
          error.message.includes('foreign key constraint'));
      if (isForeignKeyRestriction) {
        throw new BadRequestException(
          'No se puede eliminar un cliente con facturas asociadas',
        );
      }
      throw error;
    }
  }
}

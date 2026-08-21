import { Injectable, NotFoundException } from '@nestjs/common';
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
    await this.clientsRepository.remove(tenantId, id);
  }
}

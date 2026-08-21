import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesRepository } from './services.repository';

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  create(tenantId: string, dto: CreateServiceDto) {
    return this.servicesRepository.create(tenantId, dto);
  }

  findAll(tenantId: string) {
    return this.servicesRepository.findAll(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const service = await this.servicesRepository.findOne(tenantId, id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async update(tenantId: string, id: string, dto: UpdateServiceDto) {
    await this.findOne(tenantId, id);
    return this.servicesRepository.update(tenantId, id, dto);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.servicesRepository.remove(tenantId, id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { ServicesService } from '../services/services.service';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(tenantId: string, createdById: string, dto: CreateBookingDto) {
    await this.clientsService.findOne(tenantId, dto.clientId);
    if (dto.serviceId) {
      await this.servicesService.findOne(tenantId, dto.serviceId);
    }
    return this.bookingsRepository.create(tenantId, createdById, dto);
  }

  findAll(tenantId: string) {
    return this.bookingsRepository.findAll(tenantId);
  }

  async findOne(tenantId: string, id: string) {
    const booking = await this.bookingsRepository.findOne(tenantId, id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async update(tenantId: string, id: string, dto: UpdateBookingDto) {
    await this.findOne(tenantId, id);
    if (dto.clientId) {
      await this.clientsService.findOne(tenantId, dto.clientId);
    }
    if (dto.serviceId) {
      await this.servicesService.findOne(tenantId, dto.serviceId);
    }
    return this.bookingsRepository.update(tenantId, id, dto);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.bookingsRepository.remove(tenantId, id);
  }
}

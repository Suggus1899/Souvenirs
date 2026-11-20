import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { RemindersService } from '../reminders/reminders.service';
import { ServicesService } from '../services/services.service';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly clientsService: ClientsService,
    private readonly servicesService: ServicesService,
    private readonly remindersService: RemindersService,
  ) {}

  async create(tenantId: string, createdById: string, dto: CreateBookingDto) {
    const client = await this.clientsService.findOne(tenantId, dto.clientId);
    if (dto.serviceId) {
      await this.servicesService.findOne(tenantId, dto.serviceId);
    }
    if (!dto.allowOverlap) {
      await this.assertNoOverlap(
        tenantId,
        new Date(dto.scheduledAt),
        dto.durationMinutes,
      );
    }
    const booking = await this.bookingsRepository.create(
      tenantId,
      createdById,
      dto,
    );
    await this.remindersService.scheduleForBooking(tenantId, {
      ...booking,
      clientName: client.name,
    });
    return booking;
  }

  findAll(tenantId: string, query: ListBookingsQueryDto = {}) {
    return this.bookingsRepository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    const booking = await this.bookingsRepository.findOne(tenantId, id);
    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return booking;
  }

  async update(tenantId: string, id: string, dto: UpdateBookingDto) {
    const current = await this.findOne(tenantId, id);
    if (dto.clientId) {
      await this.clientsService.findOne(tenantId, dto.clientId);
    }
    if (dto.serviceId) {
      await this.servicesService.findOne(tenantId, dto.serviceId);
    }
    const timeChanged =
      dto.scheduledAt !== undefined || dto.durationMinutes !== undefined;
    if (timeChanged && !dto.allowOverlap && dto.status !== 'CANCELLED') {
      await this.assertNoOverlap(
        tenantId,
        dto.scheduledAt ? new Date(dto.scheduledAt) : current.scheduledAt,
        dto.durationMinutes ?? current.durationMinutes,
        id,
      );
    }
    const booking = await this.bookingsRepository.update(tenantId, id, dto);
    const client = await this.clientsService.findOne(
      tenantId,
      booking.clientId,
    );
    await this.remindersService.scheduleForBooking(tenantId, {
      ...booking,
      clientName: client.name,
    });
    return booking;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.bookingsRepository.remove(tenantId, id);
    await this.remindersService.dismissForBooking(tenantId, id);
  }

  private async assertNoOverlap(
    tenantId: string,
    start: Date,
    durationMinutes: number,
    excludeId?: string,
  ) {
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const clash = await this.bookingsRepository.findOverlapping(
      tenantId,
      start,
      end,
      excludeId,
    );
    if (clash) {
      throw new ConflictException(
        'Ya tienes otra reserva en ese horario. Cámbialo o confirma que quieres solaparlas.',
      );
    }
  }
}

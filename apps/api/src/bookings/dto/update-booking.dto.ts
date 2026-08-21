import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

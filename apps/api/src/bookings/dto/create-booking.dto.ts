import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsString()
  @MinLength(2)
  title: string;

  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

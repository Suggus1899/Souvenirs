import { BookingStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';

export class ListBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}

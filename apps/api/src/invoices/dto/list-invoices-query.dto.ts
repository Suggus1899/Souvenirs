import { InvoiceStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';

export class ListInvoicesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  clientId?: string;
}

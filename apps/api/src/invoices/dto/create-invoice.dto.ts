import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { InvoiceItemDto } from './invoice-item.dto';

export class CreateInvoiceDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  /** Line items. When present, the total is computed from them and `totalAmount` is ignored. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items?: InvoiceItemDto[];

  /** Required only when no `items` are sent (single-amount invoice). */
  @ValidateIf((dto: CreateInvoiceDto) => !dto.items?.length)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  totalAmount?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

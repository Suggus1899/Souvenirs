import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

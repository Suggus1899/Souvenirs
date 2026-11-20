import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class InvoiceItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  description: string;

  @IsInt()
  @Min(1)
  @Max(10_000)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  unitPrice: number;
}

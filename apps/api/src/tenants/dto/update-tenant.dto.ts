import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  /** Days relative to the due date (negative = before). Empty array = no reminders. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(-30, { each: true })
  @Max(30, { each: true })
  reminderOffsetsDays?: number[];

  @IsOptional()
  @IsBoolean()
  clientRemindersEnabled?: boolean;
}

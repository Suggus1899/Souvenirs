import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination-query.dto';

export class ListClientsQueryDto extends PaginationQueryDto {
  /** Case-insensitive match on name, email or phone. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

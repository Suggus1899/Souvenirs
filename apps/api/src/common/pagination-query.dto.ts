import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 100;
export const MAX_PAGE_SIZE = 200;

/** `?take=&skip=` on list endpoints. Lists stay plain arrays; the page size is capped server-side. */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}

export function pageArgs(query: PaginationQueryDto) {
  return { take: query.take ?? DEFAULT_PAGE_SIZE, skip: query.skip ?? 0 };
}

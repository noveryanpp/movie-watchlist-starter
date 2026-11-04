import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListMoviesQueryDto {
  @ApiPropertyOptional({
    example: 'Sci-Fi',
    description: 'Filter movies by genre (case-insensitive exact match)',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    example: 'Inception',
    description: 'Search movies by title or director (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddToWatchlistDto {
  @ApiProperty({ example: 1, description: 'ID of the movie to add to watchlist' })
  @ValidateIf((o) => o.movieId !== undefined || o.movie_id === undefined)
  @IsInt()
  @Min(1)
  movieId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Optional snake_case alias for movieId',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  movie_id?: number;
}

import {
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

export class AddToWatchlistDto {
  @ValidateIf((o) => o.movieId !== undefined || o.movie_id === undefined)
  @IsInt()
  @Min(1)
  movieId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  movie_id?: number;
}

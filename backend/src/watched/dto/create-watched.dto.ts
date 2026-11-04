import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateWatchedDto {
  @ValidateIf((o) => o.movieId !== undefined || o.movie_id === undefined)
  @IsInt()
  @Min(1)
  movieId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  movie_id?: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ValidateIf((o) => o.review !== undefined || o.opinion === undefined)
  @IsString()
  @IsNotEmpty()
  review?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  opinion?: string;
}


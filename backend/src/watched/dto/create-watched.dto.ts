import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 1, description: 'ID of the watched movie' })
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

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Star rating from 1 to 5',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Filmnya luar biasa, alur mimpi berlapis yang sangat brilian!',
    description: 'User written review or thoughts on the movie',
  })
  @ValidateIf((o) => o.review !== undefined || o.opinion === undefined)
  @IsString()
  @IsNotEmpty()
  review?: string;

  @ApiPropertyOptional({
    example: 'Filmnya luar biasa!',
    description: 'Optional alias for review sent by companion frontend',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  opinion?: string;
}

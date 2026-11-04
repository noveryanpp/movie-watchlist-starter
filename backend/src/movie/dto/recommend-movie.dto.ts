import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class RecommendMovieDto {
  @ValidateIf(
    (o) =>
      o.prompt !== undefined ||
      (o.query === undefined && o.description === undefined),
  )
  @IsString()
  @IsNotEmpty()
  prompt?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  query?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}


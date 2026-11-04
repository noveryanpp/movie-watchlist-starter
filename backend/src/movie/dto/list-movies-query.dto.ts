import { IsOptional, IsString } from 'class-validator';

export class ListMoviesQueryDto {
  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  search?: string;
}


import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class RecommendMovieDto {
  @ApiProperty({
    example: 'Saya mau film misteri dengan alur lambat dan atmosfer mendalam',
    description: 'User mood or movie preference description',
  })
  @ValidateIf(
    (o) =>
      o.prompt !== undefined ||
      (o.query === undefined && o.description === undefined),
  )
  @IsString()
  @IsNotEmpty()
  prompt?: string;

  @ApiPropertyOptional({
    example: 'Mind-bending sci-fi thriller',
    description: 'Optional alias for prompt sent by companion frontend',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  query?: string;

  @ApiPropertyOptional({
    example: 'Mind-bending sci-fi thriller',
    description: 'Optional alias for prompt sent by companion frontend',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}

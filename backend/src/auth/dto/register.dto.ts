import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alice', minLength: 3, maxLength: 50 })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6, maxLength: 72 })
  @IsString()
  @MinLength(6)
  @MaxLength(72) // bcrypt only uses the first 72 bytes
  password: string;
}

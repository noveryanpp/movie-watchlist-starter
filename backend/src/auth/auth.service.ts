import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

export interface PublicUser {
  id: number;
  username: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email.toLowerCase();

    if (await this.userService.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }
    if (await this.userService.findByUsername(dto.username)) {
      throw new ConflictException('Username is already taken');
    }

    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.userService.createUser({
        username: dto.username,
        email,
        password,
      });
      return this.toPublicUser(user);
    } catch (err: any) {
      // Unique constraint violated by a concurrent request
      if (err?.code === 'P2002') {
        throw new ConflictException('Email or username is already in use');
      }
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<{ token: string; user: PublicUser }> {
    const user = await this.userService.findByEmail(dto.email.toLowerCase());
    const valid = user && (await bcrypt.compare(dto.password, user.password));
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      email: user.email,
    });

    return { token, user: this.toPublicUser(user) };
  }

  private toPublicUser(user: PublicUser): PublicUser {
    return { id: user.id, username: user.username, email: user.email };
  }
}


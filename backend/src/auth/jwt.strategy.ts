import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Result is attached to request.user
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return { id: user.id, username: user.username, email: user.email };
  }
}


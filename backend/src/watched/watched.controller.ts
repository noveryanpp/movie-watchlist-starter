import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { WatchedService } from './watched.service';
import { CreateWatchedDto } from './dto/create-watched.dto';

@Controller('watched')
@UseGuards(JwtAuthGuard)
export class WatchedController {
  constructor(private readonly watchedService: WatchedService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.watchedService.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  logWatched(@CurrentUser() user: AuthUser, @Body() dto: CreateWatchedDto) {
    return this.watchedService.logWatched(user.id, dto);
  }
}


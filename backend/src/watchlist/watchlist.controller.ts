import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { WatchlistService } from './watchlist.service';
import { AddToWatchlistDto } from './dto/add-to-watchlist.dto';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.watchlistService.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  add(@CurrentUser() user: AuthUser, @Body() dto: AddToWatchlistDto) {
    return this.watchlistService.add(user.id, dto);
  }

  @Delete(':movieId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    return this.watchlistService.remove(user.id, movieId);
  }
}


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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { WatchlistService } from './watchlist.service';
import { AddToWatchlistDto } from './dto/add-to-watchlist.dto';

@ApiTags('Watchlist')
@ApiBearerAuth('JWT-auth')
@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: "Get the current user's watchlist" })
  @ApiOkResponse({
    description: 'Array of watchlist entries with nested movie details',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.watchlistService.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a movie to the current user's watchlist" })
  @ApiCreatedResponse({ description: 'Movie added to watchlist' })
  @ApiBadRequestResponse({ description: 'Invalid movieId payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiNotFoundResponse({ description: 'Movie does not exist in catalog' })
  @ApiConflictResponse({ description: 'Movie is already in user watchlist' })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddToWatchlistDto) {
    return this.watchlistService.add(user.id, dto);
  }

  @Delete(':movieId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a movie from the current user's watchlist" })
  @ApiParam({ name: 'movieId', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Movie removed from watchlist' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiNotFoundResponse({ description: 'Movie not found in user watchlist' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('movieId', ParseIntPipe) movieId: number,
  ) {
    return this.watchlistService.remove(user.id, movieId);
  }
}

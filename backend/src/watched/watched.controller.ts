import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { WatchedService } from './watched.service';
import { CreateWatchedDto } from './dto/create-watched.dto';

@ApiTags('Watched & Reviews')
@ApiBearerAuth('JWT-auth')
@Controller('watched')
@UseGuards(JwtAuthGuard)
export class WatchedController {
  constructor(private readonly watchedService: WatchedService) {}

  @Get()
  @ApiOperation({
    summary: "Get the current user's watched movie history and reviews",
  })
  @ApiOkResponse({
    description: 'Array of watched/review entries with nested movie details',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.watchedService.findAll(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Log a movie as watched with a 1–5 star rating and written review (updates existing review if already logged)',
  })
  @ApiCreatedResponse({ description: 'Watched review logged or updated' })
  @ApiBadRequestResponse({
    description: 'Invalid movieId, rating out of 1–5 range, or empty review',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  @ApiNotFoundResponse({ description: 'Movie does not exist in catalog' })
  logWatched(@CurrentUser() user: AuthUser, @Body() dto: CreateWatchedDto) {
    return this.watchedService.logWatched(user.id, dto);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MovieService } from './movie.service';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';
import { RecommendMovieDto } from './dto/recommend-movie.dto';

@ApiTags('Movies')
@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @ApiOperation({
    summary: 'List all movies with optional genre and search filters',
  })
  @ApiOkResponse({ description: 'Array of movies matching the filter criteria' })
  findAll(@Query() query: ListMoviesQueryDto) {
    return this.movieService.findAll(query);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Get AI movie recommendation from Gemini grounded on the local 20-movie catalog',
  })
  @ApiOkResponse({
    description:
      'Returns recommended movie_id, Gemini reasoning, and full movie object',
  })
  @ApiBadRequestResponse({ description: 'Missing or empty prompt' })
  @ApiServiceUnavailableResponse({
    description: 'Gemini API unavailable or unconfigured',
  })
  recommend(@Body() dto: RecommendMovieDto) {
    return this.movieService.recommend(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full details of a single movie by ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Movie details found' })
  @ApiBadRequestResponse({ description: 'Invalid non-numeric movie ID' })
  @ApiNotFoundResponse({ description: 'Movie with specified ID not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }
}

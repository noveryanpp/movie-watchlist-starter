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
import { MovieService } from './movie.service';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';
import { RecommendMovieDto } from './dto/recommend-movie.dto';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  findAll(@Query() query: ListMoviesQueryDto) {
    return this.movieService.findAll(query);
  }

  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  recommend(@Body() dto: RecommendMovieDto) {
    return this.movieService.recommend(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.findOne(id);
  }
}

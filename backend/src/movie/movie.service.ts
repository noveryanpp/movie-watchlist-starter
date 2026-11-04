import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Movie } from '../../prisma/generated/client';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';

@Injectable()
export class MovieService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListMoviesQueryDto): Promise<Movie[]> {
    const search = query.search?.trim();
    const genre = query.genre?.trim().toLowerCase();

    const movies = await this.prisma.movie.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { director: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { id: 'asc' },
    });

    // Prisma's `has` on String[] is case-sensitive, and the catalog is tiny
    // (20 rows), so the genre filter is applied case-insensitively in memory.
    if (!genre) return movies;
    return movies.filter((m) => m.genres.some((g) => g.toLowerCase() === genre));
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with id ${id} not found`);
    }
    return movie;
  }
}


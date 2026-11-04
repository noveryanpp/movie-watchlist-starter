import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWatchlistDto } from './dto/add-to-watchlist.dto';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: number, dto: AddToWatchlistDto) {
    const movieId = dto.movieId ?? dto.movie_id;

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with id ${movieId} not found`);
    }

    const existing = await this.prisma.watchlist.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });
    if (existing) {
      throw new ConflictException('Movie is already in your watchlist');
    }

    try {
      return await this.prisma.watchlist.create({
        data: { userId, movieId },
        include: { movie: true },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Movie is already in your watchlist');
      }
      throw err;
    }
  }

  async remove(userId: number, movieId: number) {
    const existing = await this.prisma.watchlist.findUnique({
      where: {
        userId_movieId: { userId, movieId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Movie not found in your watchlist');
    }

    await this.prisma.watchlist.delete({
      where: {
        userId_movieId: { userId, movieId },
      },
    });

    return { message: 'Movie removed from watchlist', movieId };
  }
}


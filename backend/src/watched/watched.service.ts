import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWatchedDto } from './dto/create-watched.dto';

@Injectable()
export class WatchedService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async logWatched(userId: number, dto: CreateWatchedDto) {
    const movieId = dto.movieId ?? dto.movie_id;
    const reviewText = (dto.review ?? dto.opinion ?? '').trim();

    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      throw new NotFoundException(`Movie with id ${movieId} not found`);
    }

    const existing = await this.prisma.review.findFirst({
      where: { userId, movieId },
    });

    return existing
      ? await this.prisma.review.update({
          where: { id: existing.id },
          data: { rating: dto.rating, review: reviewText },
          include: { movie: true },
        })
      : await this.prisma.review.create({
          data: {
            userId,
            movieId: movieId!,
            rating: dto.rating,
            review: reviewText,
          },
          include: { movie: true },
        });
  }
}


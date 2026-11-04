import { NotFoundException } from '@nestjs/common';
import { WatchedService } from './watched.service';

const sampleMovie = { id: 1, title: 'Inception', year: 2010 };

describe('WatchedService', () => {
  const prisma = {
    movie: { findUnique: jest.fn() },
    review: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: WatchedService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WatchedService(prisma as any);
  });

  it('findAll returns user reviews with movie details ordered by createdAt desc', async () => {
    const items = [
      { id: 1, userId: 10, movieId: 1, rating: 5, review: 'Great!', movie: sampleMovie },
    ];
    prisma.review.findMany.mockResolvedValue(items);

    const result = await service.findAll(10);
    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { userId: 10 },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(items);
  });

  it('logWatched creates a new review when none exists for user and movie', async () => {
    prisma.movie.findUnique.mockResolvedValue(sampleMovie);
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.review.create.mockResolvedValue({
      id: 1,
      userId: 10,
      movieId: 1,
      rating: 5,
      review: 'Amazing film!',
      movie: sampleMovie,
    });

    const result = await service.logWatched(10, {
      movieId: 1,
      rating: 5,
      review: 'Amazing film!',
    });

    expect(prisma.review.create).toHaveBeenCalledWith({
      data: { userId: 10, movieId: 1, rating: 5, review: 'Amazing film!' },
      include: { movie: true },
    });
    expect(result.rating).toBe(5);
  });

  it('logWatched updates an existing review when user already reviewed the movie', async () => {
    prisma.movie.findUnique.mockResolvedValue(sampleMovie);
    prisma.review.findFirst.mockResolvedValue({ id: 42, userId: 10, movieId: 1 });
    prisma.review.update.mockResolvedValue({
      id: 42,
      userId: 10,
      movieId: 1,
      rating: 4,
      review: 'Updated thoughts',
      movie: sampleMovie,
    });

    const result = await service.logWatched(10, {
      movie_id: 1,
      rating: 4,
      opinion: 'Updated thoughts',
    });

    expect(prisma.review.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { rating: 4, review: 'Updated thoughts' },
      include: { movie: true },
    });
    expect(result.id).toBe(42);
  });

  it('logWatched throws 404 when movie does not exist', async () => {
    prisma.movie.findUnique.mockResolvedValue(null);
    await expect(
      service.logWatched(10, { movieId: 999, rating: 5, review: 'Test' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

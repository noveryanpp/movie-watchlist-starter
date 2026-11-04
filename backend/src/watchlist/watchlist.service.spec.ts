import { ConflictException, NotFoundException } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';

const sampleMovie = { id: 1, title: 'Inception', year: 2010 };

describe('WatchlistService', () => {
  const prisma = {
    movie: { findUnique: jest.fn() },
    watchlist: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: WatchlistService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WatchlistService(prisma as any);
  });

  it('findAll returns watchlist items with movie details ordered by createdAt desc', async () => {
    const items = [{ id: 1, userId: 10, movieId: 1, movie: sampleMovie }];
    prisma.watchlist.findMany.mockResolvedValue(items);

    const result = await service.findAll(10);
    expect(prisma.watchlist.findMany).toHaveBeenCalledWith({
      where: { userId: 10 },
      include: { movie: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(items);
  });

  it('add creates a watchlist record when movie exists and is not duplicated', async () => {
    prisma.movie.findUnique.mockResolvedValue(sampleMovie);
    prisma.watchlist.findUnique.mockResolvedValue(null);
    prisma.watchlist.create.mockResolvedValue({
      id: 1,
      userId: 10,
      movieId: 1,
      movie: sampleMovie,
    });

    const result = await service.add(10, { movieId: 1 });
    expect(result.movieId).toBe(1);
    expect(result.movie).toEqual(sampleMovie);
  });

  it('add throws 404 when movie does not exist', async () => {
    prisma.movie.findUnique.mockResolvedValue(null);
    await expect(service.add(10, { movieId: 999 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('add throws 409 when movie is already in watchlist', async () => {
    prisma.movie.findUnique.mockResolvedValue(sampleMovie);
    prisma.watchlist.findUnique.mockResolvedValue({ id: 1, userId: 10, movieId: 1 });
    await expect(service.add(10, { movieId: 1 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('remove deletes the watchlist record and returns confirmation', async () => {
    prisma.watchlist.findUnique.mockResolvedValue({ id: 1, userId: 10, movieId: 1 });
    prisma.watchlist.delete.mockResolvedValue({ id: 1 });

    const result = await service.remove(10, 1);
    expect(prisma.watchlist.delete).toHaveBeenCalledWith({
      where: { userId_movieId: { userId: 10, movieId: 1 } },
    });
    expect(result).toEqual({ message: 'Movie removed from watchlist', movieId: 1 });
  });

  it('remove throws 404 when item is not in user watchlist', async () => {
    prisma.watchlist.findUnique.mockResolvedValue(null);
    await expect(service.remove(10, 1)).rejects.toBeInstanceOf(NotFoundException);
  });
});


import { NotFoundException } from '@nestjs/common';
import { MovieService } from './movie.service';

const catalog = [
  { id: 1, title: 'Inception', director: 'Christopher Nolan', genres: ['Sci-Fi', 'Action', 'Thriller'] },
  { id: 2, title: 'Parasite', director: 'Bong Joon-ho', genres: ['Drama', 'Thriller', 'Comedy'] },
  { id: 6, title: 'Spirited Away', director: 'Hayao Miyazaki', genres: ['Animation', 'Adventure', 'Fantasy'] },
];

describe('MovieService', () => {
  const prisma = { movie: { findMany: jest.fn(), findUnique: jest.fn() } };
  let service: MovieService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.movie.findMany.mockResolvedValue(catalog);
    service = new MovieService(prisma as any);
  });

  it('returns everything ordered by id when no filters are given', async () => {
    const result = await service.findAll({});
    expect(prisma.movie.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { id: 'asc' },
    });
    expect(result).toHaveLength(3);
  });

  it('searches title or director case-insensitively in the DB', async () => {
    await service.findAll({ search: ' nolan ' });
    expect(prisma.movie.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { title: { contains: 'nolan', mode: 'insensitive' } },
          { director: { contains: 'nolan', mode: 'insensitive' } },
        ],
      },
      orderBy: { id: 'asc' },
    });
  });

  it('filters genre by case-insensitive exact match', async () => {
    const result = await service.findAll({ genre: 'sci-fi' });
    expect(result.map((m) => m.id)).toEqual([1]);
    expect(await service.findAll({ genre: 'sci' })).toHaveLength(0);
  });

  it('findOne returns the movie', async () => {
    prisma.movie.findUnique.mockResolvedValue(catalog[0]);
    await expect(service.findOne(1)).resolves.toEqual(catalog[0]);
  });

  it('findOne throws 404 when missing', async () => {
    prisma.movie.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});


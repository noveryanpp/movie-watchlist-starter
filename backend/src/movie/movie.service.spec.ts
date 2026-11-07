import {
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MovieService } from './movie.service';

const catalog = [
  {
    id: 1,
    title: 'Inception',
    year: 2010,
    director: 'Christopher Nolan',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    rating: 8.8,
    duration: '148 min',
    synopsis: 'A thief who steals corporate secrets through dream-sharing technology.',
    poster_url: 'https://example.com/1.jpg',
    cast: ['Leonardo DiCaprio'],
  },
  {
    id: 2,
    title: 'Parasite',
    year: 2019,
    director: 'Bong Joon-ho',
    genres: ['Drama', 'Thriller', 'Comedy'],
    rating: 8.5,
    duration: '132 min',
    synopsis: 'Greed and class discrimination threaten the newly formed symbiotic relationship.',
    poster_url: 'https://example.com/2.jpg',
    cast: ['Song Kang-ho'],
  },
  {
    id: 14,
    title: 'Memento',
    year: 2000,
    director: 'Christopher Nolan',
    genres: ['Mystery', 'Thriller'],
    rating: 8.4,
    duration: '113 min',
    synopsis: 'A man with short-term memory loss attempts to track down his wife murderer.',
    poster_url: 'https://example.com/14.jpg',
    cast: ['Guy Pearce'],
  },
];

describe('MovieService', () => {
  const prisma = { movie: { findMany: jest.fn(), findUnique: jest.fn() } };
  let service: MovieService;
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    prisma.movie.findMany.mockResolvedValue(catalog);
    service = new MovieService(prisma as any);
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalEnv;
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
    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('recommend', () => {
    it('grounds Gemini with local catalog and returns movie_id, reasoning, and movie', async () => {
      const generateContent = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          movie_id: 14,
          reasoning: 'Memento sangat cocok dengan suasana misteri dan alur mundur.',
        }),
      });
      jest
        .spyOn(service as any, 'createGenAiClient')
        .mockReturnValue({ models: { generateContent } });

      const result = await service.recommend({
        prompt: 'Saya mau film misteri dengan alur lambat',
      });

      expect(generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.5-flash-lite',
          contents: 'Saya mau film misteri dengan alur lambat',
        }),
      );
      const callArg = generateContent.mock.calls[0][0];
      expect(callArg.config.systemInstruction).toContain('ID: 14 | Title: "Memento"');
      expect(result).toEqual({
        movie_id: 14,
        reasoning: 'Memento sangat cocok dengan suasana misteri dan alur mundur.',
        movie: catalog[2],
      });
    });

    it('throws 503 when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      await expect(
        service.recommend({ prompt: 'thriller' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('throws 503 when Gemini returns a movie_id not in the local catalog', async () => {
      jest.spyOn(service as any, 'createGenAiClient').mockReturnValue({
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({ movie_id: 999, reasoning: 'Hallucinated movie' }),
          }),
        },
      });

      await expect(
        service.recommend({ prompt: 'thriller' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});

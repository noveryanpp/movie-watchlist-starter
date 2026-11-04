import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { Movie } from '../../prisma/generated/client';
import { ListMoviesQueryDto } from './dto/list-movies-query.dto';
import { RecommendMovieDto } from './dto/recommend-movie.dto';

export interface MovieRecommendationResult {
  movie_id: number;
  reasoning: string;
  movie: Movie;
}

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
    return movies.filter((m) =>
      m.genres.some((g) => g.toLowerCase() === genre),
    );
  }

  async findOne(id: number): Promise<Movie> {
    const movie = await this.prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie with id ${id} not found`);
    }
    return movie;
  }

  async recommend(dto: RecommendMovieDto): Promise<MovieRecommendationResult> {
    const userPrompt = (dto.prompt ?? dto.query ?? dto.description ?? '').trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY is not configured on the server',
      );
    }

    const movies = await this.prisma.movie.findMany({
      orderBy: { id: 'asc' },
    });
    if (movies.length === 0) {
      throw new NotFoundException(
        'No movies available in the local database catalog',
      );
    }

    const catalogContext = movies
      .map(
        (m) =>
          `ID: ${m.id} | Title: "${m.title}" (${m.year}) | Director: ${m.director} | Genres: [${m.genres.join(', ')}] | Rating: ${m.rating} | Synopsis: ${m.synopsis}`,
      )
      .join('\n');

    const systemInstruction = [
      'You are FilmLog AI, an expert movie curator.',
      'CRITICAL GROUNDING RULE: You MUST ONLY recommend ONE movie that exists in the provided Local Movie Catalog below.',
      'Do NOT invent, hallucinate, or suggest any movie outside of this catalog.',
      'Match the user prompt/mood to the most suitable movie based on its genres, synopsis, director, and themes.',
      'Write the "reasoning" in the same language as the user prompt (default to Indonesian if ambiguous), explaining clearly why this specific movie from the catalog fits their request.',
      'Return strictly a JSON object with properties: "movie_id" (integer ID from the catalog) and "reasoning" (string).',
      '',
      '=== LOCAL MOVIE CATALOG ===',
      catalogContext,
    ].join('\n');

    try {
      const ai = this.createGenAiClient(apiKey);
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              movie_id: {
                type: Type.INTEGER,
                description:
                  'The exact integer ID of the recommended movie from the local catalog.',
              },
              reasoning: {
                type: Type.STRING,
                description:
                  'Concise explanation of why this movie matches the user prompt.',
              },
            },
            required: ['movie_id', 'reasoning'],
          },
          temperature: 0.4,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Empty response received from Gemini API');
      }

      const cleanedJson = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');
      const parsed = JSON.parse(cleanedJson);

      const movieId = Number(parsed.movie_id ?? parsed.movieId);
      const reasoning = String(parsed.reasoning ?? '').trim();

      const matchedMovie = movies.find((m) => m.id === movieId);
      if (!matchedMovie || !reasoning) {
        throw new Error(
          `Gemini returned an invalid or out-of-catalog movie_id (${parsed.movie_id})`,
        );
      }

      return {
        movie_id: matchedMovie.id,
        reasoning,
        movie: matchedMovie,
      };
    } catch (err: any) {
      throw new ServiceUnavailableException(
        `AI recommendation failed: ${err?.message || 'Upstream Gemini service error'}`,
      );
    }
  }

  protected createGenAiClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }
}

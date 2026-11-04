import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

interface MovieSeedData {
  id: number;
  title: string;
  year: number;
  director: string;
  genres: string[];
  rating: number;
  duration: string;
  synopsis: string;
  poster_url: string;
  cast: string[];
}

async function main() {
  console.log('--- Starting FilmLog Database Seeding ---');

  // 1. Seed Movies from data/movies.json
  const moviesFilePath = path.resolve(__dirname, '../../data/movies.json');
  if (!fs.existsSync(moviesFilePath)) {
    throw new Error(`Data file not found at: ${moviesFilePath}`);
  }

  const rawData = fs.readFileSync(moviesFilePath, 'utf-8');
  const moviesData: MovieSeedData[] = JSON.parse(rawData);

  console.log(`Loaded ${moviesData.length} movies from ${moviesFilePath}`);

  for (const movie of moviesData) {
    await prisma.movie.upsert({
      where: { id: movie.id },
      update: {
        title: movie.title,
        year: movie.year,
        director: movie.director,
        genres: movie.genres,
        rating: movie.rating,
        duration: movie.duration,
        synopsis: movie.synopsis,
        poster_url: movie.poster_url,
        cast: movie.cast,
      },
      create: {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        director: movie.director,
        genres: movie.genres,
        rating: movie.rating,
        duration: movie.duration,
        synopsis: movie.synopsis,
        poster_url: movie.poster_url,
        cast: movie.cast,
      },
    });
    console.log(`Upserted movie [${movie.id}] - ${movie.title}`);
  }

  // 2. Seed Users
  console.log('\n--- Seeding Users ---');
  // Default password for seeded demo users: 'password123'
  const hashedPassword = await bcrypt.hash('password123', 10);

  const initialUsers = [
    {
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword,
    },
    {
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword,
    },
    {
      username: 'charlie',
      email: 'charlie@example.com',
      password: hashedPassword,
    },
  ];

  const seededUsers = [];
  for (const u of initialUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        username: u.username,
        password: u.password,
      },
      create: {
        username: u.username,
        email: u.email,
        password: u.password,
      },
    });
    seededUsers.push(user);
    console.log(`Upserted user [${user.id}] - ${user.username} (${user.email})`);
  }

  // 3. Seed Watchlists
  console.log('\n--- Seeding Watchlists ---');
  // Sample watchlists mapping:
  // Alice (user 0) wants to watch Inception (1), Parasite (2), Interstellar (4)
  // Bob (user 1) wants to watch The Dark Knight (3), Pulp Fiction (5)
  // Charlie (user 2) wants to watch Spirited Away (6), Whiplash (7), The Matrix (8)
  const initialWatchlists = [
    { userId: seededUsers[0].id, movieId: 1 },
    { userId: seededUsers[0].id, movieId: 2 },
    { userId: seededUsers[0].id, movieId: 4 },
    { userId: seededUsers[1].id, movieId: 3 },
    { userId: seededUsers[1].id, movieId: 5 },
    { userId: seededUsers[2].id, movieId: 6 },
    { userId: seededUsers[2].id, movieId: 7 },
    { userId: seededUsers[2].id, movieId: 8 },
  ];

  for (const item of initialWatchlists) {
    await prisma.watchlist.upsert({
      where: {
        userId_movieId: {
          userId: item.userId,
          movieId: item.movieId,
        },
      },
      update: {},
      create: {
        userId: item.userId,
        movieId: item.movieId,
      },
    });
    console.log(`Upserted watchlist: User [${item.userId}] -> Movie [${item.movieId}]`);
  }

  // 4. Seed Reviews (Watched)
  console.log('\n--- Seeding Reviews (Watched History) ---');
  // Sample reviews:
  // Alice reviewed The Dark Knight (3) and Whiplash (7)
  // Bob reviewed Inception (1) and Pulp Fiction (5)
  // Charlie reviewed Parasite (2) and Spirited Away (6)
  const initialReviews = [
    {
      userId: seededUsers[0].id,
      movieId: 3,
      rating: 5,
      review: 'Masterpiece superhero movie! Heath Ledger sebagai Joker benar-benar luar biasa dan tak tertandingi.',
    },
    {
      userId: seededUsers[0].id,
      movieId: 7,
      rating: 5,
      review: 'Intens dari awal hingga akhir! Adegan drum solo terakhirnya membuat merinding.',
    },
    {
      userId: seededUsers[1].id,
      movieId: 1,
      rating: 5,
      review: 'Konsep mimpi berlapis yang brilian. Musik latar dari Hans Zimmer menambah ketegangan yang sempurna.',
    },
    {
      userId: seededUsers[1].id,
      movieId: 5,
      rating: 4,
      review: 'Dialog-dialog khas Tarantino yang sangat kuat dengan alur non-linear yang menyenangkan untuk dinikmati.',
    },
    {
      userId: seededUsers[2].id,
      movieId: 2,
      rating: 5,
      review: 'Sindiran sosial kelas masyarakat yang sangat tajam dan plot twist yang tidak terduga di paruh kedua film.',
    },
    {
      userId: seededUsers[2].id,
      movieId: 6,
      rating: 5,
      review: 'Animasi magis Studio Ghibli terbaik! Dunia roh dan perkembangan karakter Chihiro sangat menyentuh hati.',
    },
  ];

  // We find existing review or create if not present to avoid duplicate seeding
  for (const r of initialReviews) {
    const existing = await prisma.review.findFirst({
      where: {
        userId: r.userId,
        movieId: r.movieId,
      },
    });

    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: r.rating,
          review: r.review,
        },
      });
      console.log(`Updated review [${existing.id}]: User [${r.userId}] -> Movie [${r.movieId}]`);
    } else {
      const created = await prisma.review.create({
        data: {
          userId: r.userId,
          movieId: r.movieId,
          rating: r.rating,
          review: r.review,
        },
      });
      console.log(`Created review [${created.id}]: User [${r.userId}] -> Movie [${r.movieId}]`);
    }
  }

  console.log('\n--- FilmLog Database Seeding Finished Successfully ---');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

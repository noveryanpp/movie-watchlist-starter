# FilmLog — Backend API Service

Layanan backend **RESTful API** untuk platform **FilmLog (Movie Watchlist & Review Platform)** yang dibangun menggunakan **NestJS**, **Prisma ORM (v7)**, dan **PostgreSQL**.

Backend ini dirancang untuk melayani kebutuhan frontend companion (Letterboxd-style SPA) yang mencakup alur autentikasi pengguna, katalog film, manajemen watchlist, riwayat tontonan beserta ulasan, serta integrasi AI rekomendasi.

---

## 🛠️ Tech Stack & Prerequisites

- **Framework:** [NestJS](https://nestjs.com/) (Express platform)
- **Language:** TypeScript / Node.js (>= 18)
- **Database & ORM:** PostgreSQL dengan [Prisma ORM](https://www.prisma.io/) (`@prisma/client` & `@prisma/adapter-pg`)
- **Package Manager:** `npm` (atau `bun` / `pnpm` / `yarn`)

Pastikan PostgreSQL sudah terpasang dan berjalan di mesin lokal Anda sebelum memulai.

---

## 🚀 Panduan Menjalankan Backend

### 1. Masuk ke Direktori Backend & Install Dependencies
```bash
cd backend
npm install
```

### 2. Konfigurasi Environment Variables
Buat atau sesuaikan file `.env` pada root direktori `backend/`:
```bash
cp .env.example .env
```

Isi konfigurasi database dan kredensial yang dibutuhkan:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/filmlog_db?schema=public"

# Secrets
JWT_SECRET="your-super-secret-jwt-key"
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 3. Migrasi & Seed Database
Jalankan migrasi Prisma untuk membuat tabel-tabel yang diperlukan:
```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init

# (Opsional) Jalankan data seeder
npx prisma db seed
```
### 4. Menjalankan Server Aplikasi

Pilih salah satu mode eksekusi:

**Mode Pengembangan (Watch/Hot-reload):**
```bash
npm run dev
# atau: npm run start:dev
```

**Mode Standar:**
```bash
npm run start
```

**Mode Produksi:**
```bash
npm run build
npm run start:prod
```

Server backend secara default akan berjalan di `http://localhost:3000` (atau `http://localhost:8000` jika Anda menyesuaikan port agar langsung cocok dengan default frontend companion).

---

## ⚙️ Integrasi dengan Frontend Companion

Frontend FilmLog (`frontend/`) secara default menembak endpoint pada:
```text
http://localhost:8000/api
```

### Rekomendasi Pengaturan:
1. **CORS:** Pastikan CORS telah diaktifkan di NestJS (`main.ts`):
   ```typescript
   app.enableCors();
   ```
2. **Global Prefix:** Jika menggunakan routing dengan prefix `/api`, aktifkan global prefix di `main.ts`:
   ```typescript
   app.setGlobalPrefix('api');
   ```
3. **Port Match:** Sesuaikan port listen aplikasi di `src/main.ts` (misalnya `await app.listen(8000)`) atau sesuaikan setting port di menu **⚙️ Settings** pada Frontend Companion.

---

## 📋 Endpoint yang Didukung

Mengacu pada spesifikasi kontrak API di panduan utama:

### 1. Autentikasi
- `POST /api/auth/register` — Pendaftaran pengguna baru.
- `POST /api/auth/login` — Autentikasi pengguna & penerbitan token JWT.

### 2. Movies
- `GET /api/movies` — Mendapatkan daftar katalog film (mendukung query filter `genre` dan `search`).
- `GET /api/movies/:id` — Mendapatkan informasi detail lengkap satu film.

### 3. Watchlist (Protected — `Bearer <token>`)
- `GET /api/watchlist` — Daftar film di watchlist pengguna yang sedang aktif.
- `POST /api/watchlist` — Menambahkan film ke watchlist (`{ "movieId": number }`).
- `DELETE /api/watchlist/:movieId` — Menghapus film dari watchlist pengguna.

### 4. Watched & Review (Protected — `Bearer <token>`)
- `GET /api/watched` — Riwayat film yang telah ditonton beserta catatan ulasan dan rating.
- `POST /api/watched` — Mencatat film yang ditonton (`{ "movieId": number, "rating": number, "review": string }`).

### 5. AI Recommendation (Gemini API Integration ⭐)
- `POST /api/movies/recommend` — Rekomendasi film berbasis prompt/mood pengguna menggunakan Google Gemini LLM yang dipilih dari subset data lokal.

---

## 🧪 Testing & Database Studio

- **Menjalankan Unit Test:**
  ```bash
  npm run test
  ```
- **Menjalankan E2E Test:**
  ```bash
  npm run test:e2e
  ```
- **Inspeksi Data Visual (Prisma Studio):**
  ```bash
  npx prisma studio
  ```
  Buka `http://localhost:5555` pada browser untuk melihat dan memanipulasi data tabel secara langsung.

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MovieModule } from './movie/movie.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { WatchedModule } from './watched/watched.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    MovieModule,
    WatchlistModule,
    WatchedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

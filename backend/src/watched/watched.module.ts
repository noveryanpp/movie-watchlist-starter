import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WatchedController } from './watched.controller';
import { WatchedService } from './watched.service';

@Module({
  imports: [AuthModule],
  controllers: [WatchedController],
  providers: [WatchedService],
  exports: [WatchedService],
})
export class WatchedModule {}


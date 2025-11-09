import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register(),
    // ...existing imports
  ],
  // ...existing code
})
export class NoticeModule {}
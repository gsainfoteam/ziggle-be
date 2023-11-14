import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TagRepository } from './tag.repository';

@Module({
  imports: [PrismaModule],
  controllers: [TagController],
  providers: [TagService, TagRepository],
})
export class TagModule {}

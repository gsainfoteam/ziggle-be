import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomConfigModule } from '@lib/custom-config';

@Module({
  imports: [CustomConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

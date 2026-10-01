import { Module } from '@nestjs/common';
import { CustomConfigModule } from '@lib/custom-config';
import { PrismaModule } from '@lib/prisma';
import { McpApiKeyGuard } from './mcp-api-key.guard';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [PrismaModule, CustomConfigModule],
  controllers: [McpController],
  providers: [McpService, McpApiKeyGuard],
})
export class McpModule {}

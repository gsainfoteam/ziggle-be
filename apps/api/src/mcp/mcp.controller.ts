import {
  All,
  Controller,
  Logger,
  NotFoundException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IncomingMessage } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod/v4';
import { McpApiKeyGuard } from './mcp-api-key.guard';
import { McpService } from './mcp.service';

@UseGuards(McpApiKeyGuard)
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @All()
  async handleMcpRequest(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const server = this.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(
        request as Request & IncomingMessage,
        response,
        request.body,
      );
      response.on('close', () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      this.logger.error('Failed to handle MCP request', error);
      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
      await transport.close();
      await server.close();
    }
  }

  private createServer(): McpServer {
    const server = new McpServer({ name: 'ziggle-notices', version: '1.0.0' });

    server.registerTool(
      'search_notices',
      {
        title: 'Search Ziggle notices',
        description:
          'Search notice titles and content. Returns matching notice IDs, titles, and summaries.',
        inputSchema: {
          query: z.string().trim().min(1).max(200),
          limit: z.number().int().min(1).max(50).optional().default(10),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async ({ query, limit }) => {
        const notices = await this.mcpService.searchNotices(query, limit);
        return {
          content: [{ type: 'text', text: JSON.stringify(notices) }],
        };
      },
    );

    server.registerTool(
      'get_notice',
      {
        title: 'Get a Ziggle notice',
        description: 'Get the full original body of a notice by its ID.',
        inputSchema: { id: z.number().int().positive() },
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      async ({ id }) => {
        try {
          const notice = await this.mcpService.getNoticeBody(id);
          return {
            content: [{ type: 'text', text: JSON.stringify(notice) }],
          };
        } catch (error) {
          if (!(error instanceof NotFoundException)) {
            throw error;
          }
          return {
            isError: true,
            content: [{ type: 'text', text: `Notice ${id} was not found.` }],
          };
        }
      },
    );

    return server;
  }
}

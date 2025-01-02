import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  @ApiResponse({
    status: 200,
    description: 'Send the message "pong" when the server is active.',
    content: {
      'application/json': {
        examples: {
          pong: {
            value: 'pong',
          },
        },
      },
    },
  })
  @Get()
  getHello(): string {
    return 'pong';
  }
}

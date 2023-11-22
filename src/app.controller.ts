import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

@Controller('')
export class AppController {
  @ApiResponse({
    status: 200,
    description: 'pong',
    type: String,
  })
  @Get()
  async ping() {
    return 'pong';
  }
}

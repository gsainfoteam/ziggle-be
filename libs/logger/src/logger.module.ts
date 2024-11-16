import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { DiscoveryModule } from '@nestjs/core';
import { LoggerDecoratorRegister } from './logger.decorator.register';

@Module({
  imports: [DiscoveryModule],
  providers: [LoggerService, LoggerDecoratorRegister],
  exports: [LoggerService],
})
export class LoggerModule {}

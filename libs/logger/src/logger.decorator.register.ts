import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { LOGGABLE } from './decorator/loggable';

@Injectable()
export class LoggerDecoratorRegister implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit() {
    return this.discoveryService
      .getProviders()
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ metatype, instance }) => {
        if (!instance || !metatype) {
          return false;
        }
        return Reflect.getMetadata(LOGGABLE, metatype);
      })
      .forEach(({ instance }) => {
        this.metadataScanner
          .getAllMethodNames(instance)
          .forEach((methodName) => {
            const originalMethod = instance[methodName];
            if (typeof originalMethod !== 'function') {
              return;
            }
            const logger = new Logger(instance.constructor.name);
            instance[methodName] = async function (...args: any[]) {
              logger.log(`Before ${methodName}`);
              const now = Date.now();
              const result = await originalMethod.apply(this, args);
              logger.log(`After ${methodName} +${Date.now() - now}ms`);
              return result;
            };
          });
      });
  }
}

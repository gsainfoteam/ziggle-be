import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { CustomConfigService } from '@lib/custom-config';

@Injectable()
export class McpApiKeyGuard implements CanActivate {
  constructor(private readonly configService: CustomConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.MCP_API_KEY;
    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];

    if (
      typeof providedKey !== 'string' ||
      Buffer.byteLength(expectedKey) !== Buffer.byteLength(providedKey)
    ) {
      throw new UnauthorizedException();
    }

    if (
      !timingSafeEqual(Buffer.from(expectedKey), Buffer.from(providedKey))
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}

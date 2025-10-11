import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class UserAwareCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, url, query } = request;

    const userKey = user?.uuid || 'anonymous';
    const queryKey = query && Object.keys(query).length > 0 ? JSON.stringify(query) : '';
    return `${method}:${url}:user:${userKey}:query:${queryKey}`;
  }
}
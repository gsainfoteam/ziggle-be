import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { objectToCamel, objectToSnake } from 'ts-case-convert';

@Injectable()
export class convertCaseInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler<any>,
    ): Observable<any> | Promise<Observable<any>> {
        const camel = objectToCamel(context.switchToHttp().getRequest().body);
        context.switchToHttp().getRequest().body = camel;
        return next.handle().pipe(map((data) => objectToSnake(data)));
    }
}

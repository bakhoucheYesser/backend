import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { tap } from 'rxjs';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    request.headers['x-request-id'] = request.headers['x-request-id'] || uuid();
    return next.handle().pipe(
      tap(() => {
        // attach to logs / responses if needed
      }),
    );
  }
}
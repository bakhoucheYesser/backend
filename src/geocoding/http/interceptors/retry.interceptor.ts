import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, retry } from 'rxjs';

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(retry(2)); // retry twice on error
  }
}

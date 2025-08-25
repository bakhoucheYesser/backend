import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RetryInterceptor } from './interceptors/retry.interceptor';
import { RequestIdInterceptor } from './interceptors/request-id.interceptor';

@Module({
  imports: [HttpModule.register({ timeout: 8000 })],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RetryInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RequestIdInterceptor },
  ],
  exports: [HttpModule],
})
export class GeocodingHttpModule {}

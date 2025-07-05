import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EstimateModule } from './estimate/estimate.module';
import { UploadModule } from './upload/upload.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 seconde en millisecondes
        limit: 3, // 3 requêtes par seconde
      },
      {
        name: 'medium',
        ttl: 10000, // 10 secondes
        limit: 20, // 20 requêtes par 10 secondes
      },
      {
        name: 'long',
        ttl: 60000, // 60 secondes
        limit: 100, // 100 requêtes par minute
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    GeocodingModule,
    EstimateModule,
    UploadModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

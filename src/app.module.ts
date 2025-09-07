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
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
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
    // ORDRE IMPORTANT : ThrottlerGuard en premier
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JwtAuthGuard en second (gère @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // RolesGuard supprimé d'ici - sera utilisé avec @UseGuards() là où nécessaire
  ],
})
export class AppModule {}

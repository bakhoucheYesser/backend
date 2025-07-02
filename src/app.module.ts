// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GeocodingModule } from './geocoding/geocoding.module'; // ✅ Ajout
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { EstimateModule } from './estimate/estimate.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    GeocodingModule, // ✅ Ajout du module geocoding
    EstimateModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Protège toutes les routes par défaut
    },
  ],
})
export class AppModule {}
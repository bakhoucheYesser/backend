// src/geocoding/geocoding.module.ts
import { Module } from '@nestjs/common';
import { GeocodingService } from './services/geocoding.service';
import { HereApiService } from './services/here-api.service';
import { GeocodingController } from './geocoding.controller';

@Module({
  providers: [GeocodingService, HereApiService],
  controllers: [GeocodingController],
  exports: [GeocodingService],
})
export class GeocodingModule {}

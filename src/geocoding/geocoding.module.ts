import { Module } from '@nestjs/common';
import { GeocodingService } from './services/geocoding.service';
import { HereApiService } from './services/here-api.service';
import { GeocodingController } from './controllers/geocoding.controller';
import { GeocodingHttpModule } from './http/http.module';
import hereConfig from './config/here.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forFeature(hereConfig), GeocodingHttpModule],
  providers: [GeocodingService, HereApiService],
  controllers: [GeocodingController],
  exports: [GeocodingService],
})
export class GeocodingModule {}

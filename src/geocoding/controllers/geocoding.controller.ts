import { Controller, Get, Query } from '@nestjs/common';
import { GeocodingService } from '../services/geocoding.service';
import { Public } from '../../auth/decorators/public.decorator';

@Public()
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingService) {}

  @Get('search')
  async search(@Query('q') q: string) {
    return this.geocoding.searchPlaces(q);
  }

  @Get('reverse')
  async reverse(@Query('lat') lat: number, @Query('lng') lng: number) {
    return this.geocoding.reverseGeocode(lat, lng);
  }
}

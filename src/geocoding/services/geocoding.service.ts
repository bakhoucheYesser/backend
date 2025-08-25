import { Injectable, Logger } from '@nestjs/common';
import { HereApiService } from './here-api.service';
import { PlaceResult } from '../models/place-result.model';
import { RouteCalculationResult } from '../models/route-result.model';
import { mapRoute, mapHereItemToPlaceResult } from '../mappers/here.mappers';
import { HereSearchResponse } from '../schemas/here.search.schema';
import { HereRouteResponse } from '../schemas/here.route.schema';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly here: HereApiService) {}

  async searchPlaces(
    query: string,
    lat?: number,
    lng?: number,
  ): Promise<PlaceResult[]> {
    const raw = await this.here.searchPlaces(query, lat, lng);
    const parsed = HereSearchResponse.parse(raw);
    return parsed.items.map(mapHereItemToPlaceResult).slice(0, 8);
  }

  async reverseGeocode(lat: number, lng: number): Promise<PlaceResult | null> {
    const raw = await this.here.reverseGeocode(lat, lng);
    const parsed = HereSearchResponse.parse(raw);
    return parsed.items.length
      ? mapHereItemToPlaceResult(parsed.items[0])
      : null;
  }

  async calculateRoute(
    origin: string,
    destination: string,
  ): Promise<RouteCalculationResult | null> {
    const raw = await this.here.calculateRoute(origin, destination);
    const parsed = HereRouteResponse.parse(raw);
    return mapRoute(parsed);
  }
}

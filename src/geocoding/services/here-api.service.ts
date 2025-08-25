import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HereApiService {
  private readonly logger = new Logger(HereApiService.name);
  private readonly apiKey: string;

  private readonly geocodeUrl = 'https://geocode.search.hereapi.com/v1/geocode';
  private readonly reverseUrl =
    'https://revgeocode.search.hereapi.com/v1/revgeocode';
  private readonly routingUrl = 'https://router.hereapi.com/v8/routes';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('here.apiKey');
  }

  async searchPlaces(
    query: string,
    lat?: number,
    lng?: number,
    opts: Record<string, any> = {},
  ) {
    const params = {
      apikey: this.apiKey,
      q: query,
      at: lat != null && lng != null ? `${lat},${lng}` : undefined,
      ...opts,
    };
    const { data } = await firstValueFrom(
      this.http.get(this.geocodeUrl, { params }),
    );
    return data;
  }

  async reverseGeocode(lat: number, lng: number) {
    const params = { apikey: this.apiKey, at: `${lat},${lng}` };
    const { data } = await firstValueFrom(
      this.http.get(this.reverseUrl, { params }),
    );
    return data;
  }

  async calculateRoute(origin: string, destination: string) {
    const params = {
      apikey: this.apiKey,
      origin,
      destination,
      transportMode: 'car',
      return: 'summary,polyline',
      units: 'metric',
    };
    const { data } = await firstValueFrom(
      this.http.get(this.routingUrl, { params }),
    );
    return data;
  }
}

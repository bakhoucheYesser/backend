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

  // small helper to avoid sending undefined query params
  private prune<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const out: Partial<T> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) {
        (out as any)[k] = v; // safe cast at the edge
      }
    }
    return out;
  }

  async searchPlaces(
    query: string,
    lat?: number,
    lng?: number,
    opts: Record<string, any> = {},
  ) {
    const params = this.prune({
      apikey: this.apiKey,
      q: query?.trim(),
      // ✅ restrict results to Canada
      in: 'countryCode:CAN',
      // sensible defaults; opts can override if needed
      lang: 'fr-CA',
      types: 'address,place',
      limit: 20,
      show: 'parsing,streetInfo,postalCodeDetails,countryInfo,tz,secondaryUnitInfo',
      at: lat != null && lng != null ? `${lat},${lng}` : undefined,
      ...opts,
    });

    const { data } = await firstValueFrom(
      this.http.get(this.geocodeUrl, { params }),
    );
    return data;
  }

  async reverseGeocode(lat: number, lng: number) {
    const params = this.prune({
      apikey: this.apiKey,
      at: `${lat},${lng}`,
      lang: 'fr-CA',
      types: 'address',
      show: 'parsing,streetInfo,postalCodeDetails,countryInfo,tz,secondaryUnitInfo',
    });

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

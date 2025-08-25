// src/geocoding/services/geocoding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HereApiService } from './here-api.service';
import { PlaceResult } from '../models/place-result.model';
import { RouteCalculationResult } from '../models/route-result.model';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly hereApi: HereApiService) {}

  /** Deliverable/specific result types (normalized to lowercase) */
  private readonly validTypes = new Set([
    'housenumber',
    'building',
    'place',
    'pointaddress',
    'addressblock',
  ]);

  /** Types we explicitly consider too vague for delivery */
  private readonly invalidTypes = new Set([
    'locality',
    'administrativearea',
    'street',
    'district',
    'postalcode',
    'country',
    'state',
    'city',
    'county',
    'neighbourhood',
  ]);

  /**
   * Heuristic: is this item a specific, deliverable address?
   */
  private isSpecificDeliverableAddress(item: any): boolean {
    const type = String(item.resultType ?? '').toLowerCase();
    const title = String(item.title ?? '').trim();
    const address = item.address ?? {};

    if (this.invalidTypes.has(type)) return false;

    const titleHasNumber = /^\d+/.test(title);

    const hasHouseNumber = !!String(address.houseNumber ?? '').trim();
    const hasStreet = !!String(address.street ?? '').trim();
    const hasCity = !!String(address.city ?? '').trim();
    const isComplete = hasHouseNumber && hasStreet && hasCity;

    const specificByType = this.validTypes.has(type);

    return specificByType || titleHasNumber || isComplete;
  }

  /**
   * Canada-only filter + shape mapping + sort heuristics.
   */
  private filterAndMap(items: any[]): PlaceResult[] {
    return (
      items
        // Country hard filter
        .filter((item) => {
          const cc = String(item.address?.countryCode ?? '').toUpperCase();
          return cc === 'CAN' || cc === 'CA';
        })
        // Optional: drop vague types
        .filter(
          (item) =>
            !this.invalidTypes.has(String(item.resultType ?? '').toLowerCase()),
        )
        // Specificity
        .filter((item) => this.isSpecificDeliverableAddress(item))
        // Map to domain model
        .map<PlaceResult>((item) => ({
          id: item.id,
          title: item.title,
          address: {
            label: item.address?.label || item.title,
            countryCode: String(
              item.address?.countryCode ?? 'CAN',
            ).toUpperCase(),
            city: item.address?.city,
            state: item.address?.state,
            postalCode: item.address?.postalCode,
            houseNumber: item.address?.houseNumber,
            street: item.address?.street,
          },
          position: {
            lat: item.position?.lat ?? 0,
            lng: item.position?.lng ?? 0,
          },
          resultType: String(item.resultType ?? '').toLowerCase(),
          distance: item.distance,
        }))
        // Sort: numeric titles first, then housenumber type, then by distance
        .sort((a, b) => {
          const aNum = /^\d+/.test(a.title);
          const bNum = /^\d+/.test(b.title);
          if (aNum !== bNum) return aNum ? -1 : 1;

          const aHouse = a.resultType === 'housenumber';
          const bHouse = b.resultType === 'housenumber';
          if (aHouse !== bHouse) return aHouse ? -1 : 1;

          return (a.distance ?? 0) - (b.distance ?? 0);
        })
    );
  }

  /**
   * Forward search (Canada-only).
   * NOTE: `userLat`/`userLng` are optional proximity bias.
   */
  async searchPlaces(
    query: string,
    userLat?: number,
    userLng?: number,
  ): Promise<PlaceResult[]> {
    try {
      const raw = await this.hereApi.searchPlaces(query, userLat, userLng, {
        // Tighten to 'address' if you never want localities in candidates:
        types: 'address,place',
        limit: 20,
        lang: 'fr-CA',
      });

      const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
      if (items.length === 0) return [];

      return this.filterAndMap(items).slice(0, 8);
    } catch (err) {
      this.logger.error('Error searching places', err as any);
      throw new Error('Failed to search places');
    }
  }

  /**
   * Reverse geocoding (coords → single address), Canada-only.
   */
  async reverseGeocode(lat: number, lng: number): Promise<PlaceResult | null> {
    try {
      const raw = await this.hereApi.reverseGeocode(lat, lng);
      const items: any[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
      if (items.length === 0) return null;

      const canadian = items.filter((it) => {
        const cc = String(it.address?.countryCode ?? '').toUpperCase();
        return cc === 'CAN' || cc === 'CA';
      });

      const mapped = this.filterAndMap(canadian);
      return mapped[0] ?? null;
    } catch (err) {
      this.logger.error('Error reverse geocoding', err as any);
      throw new Error('Failed to reverse geocode');
    }
  }

  /**
   * Routing. Throws if no route is found (non-nullable contract).
   */
  async calculateRoute(
    origin: string,
    destination: string,
  ): Promise<RouteCalculationResult> {
    try {
      const data = await this.hereApi.calculateRoute(origin, destination);
      const route = data?.routes?.[0];
      const section = route?.sections?.[0];

      if (!section?.summary) {
        throw new Error('No route found between the specified locations');
      }

      return {
        summary: {
          duration: section.summary.duration,
          length: section.summary.length,
        },
        polyline: section.polyline ?? '',
      };
    } catch (err) {
      this.logger.error('Error calculating route', err as any);
      throw new Error('Route calculation failed');
    }
  }

  // ---- Format helpers (presentation-only) ----

  formatDistance(meters: number): string {
    return meters < 1000
      ? `${Math.round(meters)}m`
      : `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h ? `${h}h ${m}min` : `${m}min`;
  }
}

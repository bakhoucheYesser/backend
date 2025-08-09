// src/geocoding/services/geocoding.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HereApiService } from './here-api.service';

export interface PlaceResult {
  id: string;
  title: string;
  address: {
    label: string;
    countryCode: string;
    city?: string;
    state?: string;
    postalCode?: string;
    houseNumber?: string;
    street?: string;
  };
  position: {
    lat: number;
    lng: number;
  };
  resultType: string;
  distance?: number;
}

export interface RouteCalculationResult {
  summary: {
    duration: number; // secondes
    length: number; // mètres
  };
  polyline: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(private readonly hereApiService: HereApiService) {}

  /**
   * Vérifie si un résultat est une adresse précise
   */
  private isSpecificDeliverableAddress(item: any): boolean {
    const type = item.resultType?.toLowerCase() || '';
    const address = item.address;
    const title = item.title || '';

    const validTypes = [
      'housenumber',
      'building',
      'place',
      'pointaddress',
      'addressblock',
    ];

    const invalidTypes = [
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
    ];

    if (invalidTypes.includes(type)) return false;
    return validTypes.includes(type)
      ? this.hasSpecificAddressComponents(address, title, type)
      : this.hasSpecificAddressComponents(address, title, type);
  }

  /**
   * Vérifie la présence de composants spécifiques dans l'adresse
   */
  private hasSpecificAddressComponents(
    address: any,
    title: string,
    type: string,
  ): boolean {
    if (!address && !title) return false;

    const titleHasNumber = /^\d+/.test(title.trim());
    const invalidTitlePatterns = [
      /^(rue|avenue|boulevard|chemin|route|street|road|ave)\s+/i,
      /^(ville de|city of|municipalité de)\s+/i,
      /^[a-zA-ZÀ-ÿ\s\-']+$/,
    ];

    if (invalidTitlePatterns.some((p) => p.test(title)) && !titleHasNumber) {
      return false;
    }

    const hasHouseNumber = !!address?.houseNumber?.trim();
    const hasStreet = !!address?.street?.trim();
    const hasCity = !!address?.city?.trim();

    const isComplete = hasHouseNumber && hasStreet && hasCity;
    const isSpecificPlace =
      type === 'place' &&
      title &&
      !invalidTitlePatterns.some((p) => p.test(title));

    return isComplete || titleHasNumber || isSpecificPlace;
  }

  /**
   * Filtre uniquement les adresses spécifiques
   */
  private filterSpecificAddresses(items: any[]): PlaceResult[] {
    return items
      .filter((item) => this.isSpecificDeliverableAddress(item))
      .map((item) => ({
        id: item.id,
        title: item.title,
        address: {
          label: item.address?.label || item.title,
          countryCode: item.address?.countryCode || 'CAN',
          city: item.address?.city,
          state: item.address?.state,
          postalCode: item.address?.postalCode,
          houseNumber: item.address?.houseNumber,
          street: item.address?.street,
        },
        position: {
          lat: item.position.lat,
          lng: item.position.lng,
        },
        resultType: item.resultType,
        distance: item.distance,
      }))
      .sort((a, b) => {
        const aNum = /^\d+/.test(a.title);
        const bNum = /^\d+/.test(b.title);
        if (aNum && !bNum) return -1;
        if (!aNum && bNum) return 1;
        if (a.resultType === 'housenumber' && b.resultType !== 'housenumber')
          return -1;
        if (a.resultType !== 'housenumber' && b.resultType === 'housenumber')
          return 1;
        return (a.distance ?? 0) - (b.distance ?? 0);
      });
  }

  /**
   * Recherche de lieux précis
   */
  async searchPlaces(
    query: string,
    userLat?: number,
    userLng?: number,
  ): Promise<PlaceResult[]> {
    try {
      const response = await this.hereApiService.searchPlaces(
        query,
        userLat,
        userLng,
        {
          types: 'address,place',
          limit: 20,
          lang: 'fr-CA',
        },
      );

      if (!response.items?.length) return [];
      return this.filterSpecificAddresses(response.items).slice(0, 8);
    } catch (err) {
      this.logger.error('Error searching places', err);
      throw new Error('Failed to search places');
    }
  }

  /**
   * Reverse geocoding : coordonnées -> adresse
   */
  async reverseGeocode(lat: number, lng: number): Promise<PlaceResult | null> {
    try {
      const response = await this.hereApiService.reverseGeocode(lat, lng);
      if (!response.items?.length) return null;

      const specific = this.filterSpecificAddresses(response.items);
      return specific.length ? specific[0] : null;
    } catch (err) {
      this.logger.error('Error reverse geocoding', err);
      throw new Error('Failed to reverse geocode');
    }
  }

  /**
   * Calcul d’itinéraire
   */
  async calculateRoute(
    origin: string,
    destination: string,
  ): Promise<RouteCalculationResult | null> {
    try {
      const response = await this.hereApiService.calculateRoute(origin, destination);
      const route = response?.routes?.[0];
      const section = route?.sections?.[0];

      if (!section?.summary || !section.polyline) return null;

      return {
        summary: {
          duration: section.summary.duration,
          length: section.summary.length,
        },
        polyline: section.polyline,
      };
    } catch (err) {
      this.logger.error('Error calculating route', err);
      throw new Error('Route calculation failed');
    }
  }

  /**
   * Format helpers
   */
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

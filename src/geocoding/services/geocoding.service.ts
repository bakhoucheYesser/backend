// src/geocoding/services/geocoding.service.ts
import { Injectable } from '@nestjs/common';
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
    duration: number; // en secondes
    length: number;   // en mètres
  };
  polyline: string;
}

@Injectable()
export class GeocodingService {
  constructor(private readonly hereApiService: HereApiService) {}

  async searchPlaces(
    query: string,
    userLat?: number,
    userLng?: number
  ): Promise<PlaceResult[]> {
    try {
      const response = await this.hereApiService.searchPlaces(query, userLat, userLng);

      if (!response.items) {
        return [];
      }

      return response.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        address: {
          label: item.address?.label || item.title,
          countryCode: item.address?.countryCode || 'CAN',
          city: item.address?.city,
          state: item.address?.state,
          postalCode: item.address?.postalCode,
        },
        position: {
          lat: item.position.lat,
          lng: item.position.lng,
        },
        resultType: item.resultType,
        distance: item.distance,
      }));
    } catch (error: any) {
      console.error('Geocoding service error:', error);
      throw new Error('Failed to search places');
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<PlaceResult | null> {
    try {
      const response = await this.hereApiService.reverseGeocode(lat, lng);

      if (!response.items || response.items.length === 0) {
        return null;
      }

      const item = response.items[0];

      return {
        id: item.id,
        title: item.title,
        address: {
          label: item.address?.label || item.title,
          countryCode: item.address?.countryCode || 'CAN',
          city: item.address?.city,
          state: item.address?.state,
          postalCode: item.address?.postalCode,
        },
        position: {
          lat: item.position.lat,
          lng: item.position.lng,
        },
        resultType: item.resultType,
      };
    } catch (error: any) {
      console.error('Reverse geocoding service error:', error);
      throw new Error('Failed to reverse geocode');
    }
  }

  async calculateRoute(
    origin: string,
    destination: string
  ): Promise<RouteCalculationResult | null> {
    try {
      const response = await this.hereApiService.calculateRoute(origin, destination);

      if (!response.routes || response.routes.length === 0) {
        return null;
      }

      const route = response.routes[0];

      return {
        summary: {
          duration: route.sections[0]?.summary?.duration || 0,
          length: route.sections[0]?.summary?.length || 0,
        },
        polyline: route.sections[0]?.polyline || '',
      };
    } catch (error: any) {
      console.error('Route calculation service error:', error);
      throw new Error('Failed to calculate route');
    }
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }
}

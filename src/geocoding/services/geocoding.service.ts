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
    length: number; // en mètres
  };
  polyline: string;
}

@Injectable()
export class GeocodingService {
  constructor(private readonly hereApiService: HereApiService) {}

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
      );

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

  // Corrected calculateRoute method for HERE API v8 response structure

  async calculateRoute(
    origin: string,
    destination: string,
  ): Promise<RouteCalculationResult | null> {
    try {
      const response = await this.hereApiService.calculateRoute(
        origin,
        destination,
      );

      if (!response?.routes || response.routes.length === 0) {
        console.log('No routes found in response');
        return null;
      }

      const route = response.routes[0];

      // Check if sections exist
      if (!route.sections || route.sections.length === 0) {
        console.log('No sections found in route');
        return null;
      }

      const section = route.sections[0];

      // Extract data from the first section (which contains the route info)
      const duration = section.summary?.duration || 0;
      const length = section.summary?.length || 0;
      const polyline = section.polyline || '';

      // Validate that we have meaningful data
      if (duration <= 0 && length <= 0) {
        console.error('Invalid route data: duration and length are both zero');
        return null;
      }

      if (!polyline) {
        console.error('No polyline data found in route');
        return null;
      }

      console.log(`Route calculated successfully - Duration: ${duration}s, Length: ${length}m, Polyline length: ${polyline.length} chars`);

      return {
        summary: {
          duration,
          length,
        },
        polyline,
      };
    } catch (error: any) {
      console.error('Route calculation service error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      // Re-throw with more specific error message
      throw new Error(`Route calculation failed: ${error.message}`);
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

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface RouteResult {
  summary: {
    duration: number; // en secondes
    length: number; // en mètres
  };
  polyline: string;
}

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

@Injectable()
export class GeocodeService {
  private readonly hereApiKey = process.env.HERE_API_KEY;

  async searchPlaces(
    query: string,
    userLocation?: { lat: number; lng: number },
  ): Promise<{ items: PlaceResult[] }> {
    if (!this.hereApiKey) {
      console.warn('HERE API key not configured, using mock data');
      return this.getMockSearchResults(query);
    }

    try {
      const params = new URLSearchParams({
        apikey: this.hereApiKey,
        q: query,
        limit: '5',
        ...(userLocation && { at: `${userLocation.lat},${userLocation.lng}` }),
      });

      const response = await axios.get(
        `https://geocode.search.hereapi.com/v1/geocode?${params}`,
        {
          timeout: 5000,
        },
      );

      return {
        items:
          response.data.items?.map((item: any) => ({
            id: item.id || `generated-${Date.now()}-${Math.random()}`,
            title: item.title,
            address: {
              label: item.address?.label || item.title,
              countryCode: item.address?.countryCode || 'CA',
              city: item.address?.city,
              state: item.address?.state,
              postalCode: item.address?.postalCode,
            },
            position: {
              lat: item.position?.lat || 0,
              lng: item.position?.lng || 0,
            },
            resultType: item.resultType || 'address',
            distance: item.distance,
          })) || [],
      };
    } catch (error) {
      console.error('HERE API Error:', error);
      return this.getMockSearchResults(query);
    }
  }

  async calculateRoute(
    origin: string,
    destination: string,
  ): Promise<RouteResult> {
    if (!this.hereApiKey) {
      console.warn('HERE API key not configured, using mock route');
      return this.getMockRoute(origin, destination);
    }

    try {
      const params = new URLSearchParams({
        apikey: this.hereApiKey,
        transportMode: 'car',
        origin,
        destination,
        return: 'summary,polyline',
      });

      const response = await axios.get(
        `https://router.hereapi.com/v8/routes?${params}`,
        {
          timeout: 10000,
        },
      );

      if (response.data.routes?.length > 0) {
        const route = response.data.routes[0];
        const section = route.sections?.[0];

        return {
          summary: {
            duration: section?.summary?.duration || 1800, // 30 min par défaut
            length: section?.summary?.length || 10000, // 10km par défaut
          },
          polyline: section?.polyline || '',
        };
      }

      return this.getMockRoute(origin, destination);
    } catch (error) {
      console.error('HERE Routing Error:', error);
      return this.getMockRoute(origin, destination);
    }
  }

  private getMockSearchResults(query: string): { items: PlaceResult[] } {
    return {
      items: [
        {
          id: `mock-1-${Date.now()}`,
          title: `${query} - Montreal, QC`,
          address: {
            label: `${query}, Montreal, QC, Canada`,
            countryCode: 'CA',
            city: 'Montreal',
            state: 'Quebec',
            postalCode: 'H3A 0G4',
          },
          position: {
            lat: 45.5017 + (Math.random() - 0.5) * 0.1,
            lng: -73.5673 + (Math.random() - 0.5) * 0.1,
          },
          resultType: 'address',
        },
        {
          id: `mock-2-${Date.now()}`,
          title: `${query} - Quebec City, QC`,
          address: {
            label: `${query}, Quebec City, QC, Canada`,
            countryCode: 'CA',
            city: 'Quebec City',
            state: 'Quebec',
            postalCode: 'G1R 2L3',
          },
          position: {
            lat: 46.8139 + (Math.random() - 0.5) * 0.1,
            lng: -71.208 + (Math.random() - 0.5) * 0.1,
          },
          resultType: 'address',
        },
      ],
    };
  }

  private getMockRoute(origin: string, destination: string): RouteResult {
    // Simple mock route calculation
    const distance = Math.floor(Math.random() * 50000) + 5000; // 5-55km
    const duration = Math.floor(distance / 500); // ~50km/h average

    console.log(
      `Mock route from ${origin} to ${destination}: ${distance}m, ${duration}s`,
    );

    return {
      summary: {
        duration,
        length: distance,
      },
      polyline: '',
    };
  }
}

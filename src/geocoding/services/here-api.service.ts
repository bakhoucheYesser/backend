// src/geocoding/services/here-api.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HereApiService {
  private readonly logger = new Logger(HereApiService.name);
  private readonly apiKey = process.env.HERE_API_KEY;

  // URLs officielles HERE API
  private readonly geocodeUrl = 'https://geocode.search.hereapi.com/v1/geocode';
  private readonly reverseGeocodeUrl ='https://revgeocode.search.hereapi.com/v1/revgeocode';
  private readonly routingUrl = 'https://router.hereapi.com/v8/routes';

  constructor() {
    this.validateApiKey();
  }

  private validateApiKey() {
    if (!this.apiKey) {
      this.logger.error('HERE_API_KEY environment variable is not set');
      throw new Error('HERE API key is required but not configured');
    }

    // Validation basique du format de la clé HERE (généralement 39-43 caractères)
    if (this.apiKey.length < 20 || this.apiKey.length > 100) {
      this.logger.warn(
        `HERE API key length seems unusual: ${this.apiKey.length} characters`,
      );
    }

    this.logger.log('HERE API key configured successfully');
  }

  async searchPlaces(query: string, lat?: number, lng?: number) {
    this.logger.debug(`Searching places for query: "${query}"`);

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (!this.apiKey) {
      throw new Error('HERE API key is not configured');
    }

    // Création des paramètres avec typage correct
    const searchParams: Record<string, string> = {
      apikey: this.apiKey,
      q: query.trim(),
      limit: '10',
      lang: 'en-CA',
    };

    // Ajouter les coordonnées de l'utilisateur si disponibles
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      searchParams.at = `${lat},${lng}`;
      this.logger.debug(`Using bias location: ${lat},${lng}`);
    }

    // Limiter la recherche au Canada
    searchParams.in = 'countryCode:CAN';

    const params = new URLSearchParams(searchParams);
    const fullUrl = `${this.geocodeUrl}?${params.toString()}`;

    this.logger.debug(`Making request to: ${this.geocodeUrl}`);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GrandoGo/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `HERE Geocode API error: ${response.status} - ${errorText}`,
        );

        if (response.status === 401) {
          throw new Error('Invalid HERE API key or insufficient permissions');
        }
        if (response.status === 403) {
          throw new Error(
            'HERE API key access forbidden - check your key permissions',
          );
        }
        if (response.status === 429) {
          throw new Error('HERE API rate limit exceeded');
        }

        throw new Error(
          `HERE API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.logger.debug(
        `Search completed successfully, found ${data.items?.length || 0} results`,
      );

      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.logger.error('Network connectivity issue with HERE API');
        throw new Error('Unable to connect to HERE geocoding service');
      }

      this.logger.error(`HERE API search error: ${error.message}`);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    this.logger.debug(`Reverse geocoding coordinates: ${lat}, ${lng}`);

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates provided');
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Coordinates are out of valid range');
    }

    if (!this.apiKey) {
      throw new Error('HERE API key is not configured');
    }

    const searchParams: Record<string, string> = {
      apikey: this.apiKey,
      at: `${lat},${lng}`,
      lang: 'en-CA',
    };

    const params = new URLSearchParams(searchParams);
    const fullUrl = `${this.reverseGeocodeUrl}?${params.toString()}`;

    this.logger.debug(
      `Making reverse geocode request to: ${this.reverseGeocodeUrl}`,
    );

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GrandoGo/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `HERE Reverse Geocode API error: ${response.status} - ${errorText}`,
        );

        if (response.status === 401) {
          throw new Error('Invalid HERE API key or insufficient permissions');
        }

        throw new Error(
          `HERE API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.logger.debug('Reverse geocoding completed successfully');

      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.logger.error('Network connectivity issue with HERE API');
        throw new Error('Unable to connect to HERE reverse geocoding service');
      }

      this.logger.error(`HERE API reverse geocode error: ${error.message}`);
      throw error;
    }
  }

  async calculateRoute(origin: string, destination: string) {
    this.logger.debug(`Calculating route from "${origin}" to "${destination}"`);

    if (!origin || !destination) {
      throw new Error('Both origin and destination are required');
    }

    // Validation du format des coordonnées (lat,lng)
    const coordPattern = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    if (
      !coordPattern.test(origin.trim()) ||
      !coordPattern.test(destination.trim())
    ) {
      throw new Error('Coordinates must be in format "latitude,longitude"');
    }

    if (!this.apiKey) {
      throw new Error('HERE API key is not configured');
    }

    const searchParams: Record<string, string> = {
      apikey: this.apiKey,
      transportMode: 'car',
      origin: origin.trim(),
      destination: destination.trim(),
      return: 'polyline,summary',
      // ← Removed 'departure=now' as it's unknown in HERE API v8
    };

    const params = new URLSearchParams(searchParams);
    const fullUrl = `${this.routingUrl}?${params.toString()}`;

    this.logger.debug(`Making routing request to: ${this.routingUrl}`);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GrandoGo/1.0',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `HERE Routing API error: ${response.status} - ${errorText}`,
        );

        if (response.status === 401) {
          throw new Error('Invalid HERE API key or insufficient permissions');
        }
        if (response.status === 400) {
          throw new Error(
            'Invalid route parameters - check coordinates format',
          );
        }

        throw new Error(
          `HERE API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        this.logger.warn('No routes found between the specified points');
        throw new Error('No route found between the specified locations');
      }

      this.logger.debug(`Route calculation completed successfully`);

      return data;
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        this.logger.error('Network connectivity issue with HERE API');
        throw new Error('Unable to connect to HERE routing service');
      }

      this.logger.error(`HERE API routing error: ${error.message}`);
      throw error;
    }
  }

  // Méthode utilitaire pour tester la connectivité API
  async testConnection(): Promise<boolean> {
    this.logger.debug('Testing HERE API connection...');

    try {
      // Test simple avec une recherche basique
      await this.searchPlaces('Montreal');
      this.logger.log('HERE API connection test successful');
      return true;
    } catch (error: any) {
      this.logger.error(`HERE API connection test failed: ${error.message}`);
      return false;
    }
  }

  // Getters pour le health check
  get geocodeUrlPublic(): string {
    return this.geocodeUrl;
  }

  get reverseGeocodeUrlPublic(): string {
    return this.reverseGeocodeUrl;
  }

  get routingUrlPublic(): string {
    return this.routingUrl;
  }
}

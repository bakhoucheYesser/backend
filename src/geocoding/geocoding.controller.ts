// src/geocoding/geocoding.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HereApiService } from './services/here-api.service';

@Controller('geocoding')
export class GeocodingController {
  private readonly logger = new Logger(GeocodingController.name);

  constructor(private readonly hereApiService: HereApiService) {}

  @Get('search')
  @Public()
  async searchPlaces(
    @Query('q') query: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    this.logger.debug(
      `Search request: query="${query}", lat="${lat}", lng="${lng}"`,
    );

    try {
      // Validation des paramètres
      if (!query || query.trim().length === 0) {
        throw new BadRequestException(
          'Query parameter "q" is required and cannot be empty',
        );
      }

      if (query.trim().length < 2) {
        throw new BadRequestException(
          'Query must be at least 2 characters long',
        );
      }

      let latitude: number | undefined;
      let longitude: number | undefined;

      // Validation des coordonnées optionnelles
      if (lat && lng) {
        latitude = parseFloat(lat);
        longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) {
          throw new BadRequestException('Invalid latitude or longitude format');
        }

        if (latitude < -90 || latitude > 90) {
          throw new BadRequestException('Latitude must be between -90 and 90');
        }

        if (longitude < -180 || longitude > 180) {
          throw new BadRequestException(
            'Longitude must be between -180 and 180',
          );
        }
      }

      const result = await this.hereApiService.searchPlaces(
        query.trim(),
        latitude,
        longitude,
      );

      this.logger.debug(
        `Search successful, returning ${result.items?.length || 0} results`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Search error: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.message.includes('HERE API key')) {
        throw new HttpException(
          'Geocoding service configuration error',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.message.includes('Network error')) {
        throw new HttpException(
          'Geocoding service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'Failed to search places',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('reverse')
  @Public()
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    this.logger.debug(`Reverse geocode request: lat="${lat}", lng="${lng}"`);

    try {
      // Validation des paramètres requis
      if (!lat || !lng) {
        throw new BadRequestException(
          'Both "lat" and "lng" parameters are required',
        );
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new BadRequestException('Invalid latitude or longitude format');
      }

      if (latitude < -90 || latitude > 90) {
        throw new BadRequestException('Latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        throw new BadRequestException('Longitude must be between -180 and 180');
      }

      const result = await this.hereApiService.reverseGeocode(
        latitude,
        longitude,
      );

      this.logger.debug(`Reverse geocode successful`);
      return result;
    } catch (error) {
      this.logger.error(`Reverse geocode error: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.message.includes('HERE API key')) {
        throw new HttpException(
          'Geocoding service configuration error',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.message.includes('Network error')) {
        throw new HttpException(
          'Geocoding service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'Failed to reverse geocode',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('route')
  @Public()
  async calculateRoute(@Body() body: { origin: string; destination: string }) {
    this.logger.debug(`Route calculation request: ${JSON.stringify(body)}`);

    try {
      // Validation du body
      if (!body || typeof body !== 'object') {
        throw new BadRequestException('Request body is required');
      }

      const { origin, destination } = body;

      if (!origin || !destination) {
        throw new BadRequestException(
          'Both "origin" and "destination" are required',
        );
      }

      if (origin.trim().length === 0 || destination.trim().length === 0) {
        throw new BadRequestException('Origin and destination cannot be empty');
      }

      // Validation basique du format des coordonnées (lat,lng)
      const coordinateRegex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;

      if (!coordinateRegex.test(origin.trim())) {
        throw new BadRequestException(
          'Origin must be in format "latitude,longitude"',
        );
      }

      if (!coordinateRegex.test(destination.trim())) {
        throw new BadRequestException(
          'Destination must be in format "latitude,longitude"',
        );
      }

      const result = await this.hereApiService.calculateRoute(
        origin.trim(),
        destination.trim(),
      );

      this.logger.debug(`Route calculation successful`);
      return result;
    } catch (error) {
      this.logger.error(
        `Route calculation error: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.message.includes('HERE API key')) {
        throw new HttpException(
          'Geocoding service configuration error',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.message.includes('Network error')) {
        throw new HttpException(
          'Geocoding service temporarily unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'Failed to calculate route',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @Public()
  async healthCheck() {
    this.logger.debug('Health check requested');

    return {
      status: 'ok',
      service: 'geocoding',
      timestamp: new Date().toISOString(),
      hasApiKey: !!process.env.HERE_API_KEY,
      apiKeyLength: process.env.HERE_API_KEY?.length || 0,
    };
  }
}

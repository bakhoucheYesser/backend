import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './services/pricing.service';
import { VehicleService } from './services/vehicle.service';

import { GeocodingService } from '../geocoding/services/geocoding.service';
import { RouteCalculationResult } from '../geocoding/models/route-result.model';
import { PlaceResult } from '../geocoding/models/place-result.model';

import { CreateEstimateDto, EstimateResponseDto } from './dto/estimate.dto';

@Injectable()
export class EstimateService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private vehicleService: VehicleService,
    private geocodingService: GeocodingService, // ⬅️ swapped
  ) {}

  async calculateEstimate(
    dto: CreateEstimateDto,
  ): Promise<EstimateResponseDto> {
    const originString = `${dto.pickup.coordinates.lat},${dto.pickup.coordinates.lng}`;
    const destinationString = `${dto.destination.coordinates.lat},${dto.destination.coordinates.lng}`;

    const route: RouteCalculationResult | null =
      await this.geocodingService.calculateRoute(
        originString,
        destinationString,
      );

    if (!route) {
      throw new Error('Route calculation failed');
    }

    const vehicle = await this.vehicleService.getVehicleById(dto.vehicleType);
    if (!vehicle) throw new Error(`Vehicle type ${dto.vehicleType} not found`);

    const pricing = await this.pricingService.calculatePrice({
      vehicle,
      route,
      estimatedDuration: dto.estimatedDuration || 30,
    });

    const estimate = await this.prisma.estimate.create({
      data: {
        pickupAddress: dto.pickup.address,
        pickupCoordinates: originString,
        destinationAddress: dto.destination.address,
        destinationCoordinates: destinationString,
        vehicleType: dto.vehicleType,
        distance: route.summary.length,
        estimatedDuration: dto.estimatedDuration || 30,
        basePrice: pricing.basePrice,
        laborCost: pricing.laborCost,
        mileageCost: pricing.mileageCost,
        bookingFee: pricing.bookingFee,
        totalPrice: pricing.totalPrice,
        status: 'CALCULATED',
      },
    });

    return {
      id: estimate.id,
      pickup: dto.pickup,
      destination: dto.destination,
      vehicle,
      route,
      pricing,
      estimatedDuration: dto.estimatedDuration || 30,
    };
  }

  async getAvailableVehicles() {
    return this.vehicleService.getAllVehicles();
  }

  async searchAddresses(
    query: string,
    userLocation?: { lat: number; lng: number },
  ): Promise<{ items: PlaceResult[] }> {
    const items = await this.geocodingService.searchPlaces(
      query,
      userLocation?.lat,
      userLocation?.lng,
    );
    return { items };
  }

  async calculateRoute(origin: string, destination: string) {
    const route = await this.geocodingService.calculateRoute(
      origin,
      destination,
    );
    if (!route) throw new Error('Route not found');
    return route;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './services/pricing.service';
import { VehicleService } from './services/vehicle.service';
import { GeocodingService } from '../geocoding/services/geocoding.service';
import {
  CreateEstimateDto,
  EstimateResponseDto,
  VehicleTypeId,
} from './dto/estimate.dto';

@Injectable()
export class EstimateService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private vehicleService: VehicleService,
    private geocodingService: GeocodingService,
  ) {}

  async calculateEstimate(
    dto: CreateEstimateDto,
  ): Promise<EstimateResponseDto> {
    // 1. Calculer la route et la distance
    // ✅ FIX: Convertir les coordonnées en format string "lat,lng"
    const originString = `${dto.pickup.coordinates.lat},${dto.pickup.coordinates.lng}`;
    const destinationString = `${dto.destination.coordinates.lat},${dto.destination.coordinates.lng}`;

    const route = await this.geocodingService.calculateRoute(
      originString,
      destinationString,
    );

    // 2. Récupérer les infos du véhicule
    const vehicleTypeId = dto.vehicle.vehicleTypeId || VehicleTypeId.pickup; // Default to pickup

    const vehicle = await this.vehicleService.getVehicleById(vehicleTypeId);

    if (!vehicle) {
      throw new Error(`Vehicle type ${vehicleTypeId} not found`);
    }

    // 3. Calculer le prix avec la strategy appropriée
    const pricing = await this.pricingService.calculatePrice({
      vehicle,
      route,
      estimatedDuration: dto.estimatedDuration || 30, // 30 min par défaut
    });

    // 4. Sauvegarder l'estimation (optionnel pour MVP)
    const estimate = await this.prisma.estimate.create({
      data: {
        pickupAddress: dto.pickup.address,
        pickupCoordinates: `${dto.pickup.coordinates.lat},${dto.pickup.coordinates.lng}`,
        destinationAddress: dto.destination.address,
        destinationCoordinates: `${dto.destination.coordinates.lat},${dto.destination.coordinates.lng}`,
        vehicleType: vehicleTypeId, // Use the local variable instead of dto.vehicle.vehicleTypeId
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
      vehicle: {
        id: vehicle.id,
        displayName: vehicle.displayName,
        basePrice: Number(vehicle.basePrice),
        perMinute: Number(vehicle.perMinute),
        perKm: Number(vehicle.perKm),
      },
      route,
      pricing: {
        basePrice: pricing.basePrice,
        laborCost: pricing.laborCost,
        mileageCost: pricing.mileageCost,
        bookingFee: pricing.bookingFee,
        total: pricing.totalPrice, // Map totalPrice to total
        breakdown: pricing.breakdown,
      },
      estimatedDuration: dto.estimatedDuration || 30,
    };
  }

  async getAvailableVehicles() {
    return this.vehicleService.getAllVehicles();
  }

  async searchAddresses(
    query: string,
    userLocation?: { lat: number; lng: number },
  ) {
    return this.geocodingService.searchPlaces(
      query,
      userLocation?.lat,
      userLocation?.lng,
    );
  }

  async calculateRoute(origin: string, destination: string) {
    return this.geocodingService.calculateRoute(origin, destination);
  }
}

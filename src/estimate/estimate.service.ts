import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './services/pricing.service';
import { VehicleService } from './services/vehicle.service';
import { GeocodeService } from './services/geocode.service';
import { CreateEstimateDto, EstimateResponseDto } from './dto/estimate.dto';

@Injectable()
export class EstimateService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
    private vehicleService: VehicleService,
    private geocodeService: GeocodeService,
  ) {}

  async calculateEstimate(
    dto: CreateEstimateDto,
  ): Promise<EstimateResponseDto> {
    // 1. Calculer la route et la distance
    // ✅ FIX: Convertir les coordonnées en format string "lat,lng"
    const originString = `${dto.pickup.coordinates.lat},${dto.pickup.coordinates.lng}`;
    const destinationString = `${dto.destination.coordinates.lat},${dto.destination.coordinates.lng}`;

    const route = await this.geocodeService.calculateRoute(
      originString,
      destinationString,
    );

    // 2. Récupérer les infos du véhicule
    const vehicle = await this.vehicleService.getVehicleById(dto.vehicleType);

    if (!vehicle) {
      throw new Error(`Vehicle type ${dto.vehicleType} not found`);
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
        vehicleType: dto.vehicleType,
        distance: route.summary.length, // ✅ FIX: Utiliser route.summary.length au lieu de route.distance
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
  ) {
    return this.geocodeService.searchPlaces(query, userLocation);
  }

  async calculateRoute(origin: string, destination: string) {
    return this.geocodeService.calculateRoute(origin, destination);
  }
}

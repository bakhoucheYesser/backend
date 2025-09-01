import { Injectable } from '@nestjs/common';

export interface PricingStrategy {
  calculatePrice(params: PricingParams): Promise<PricingResult>;
}

export interface PricingParams {
  vehicle: any;
  route: any;
  estimatedDuration: number;
}

export interface PricingResult {
  basePrice: number;
  laborCost: number;
  mileageCost: number;
  bookingFee: number;
  totalPrice: number;
  breakdown: any;
  total: any;
}

@Injectable()
export class PricingService {
  private strategies: Map<string, PricingStrategy> = new Map();

  constructor() {
    // Enregistrer les différentes stratégies de pricing
    this.strategies.set('standard', new StandardPricingStrategy());
    this.strategies.set('premium', new PremiumPricingStrategy());
  }

  async calculatePrice(params: PricingParams): Promise<PricingResult> {
    const strategy = this.strategies.get('standard'); // Pour MVP, utiliser standard

    // ✅ FIX: Vérifier que la strategy existe
    if (!strategy) {
      throw new Error('Pricing strategy not found');
    }

    return strategy.calculatePrice(params);
  }
}

class StandardPricingStrategy implements PricingStrategy {
  async calculatePrice(params: PricingParams): Promise<PricingResult> {
    const { vehicle, route, estimatedDuration } = params;

    const basePrice = Number(vehicle.basePrice); // Convertir Decimal en number
    const perMinute = Number(vehicle.perMinute);
    const perKm = Number(vehicle.perKm);

    const laborCost = estimatedDuration * perMinute;
    const mileageCost = (route.summary.length / 1000) * perKm; // Convert m to km
    const subtotal = basePrice + laborCost + mileageCost;
    const bookingFee = subtotal * 0.06; // 6% booking fee
    const totalPrice = subtotal + bookingFee;

    return {
      basePrice,
      laborCost,
      mileageCost,
      bookingFee,
      totalPrice,
      total: totalPrice, // Add this line
      breakdown: {
        basePrice: `Vehicle base rate: $${basePrice.toFixed(2)}`,
        laborCost: `Labor (${estimatedDuration} min): $${laborCost.toFixed(2)}`,
        mileageCost: `Distance (${(route.summary.length / 1000).toFixed(1)} km): $${mileageCost.toFixed(2)}`,
        bookingFee: `Booking fee (6%): $${bookingFee.toFixed(2)}`,
      },
    };
  }
}

class PremiumPricingStrategy implements PricingStrategy {
  async calculatePrice(params: PricingParams): Promise<PricingResult> {
    // Future: Pricing premium avec des règles différentes
    return new StandardPricingStrategy().calculatePrice(params);
  }
}
import { Module } from '@nestjs/common';
import { EstimateController } from './estimate.controller';
import { EstimateService } from './estimate.service';
import { PricingService } from './services/pricing.service';
import { VehicleService } from './services/vehicle.service';
import { GeocodeService } from './services/geocode.service';

@Module({
  controllers: [EstimateController],
  providers: [EstimateService, PricingService, VehicleService, GeocodeService],
  exports: [EstimateService],
})
export class EstimateModule {}

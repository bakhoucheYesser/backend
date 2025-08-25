import { Module } from '@nestjs/common';
import { EstimateController } from './estimate.controller';
import { EstimateService } from './estimate.service';
import { PricingService } from './services/pricing.service';
import { VehicleService } from './services/vehicle.service';

import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [GeocodingModule],
  controllers: [EstimateController],
  providers: [EstimateService, PricingService, VehicleService],
  exports: [EstimateService],
})
export class EstimateModule {}

import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';

export enum VehicleTypeId {
  pickup = 'pickup',
  van = 'van',
  truck_xl = 'truck_xl',
  box_truck = 'box_truck',
}

export class CoordinatesDto {
  @Transform(({ value }) => (value !== null ? Number(value) : value))
  @IsNumber()
  lat!: number;

  @Transform(({ value }) => (value !== null ? Number(value) : value))
  @IsNumber()
  lng!: number;
}

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates!: CoordinatesDto;
}

export class VehicleInputDto {
  // Keep both for backward compatibility: if you send a vehicle object now,
  // we accept it; if you move to IDs later, we’re already ready.
  @IsOptional()
  @IsEnum(VehicleTypeId)
  vehicleTypeId?: VehicleTypeId;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class CreateEstimateDto {
  @ValidateNested()
  @Type(() => LocationDto)
  pickup!: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination!: LocationDto;

  // You were using "vehicle: any"
  @ValidateNested()
  @Type(() => VehicleInputDto)
  vehicle!: VehicleInputDto;

  // Optional: some callers send it, some compute with routing
  @IsOptional()
  @Transform(({ value }) => (value !== null ? Number(value) : value))
  @IsNumber()
  @Min(0)
  estimatedDuration?: number;
}

/** Output shape */
export class EstimateResponseDto {
  id!: string;
  pickup!: LocationDto;
  destination!: LocationDto;

  // For response, you can return either VehicleType or a slim dto
  vehicle!: {
    id: string;
    displayName?: string;
    basePrice?: number;
    perMinute?: number;
    perKm?: number;
  };

  route!: {
    summary: { length: number; duration: number };
    // ...any other fields you add from HERE
  };

  pricing!: {
    basePrice: number;
    laborCost: number;
    mileageCost: number;
    bookingFee: number;
    total: number;
    breakdown?: Record<string, string>;
  };

  estimatedDuration!: number;
}

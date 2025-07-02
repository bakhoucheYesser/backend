import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class LocationDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}

export class CreateEstimateDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  pickup: LocationDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsNotEmpty()
  @IsString()
  vehicleType: string;

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;
}

export class EstimateResponseDto {
  id: string;
  pickup: LocationDto;
  destination: LocationDto;
  vehicle: any;
  route: any;
  pricing: any;
  estimatedDuration: number;
}
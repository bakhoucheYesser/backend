import { IsUUID, IsString, IsOptional } from 'class-validator';

export class UuidParamDto {
  @IsUUID('4', { message: 'ID invalide' })
  id: string;
}

export class BookingParamDto {
  @IsUUID('4', { message: 'ID de réservation invalide' })
  bookingId: string;
}

export class EstimateParamDto {
  @IsUUID('4', { message: "ID d'estimation invalide" })
  estimateId: string;
}
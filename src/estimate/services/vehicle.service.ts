import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehicleService {
  constructor(private prisma: PrismaService) {}

  async getAllVehicles() {
    return this.prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { basePrice: 'asc' },
    });
  }

  async getVehicleById(id: string) {
    return this.prisma.vehicleType.findUnique({
      where: { id },
    });
  }
}
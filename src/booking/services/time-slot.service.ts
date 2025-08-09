import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ✅ EXPORTED - Now the interface can be used in other files
export interface TimeSlot {
  time: string;
  available: boolean;
  demandLevel: 'low' | 'medium' | 'high';
  surgeMultiplier: number;
}

export interface BusyHour {
  hour: number;
  bookingCount: number;
  surgeActive: boolean;
}

@Injectable()
export class TimeSlotService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(
    date: string,
    vehicleType?: string,
    serviceArea?: string,
  ) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Obtenir les réservations existantes pour cette date
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
      include: {
        estimate: true,
      },
    });

    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 20; hour++) {
      const slotTime = new Date(targetDate);
      slotTime.setHours(hour, 0, 0, 0);

      const isBooked = existingBookings.some(
        (booking) =>
          booking.scheduledAt.getHours() === hour &&
          (!vehicleType || (booking.estimate && booking.estimate.vehicleType === vehicleType)),
      );

      // Calculer le niveau de demande pour surge pricing
      const demandLevel = this.calculateDemandLevel(hour, existingBookings);

      slots.push({
        time: slotTime.toISOString(),
        available: !isBooked,
        demandLevel,
        surgeMultiplier: this.getSurgeMultiplier(demandLevel),
      });
    }

    return {
      date,
      slots,
      timezone: 'America/Toronto',
    };
  }

  async getBusyTimes(date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const bookings = await this.prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
      },
    });

    const hourCounts: Record<number, number> = {};
    bookings.forEach((booking) => {
      const hour = booking.scheduledAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return {
      date,
      busyHours: Object.entries(hourCounts)
        .filter(([_, count]) => (count as number) >= 3)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          bookingCount: count as number,
          surgeActive: (count as number) >= 5,
        })),
    };
  }

  async isSlotAvailable(
    scheduledAt: Date,
    vehicleType: string,
  ): Promise<boolean> {
    const startOfHour = new Date(scheduledAt);
    startOfHour.setMinutes(0, 0, 0);
    const endOfHour = new Date(scheduledAt);
    endOfHour.setMinutes(59, 59, 999);

    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        scheduledAt: {
          gte: startOfHour,
          lte: endOfHour,
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
        },
        estimate: {
          vehicleType,
        },
      },
    });

    return !existingBooking;
  }

  async reserveSlot(date: string, timeSlot: string, estimateId: string) {
    const reservationKey = `slot_${date}_${timeSlot}_${estimateId}`;

    return {
      reserved: true,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      reservationId: reservationKey,
    };
  }

  async bookSlot(scheduledAt: Date, vehicleType: string): Promise<void> {
    // Marquer le créneau comme réservé
  }

  async releaseSlot(scheduledAt: Date, vehicleType: string): Promise<void> {
    // Libérer le créneau
  }

  private calculateDemandLevel(
    hour: number,
    bookings: any[],
  ): 'low' | 'medium' | 'high' {
    const hourBookings = bookings.filter(
      (b) => b.scheduledAt.getHours() === hour,
    );

    if (hourBookings.length >= 5) return 'high';
    if (hourBookings.length >= 3) return 'medium';
    return 'low';
  }

  private getSurgeMultiplier(demandLevel: string): number {
    switch (demandLevel) {
      case 'high':
        return 1.5;
      case 'medium':
        return 1.2;
      default:
        return 1.0;
    }
  }
}

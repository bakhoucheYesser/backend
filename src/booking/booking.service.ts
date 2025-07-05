import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimeSlotService } from './services/time-slot.service';
import { NotificationService } from './services/notification.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponseDto,
  BookingStatus,
} from './dto/booking.dto';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private timeSlotService: TimeSlotService,
    private notificationService: NotificationService,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    // 1. Vérifier que l'estimation existe
    const estimate = await this.prisma.estimate.findUnique({
      where: { id: createBookingDto.estimateId },
      include: { vehicle: true },
    });

    if (!estimate) {
      throw new NotFoundException('Estimate not found');
    }

    // 2. Vérifier que le créneau est disponible
    const scheduledDate = new Date(createBookingDto.scheduledAt);
    const isSlotAvailable = await this.timeSlotService.isSlotAvailable(
      scheduledDate,
      estimate.vehicleType,
    );

    if (!isSlotAvailable) {
      throw new ConflictException('Selected time slot is no longer available');
    }

    // 3. Créer la réservation
    const booking = await this.prisma.booking.create({
      data: {
        estimateId: createBookingDto.estimateId,
        customerName: createBookingDto.customerName,
        customerEmail: createBookingDto.customerEmail,
        customerPhone: createBookingDto.customerPhone,
        scheduledAt: scheduledDate,
        status: 'PENDING',
      },
      include: {
        estimate: {
          include: { vehicle: true },
        },
      },
    });

    // 4. Réserver le créneau
    await this.timeSlotService.bookSlot(scheduledDate, estimate.vehicleType);

    // 5. Envoyer notifications
    await this.notificationService.sendBookingConfirmation(booking);

    return this.formatBookingResponse(booking);
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        estimate: {
          include: { vehicle: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return this.formatBookingResponse(booking);
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        estimate: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    // Vérifier si on peut modifier (pas encore confirmé ou en cours)
    if (['IN_PROGRESS', 'COMPLETED'].includes(existingBooking.status)) {
      throw new BadRequestException('Cannot modify booking in current status');
    }

    // Si on change la date, vérifier la disponibilité
    if (updateBookingDto.scheduledAt) {
      const newDate = new Date(updateBookingDto.scheduledAt);

      // ✅ FIX: Vérifier que estimateId n'est pas null
      if (!existingBooking.estimateId) {
        throw new BadRequestException('Booking has no associated estimate');
      }

      const estimate = await this.prisma.estimate.findUnique({
        where: { id: existingBooking.estimateId },
      });

      // ✅ FIX: Vérifier que estimate existe
      if (!estimate) {
        throw new NotFoundException('Associated estimate not found');
      }

      const isAvailable = await this.timeSlotService.isSlotAvailable(
        newDate,
        estimate.vehicleType,
      );

      if (!isAvailable) {
        throw new ConflictException('New time slot is not available');
      }

      // Libérer l'ancien créneau et réserver le nouveau
      await this.timeSlotService.releaseSlot(
        existingBooking.scheduledAt,
        estimate.vehicleType,
      );
      await this.timeSlotService.bookSlot(newDate, estimate.vehicleType);
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: updateBookingDto,
      include: {
        estimate: {
          include: { vehicle: true },
        },
      },
    });

    // Notifier du changement
    await this.notificationService.sendBookingUpdate(booking);

    return this.formatBookingResponse(booking);
  }

  async cancel(id: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { estimate: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Mettre à jour le statut
    await this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // ✅ FIX: Vérifier que estimate existe
    if (booking.estimate) {
      await this.timeSlotService.releaseSlot(
        booking.scheduledAt,
        booking.estimate.vehicleType,
      );
    }

    // Notifier de l'annulation
    await this.notificationService.sendBookingCancellation(booking);
  }

  async confirm(id: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        estimate: {
          include: { vehicle: true },
        },
      },
    });

    await this.notificationService.sendBookingConfirmed(booking);

    return this.formatBookingResponse(booking);
  }

  async getStatus(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        updatedAt: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      ...booking,
      estimatedArrival: this.calculateETA(booking.scheduledAt),
    };
  }

  async findByUser(userId: string): Promise<BookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      include: {
        estimate: {
          include: { vehicle: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((booking) => this.formatBookingResponse(booking));
  }

  private formatBookingResponse(booking: any): BookingResponseDto {
    return {
      id: booking.id,
      estimateId: booking.estimateId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      estimate: booking.estimate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private calculateETA(scheduledTime: Date): Date {
    // Logique pour calculer ETA en temps réel
    return scheduledTime;
  }
}

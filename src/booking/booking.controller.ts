import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { TimeSlotService, TimeSlot } from './services/time-slot.service'; // ✅ FIXED: Import TimeSlot type
import {
  CreateBookingDto,
  UpdateBookingDto,
  TimeSlotQueryDto,
  BookingResponseDto,
} from './dto/booking.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly timeSlotService: TimeSlotService,
  ) {}

  // Créer une nouvelle réservation
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.create(createBookingDto);
  }

  // Obtenir les créneaux disponibles
  @Public()
  @Get('availability/slots')
  async getAvailableTimeSlots(@Query() query: TimeSlotQueryDto): Promise<{
    date: string;
    slots: TimeSlot[];
    timezone: string;
  }> {  // ✅ FIXED: Added explicit return type
    return this.timeSlotService.getAvailableSlots(
      query.date,
      query.vehicleType,
      query.serviceArea,
    );
  }

  // Obtenir les heures chargées (surge pricing)
  @Public()
  @Get('availability/busy-times')
  async getBusyTimes(@Query('date') date: string) {
    return this.timeSlotService.getBusyTimes(date);
  }

  // Obtenir une réservation par ID
  @Get(':id')
  async getBooking(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingService.findOne(id);
  }

  // Mettre à jour une réservation
  @Put(':id')
  async updateBooking(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.update(id, updateBookingDto);
  }

  // Annuler une réservation
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelBooking(@Param('id') id: string): Promise<void> {
    return this.bookingService.cancel(id);
  }

  // Obtenir le statut en temps réel
  @Get(':id/status')
  async getBookingStatus(@Param('id') id: string) {
    return this.bookingService.getStatus(id);
  }

  // Confirmer une réservation
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmBooking(@Param('id') id: string) {
    return this.bookingService.confirm(id);
  }

  // Obtenir l'historique des réservations (utilisateur connecté)
  @Get('user/history')
  async getUserBookings(@CurrentUser() user: any) {
    return this.bookingService.findByUser(user.id);
  }

  // Réserver un créneau temporairement
  @Public()
  @Post('slots/reserve')
  @HttpCode(HttpStatus.OK)
  async reserveTimeSlot(
    @Body() reserveDto: { date: string; timeSlot: string; estimateId: string },
  ) {
    return this.timeSlotService.reserveSlot(
      reserveDto.date,
      reserveDto.timeSlot,
      reserveDto.estimateId,
    );
  }
}
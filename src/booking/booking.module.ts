import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { TimeSlotService } from './services/time-slot.service';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, TimeSlotService, NotificationService],
  exports: [BookingService],
})
export class BookingModule {}
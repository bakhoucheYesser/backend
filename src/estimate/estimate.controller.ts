import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EstimateService } from './estimate.service';
import { CreateEstimateDto, EstimateResponseDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('estimate')
export class EstimateController {
  constructor(private readonly estimateService: EstimateService) {}

  @Public()
  @Post('calculate')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async calculateEstimate(
    @Body() createEstimateDto: CreateEstimateDto,
  ): Promise<EstimateResponseDto> {
    return this.estimateService.calculateEstimate(createEstimateDto);
  }

  @Public()
  @Get('vehicles')
  async getAvailableVehicles() {
    return this.estimateService.getAvailableVehicles();
  }

  @Public()
  @Post('geocode/search')
  async searchAddresses(
    @Body()
    searchDto: {
      query: string;
      userLocation?: { lat: number; lng: number };
    },
  ) {
    return this.estimateService.searchAddresses(
      searchDto.query,
      searchDto.userLocation,
    );
  }

  @Public()
  @Post('geocode/route')
  async calculateRoute(
    @Body() routeDto: { origin: string; destination: string },
  ) {
    return this.estimateService.calculateRoute(
      routeDto.origin,
      routeDto.destination,
    );
  }
}

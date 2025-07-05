import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(registerDto);

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      result.user.id,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return result;
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 tentatives par minute
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(loginDto);

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      result.user.id,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      this.authService.clearTokensCookies(response);
      throw new Error('Token de rafraîchissement manquant');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(refreshToken);

    this.authService.setTokensCookies(response, accessToken, newRefreshToken);

    return { message: 'Tokens rafraîchis avec succès' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies?.refreshToken;

    await this.authService.logout(refreshToken);
    this.authService.clearTokensCookies(response);

    return { message: 'Déconnexion réussie' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id);
    this.authService.clearTokensCookies(response);

    return { message: 'Déconnexion de tous les appareils réussie' };
  }

  @Get('me')
  getProfile(@CurrentUser() user: any): any {
    return { user };
  }
}

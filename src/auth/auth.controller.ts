import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  UserRole,
  ClientRegisterDto,
  ProviderRegisterDto,
  DriverRegisterDto,
  AuthResponseDto,
  RefreshTokenDto
} from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ===========================================
  // 🔐 LOGIN UNIFIÉ POUR TOUS LES RÔLES
  // ===========================================
  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      result.user.id,
      result.user.role,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return {
      user: result.user,
      message: `Connexion réussie en tant que ${result.user.role}`,
    };
  }

  // ===========================================
  // 📝 INSCRIPTION CLIENTS
  // ===========================================
  @Public()
  @Post('register/client')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async registerClient(
    @Body() registerDto: ClientRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerClient(registerDto);

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      result.user.id,
      result.user.role,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return result;
  }

  // ===========================================
  // 🏢 INSCRIPTION FOURNISSEURS
  // ===========================================
  @Public()
  @Post('register/provider')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async registerProvider(
    @Body() registerDto: ProviderRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerProvider(registerDto);

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      result.user.id,
      result.user.role,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return result;
  }

  // ===========================================
  // 🚗 INSCRIPTION CONDUCTEURS
  // ===========================================
  @Public()
  @Post('register/driver')
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  async registerDriver(
    @Body() registerDto: DriverRegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.registerDriver(registerDto);

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      result.user.id,
      result.user.role,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return result;
  }

  // ===========================================
  // 🔄 REFRESH TOKEN
  // ===========================================
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    try {
      const refreshToken = request.cookies?.refreshToken;

      if (!refreshToken) {
        this.authService.clearTokensCookies(response);
        throw new UnauthorizedException('Token de rafraîchissement manquant');
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await this.authService.refreshTokens(refreshToken);

      this.authService.setTokensCookies(response, accessToken, newRefreshToken);

      return { message: 'Tokens rafraîchis avec succès' };
    } catch (error) {
      // Clear cookies on any refresh error
      this.authService.clearTokensCookies(response);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log the actual error for debugging
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  // ===========================================
  // 🚪 DÉCONNEXION
  // ===========================================
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

  // ===========================================
  //  PROFIL UTILISATEUR
  // ===========================================
  @Get('me')
  async getProfile(@CurrentUser() user: any): Promise<{ user: any }> {
    const fullProfile = await this.authService.getUserProfile(user.id);
    return { user: fullProfile };
  }

  // ===========================================
  //  CHANGEMENT DE CONTEXTE DE RÔLE
  // ===========================================
  @Post('switch-role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER, UserRole.DRIVER) // Seuls ces rôles peuvent changer de contexte
  async switchRoleContext(
    @CurrentUser() user: any,
    @Body('targetRole') targetRole: UserRole,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    // Vérifier que l'utilisateur peut accéder à ce rôle
    const canSwitch = await this.authService.canSwitchToRole(user.id, targetRole);

    if (!canSwitch) {
      throw new Error("Vous n'avez pas accès à ce rôle");
    }

    const { accessToken, refreshToken } = await this.authService.generateTokens(
      user.id,
      targetRole,
    );

    this.authService.setTokensCookies(response, accessToken, refreshToken);

    return {
      message: `Contexte changé vers ${targetRole}`
    };
  }

  // ===========================================
  //  ADMIN SEULEMENT - Promouvoir utilisateur
  // ===========================================
  @Post('admin/promote')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async promoteUser(
    @Body('userId') userId: string,
    @Body('newRole') newRole: UserRole,
  ): Promise<{ message: string }> {
    await this.authService.updateUserRole(userId, newRole);
    return { message: `Utilisateur promu au rôle ${newRole}` };
  }
}

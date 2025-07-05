import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, nom, prenom } = registerDto;

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      this.logger.warn(
        `Registration attempt with existing email: ${normalizedEmail}`,
      );
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        nom,
        prenom,
        password: hashedPassword,
      },
    });
    this.logger.log(`New user registered: ${normalizedEmail}`);
    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }


  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;
    const normalizedEmail = email.toLowerCase().trim();

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      this.logger.warn(`Failed login attempt for email: ${normalizedEmail}`, {
        email: normalizedEmail,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for email: ${normalizedEmail}`, {
        email: normalizedEmail,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Identifiants invalides');
    }

    this.logger.log(`Successful login for email: ${normalizedEmail}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }


  async generateTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    // Stocker le refresh token en base
    await this.storeRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Vérifier que le token existe en base
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || !storedToken.user.isActive) {
        throw new UnauthorizedException('Token invalide');
      }

      // Supprimer l'ancien refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Générer de nouveaux tokens
      return this.generateTokens(payload.sub);
    } catch (error) {
      throw new UnauthorizedException('Token invalide');
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  setTokensCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS obligatoire en production
      sameSite: 'strict' as const,
      path: '/',
      ...(cookieDomain && { domain: cookieDomain }),
    };

    // Access token (courte durée)
    response.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh token (longue durée)
    response.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    });
  }



  clearTokensCookies(response: Response): void {
    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('refreshToken', { path: '/' });
  }
}

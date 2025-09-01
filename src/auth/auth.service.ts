import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  LoginDto,
  ClientRegisterDto,
  ProviderRegisterDto,
  DriverRegisterDto,
  AuthResponseDto,
  UserRole,
  UserProfileDto,
} from './dto';
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

  // ===========================================
  // 🔐 LOGIN UNIFIÉ
  // ===========================================
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password, roleContext } = loginDto;
    const normalizedEmail = email.toLowerCase().trim();

    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        providerProfile: true,
        driverProfile: true,
      },
    });

    if (!user || !user.isActive) {
      this.logger.warn(`Failed login attempt for email: ${normalizedEmail}`);
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for email: ${normalizedEmail}`);
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifier le contexte de rôle si spécifié
    if (roleContext && !this.canAccessRole(user, roleContext)) {
      throw new ForbiddenException(`Accès refusé au rôle ${roleContext}`);
    }

    this.logger.log(
      `Successful login for email: ${normalizedEmail} as ${roleContext || user.role}`,
    );

    return {
      user: this.formatUserProfile(
        user,
        roleContext || (user.role as UserRole),
      ),
    };
  }

  // ===========================================
  // 📝 INSCRIPTION CLIENT
  // ===========================================
  async registerClient(
    registerDto: ClientRegisterDto,
  ): Promise<AuthResponseDto> {
    const { email, password, nom, prenom } = registerDto;
    const normalizedEmail = email.toLowerCase().trim();

    await this.checkEmailAvailable(normalizedEmail);

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        nom,
        prenom,
        password: hashedPassword,
        role: UserRole.CLIENT,
      },
    });

    this.logger.log(`New client registered: ${normalizedEmail}`);

    return {
      user: this.formatUserProfile(user, UserRole.CLIENT),
      message: 'Inscription client réussie',
    };
  }

  // ===========================================
  // 🏢 INSCRIPTION FOURNISSEUR
  // ===========================================
  async registerProvider(
    registerDto: ProviderRegisterDto,
  ): Promise<AuthResponseDto> {
    const {
      email,
      password,
      nom,
      prenom,
      companyName,
      baseAddress,
      licenseNumber,
      insuranceNumber,
    } = registerDto;
    const normalizedEmail = email.toLowerCase().trim();

    await this.checkEmailAvailable(normalizedEmail);

    const hashedPassword = await bcrypt.hash(password, 12);

    // Transaction pour créer utilisateur + profil fournisseur
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          nom,
          prenom,
          password: hashedPassword,
          role: UserRole.PROVIDER,
        },
      });

      // Créer le profil fournisseur
      const provider = await tx.provider.create({
        data: {
          userId: user.id,
          companyName,
          baseAddress,
          baseCoordinates: '45.5017,-73.5673', // TODO: Géocoder l'adresse
          licenseNumber,
          insuranceNumber,
          isVerified: false, // Nécessite vérification admin
          isActive: false, // Activé après vérification
        },
      });

      return { user, provider };
    });

    this.logger.log(
      `New provider registered: ${normalizedEmail} - ${companyName}`,
    );

    return {
      user: this.formatUserProfile(result.user, UserRole.PROVIDER),
      message: 'Inscription fournisseur réussie. Vérification en cours.',
    };
  }

  // ===========================================
  // 🚗 INSCRIPTION CONDUCTEUR
  // ===========================================
  async registerDriver(
    registerDto: DriverRegisterDto,
  ): Promise<AuthResponseDto> {
    const {
      email,
      password,
      nom,
      prenom,
      licenseNumber,
      licenseExpiry,
      experienceYears,
    } = registerDto;
    const normalizedEmail = email.toLowerCase().trim();

    await this.checkEmailAvailable(normalizedEmail);

    const hashedPassword = await bcrypt.hash(password, 12);

    // Note: Un conducteur doit être assigné à un fournisseur
    // Pour MVP, on peut le créer et l'assigner plus tard via admin
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        nom,
        prenom,
        password: hashedPassword,
        role: UserRole.DRIVER,
      },
    });

    this.logger.log(`New driver registered: ${normalizedEmail}`);

    return {
      user: this.formatUserProfile(user, UserRole.DRIVER),
      message: "Inscription conducteur réussie. En attente d'assignation.",
    };
  }

  // ===========================================
  // 🔄 GESTION DES TOKENS
  // ===========================================
  async generateTokens(
    userId: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: userId,
      role,
      type: 'access',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn:
            this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        },
      ),
    ]);

    // Stocker le refresh token
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
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
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
      return this.generateTokens(payload.sub, payload.role);
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

  // ===========================================
  // 👤 GESTION DU PROFIL
  // ===========================================
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: {
          include: {
            vehicles: true,
            drivers: true,
          }
        },
        driverProfile: {
          include: {
            provider: true,
          }
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return this.formatUserProfile(user, user.role as UserRole);
  }

  // ===========================================
  // 🔄 CHANGEMENT DE RÔLE
  // ===========================================
  async canSwitchToRole(userId: string, targetRole: UserRole): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: true,
        driverProfile: true,
      },
    });

    if (!user) return false;

    return this.canAccessRole(user, targetRole);
  }

  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    this.logger.log(`User ${userId} role updated to ${newRole}`);
  }

  // ===========================================
  // 🍪 GESTION DES COOKIES
  // ===========================================
  setTokensCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    console.log(`Setting cookies - Production: ${isProduction}, Domain: ${cookieDomain}`);

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS)
      sameSite: 'lax' as const, // Changed from 'strict' for development
      path: '/',
      ...(isProduction && cookieDomain && { domain: cookieDomain }),
    };

    response.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    response.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log('Cookies set successfully');
  }

  clearTokensCookies(response: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    const clearOptions = {
      path: '/',
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      ...(isProduction && cookieDomain && { domain: cookieDomain }),
    };

    response.clearCookie('accessToken', clearOptions);
    response.clearCookie('refreshToken', clearOptions);

    console.log('Cookies cleared successfully');
  }

  // ===========================================
  // 🛠️ MÉTHODES UTILITAIRES PRIVÉES
  // ===========================================
  private async checkEmailAvailable(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration attempt with existing email: ${email}`);
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
  }

  private canAccessRole(user: any, role: UserRole): boolean {
    // Logique pour déterminer si un utilisateur peut accéder à un rôle
    switch (role) {
      case UserRole.CLIENT:
        return true; // Tout le monde peut être client

      case UserRole.PROVIDER:
        return user.role === UserRole.PROVIDER && user.providerProfile;

      case UserRole.DRIVER:
        return user.role === UserRole.DRIVER && user.driverProfile;

      case UserRole.ADMIN:
        return user.role === UserRole.ADMIN;

      default:
        return false;
    }
  }

  private formatUserProfile(user: any, contextRole: UserRole): UserProfileDto {
    const baseProfile: UserProfileDto = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: contextRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    // Ajouter des données spécifiques au rôle
    if (contextRole === UserRole.PROVIDER && user.providerProfile) {
      baseProfile.provider = {
        id: user.providerProfile.id,
        companyName: user.providerProfile.companyName,
        isVerified: user.providerProfile.isVerified,
        rating: user.providerProfile.rating ? Number(user.providerProfile.rating) : undefined,
        totalJobs: user.providerProfile.totalJobs,
        vehicles: user.providerProfile.vehicles?.length || 0,
      };
    }

    if (contextRole === UserRole.DRIVER && user.driverProfile) {
      baseProfile.driver = {
        id: user.driverProfile.id,
        licenseNumber: user.driverProfile.licenseNumber,
        rating: user.driverProfile.rating ? Number(user.driverProfile.rating) : undefined,
        totalTrips: user.driverProfile.totalTrips,
        isAvailable: user.driverProfile.isAvailable,
        provider: user.driverProfile.provider?.companyName,
      };
    }

    return baseProfile;
  }
}

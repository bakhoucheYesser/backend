import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Middleware pour les cookies
  app.use(cookieParser());

  // Headers de sécurité avec Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: [
            "'self'",
            'https://geocode.search.hereapi.com',
            'https://router.hereapi.com',
          ],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Validation globale améliorée
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: configService.get('NODE_ENV') === 'production',
    }),
  );

  // CORS sécurisé
  const isProduction = configService.get('NODE_ENV') === 'production';
  const allowedOrigins = isProduction
    ? [configService.get('FRONTEND_URL')]
    : [
        'http://localhost:5173',
        'http://localhost:3001',
        'http://127.0.0.1:5173',
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['set-cookie'],
  });

  app.setGlobalPrefix('api');

  const port = parseInt(configService.get<string>('PORT') || '3000', 10);
  await app.listen(port);

  console.log(`🚀 Backend running on: http://localhost:${port}/api`);
  console.log(`🔒 Security headers enabled`);
  console.log(`📱 CORS configured for: ${allowedOrigins.join(', ')}`);
}
bootstrap().catch((err) => {
  console.error('Application failed to start:', err);
  process.exit(1);
});

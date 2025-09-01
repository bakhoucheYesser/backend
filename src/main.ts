import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'], // Reduce logging in production
    });

    const configService = app.get(ConfigService);
    const isProduction = configService.get('NODE_ENV') === 'production';

    // Security middleware
    app.use(cookieParser());
    app.use(compression());

    // Enhanced Helmet configuration
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              'https://fonts.googleapis.com',
            ],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            scriptSrc: ["'self'"],
            connectSrc: [
              "'self'",
              'https://geocode.search.hereapi.com',
              'https://router.hereapi.com',
              ...(isProduction
                ? []
                : ['ws://localhost:*', 'http://localhost:*']),
            ],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: isProduction
          ? {
              maxAge: 31536000,
              includeSubDomains: true,
              preload: true,
            }
          : false,
        noSniff: true,
        xssFilter: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Enhanced validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        disableErrorMessages: isProduction,
        forbidUnknownValues: true,
        validateCustomDecorators: true,
      }),
    );

    // CORS configuration
    const allowedOrigins = isProduction
      ? [
          configService.get('FRONTEND_URL'),
          configService.get('ADMIN_URL'), // If you have an admin panel
        ].filter(Boolean)
      : [
          'http://localhost:5173',
          'http://localhost:3001',
          'http://127.0.0.1:5173',
          'http://localhost:8080', // Vue dev server alternative port
        ];

    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'Origin',
      ],
      exposedHeaders: ['set-cookie'],
      optionsSuccessStatus: 200,
      maxAge: isProduction ? 86400 : 0, // Cache preflight for 24h in production
    });

    // API prefix
    app.setGlobalPrefix('api', {
      exclude: [
        'health', // Health check endpoint
        { path: '', method: RequestMethod.GET }, // Root endpoint
      ],
    });

    // Swagger documentation (only in development)
    if (!isProduction) {
      const config = new DocumentBuilder()
        .setTitle('GrandoGo API')
        .setDescription('Platform API for transport and moving services')
        .setVersion('1.0')
        .addCookieAuth('accessToken')
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      logger.log('📖 Swagger documentation available at /api/docs');
    }

    // Start server
    const port = parseInt(configService.get<string>('PORT') || '3000', 10);
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Backend running on: http://localhost:${port}/api`);
    logger.log(`🔒 Security headers enabled`);
    logger.log(`📱 CORS configured for: ${allowedOrigins.join(', ')}`);
    logger.log(
      `🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`,
    );
  } catch (error) {
    logger.error('❌ Application failed to start:', error);
    process.exit(1);
  }
}

bootstrap();

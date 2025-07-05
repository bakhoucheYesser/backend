import { plainToClass, Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPort,
  IsUrl,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION: string;

  @IsOptional()
  @IsString()
  HERE_API_KEY?: string;

  @IsOptional()
  @IsPort()
  PORT?: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  APP_URL?: string;

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach((error) => {
      console.error(
        `  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
      );
    });
    throw new Error('Invalid environment configuration');
  }

  console.log('✅ Environment configuration validated successfully');
  return validatedConfig;
}

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Limiter par IP + email pour les tentatives de connexion
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
}
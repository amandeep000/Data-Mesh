import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { ITokenPort } from '../../../domain/ports/outbound/token.port';

@Injectable()
export class JwtTokenAdapter implements ITokenPort {
  private readonly accessSecret = process.env['JWT_SECRET'] ?? 'fallback-secret';
  private readonly refreshSecret = process.env['JWT_REFRESH_SECRET'] ?? 'fallback-refresh-secret';
  private readonly accessExpiry = (process.env['JWT_EXPIRY'] ?? '15m') as jwt.SignOptions['expiresIn'];
  private readonly refreshExpiry = (process.env['JWT_REFRESH_EXPIRY'] ?? '7d') as jwt.SignOptions['expiresIn'];

  async generateAccessToken(userId: string, role: string): Promise<string> {
    return jwt.sign({ sub: userId, role }, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return jwt.sign({ sub: userId }, this.refreshSecret, {
      expiresIn: this.refreshExpiry,
    });
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; role: string }> {
    const payload = jwt.verify(token, this.accessSecret) as { sub: string; role: string };
    return { userId: payload.sub, role: payload.role };
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    const payload = jwt.verify(token, this.refreshSecret) as { sub: string };
    return { userId: payload.sub };
  }
}
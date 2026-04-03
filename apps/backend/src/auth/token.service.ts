import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import { AccessTokenPayload } from './interfaces/access-token-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';

interface IssuedRefreshToken {
  token: string;
  tokenId: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(
        'auth.accessTokenSecret',
        'tripbazarbd-dev-access-secret',
      ),
      expiresIn: this.parseTokenTtl(
        this.configService.get<string>('auth.accessTokenExpiresIn', '15m'),
      ),
    });
  }

  async verifyAccessToken(accessToken: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(
        accessToken,
        {
          secret: this.configService.get<string>(
            'auth.accessTokenSecret',
            'tripbazarbd-dev-access-secret',
          ),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  async signRefreshToken(userId: string): Promise<IssuedRefreshToken> {
    const tokenId = randomUUID();
    const refreshTokenTtl = this.parseTokenTtl(
      this.configService.get<string>('auth.refreshTokenExpiresIn', '7d'),
    );
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        jti: tokenId,
        type: 'refresh' as const,
      },
      {
        secret: this.configService.get<string>(
          'auth.refreshTokenSecret',
          'tripbazarbd-dev-refresh-secret',
        ),
        expiresIn: refreshTokenTtl,
      },
    );

    return {
      token,
      tokenId,
      expiresAt: new Date(Date.now() + refreshTokenTtl * 1000),
    };
  }

  async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>(
            'auth.refreshTokenSecret',
            'tripbazarbd-dev-refresh-secret',
          ),
        },
      );

      if (payload.type !== 'refresh' || !payload.jti) {
        throw new UnauthorizedException('Invalid refresh token.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  compareRefreshToken(refreshToken: string, tokenHash: string): boolean {
    return this.hashRefreshToken(refreshToken) === tokenHash;
  }

  private parseTokenTtl(rawTtl: string): number {
    const normalizedTtl = rawTtl.trim().toLowerCase();

    if (/^\d+$/.test(normalizedTtl)) {
      return Number.parseInt(normalizedTtl, 10);
    }

    const durationMatch = normalizedTtl.match(/^(\d+)(s|m|h|d)$/);

    if (!durationMatch) {
      throw new Error(`Unsupported JWT TTL format: ${rawTtl}`);
    }

    const value = Number.parseInt(durationMatch[1], 10);
    const multipliers = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 60 * 60 * 24,
    };
    const unit = durationMatch[2] as keyof typeof multipliers;

    return value * multipliers[unit];
  }
}

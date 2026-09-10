import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../../config/env.validation';
import type { JwtPayload } from './jwt.strategy';

export interface JwtRefreshUser {
  id: string;
  email: string;
  refreshToken: string;
}

/**
 * Stratégie JWT pour le refresh token (30 jours).
 * Extrait le refresh token depuis le body de la requête.
 * Passe le refresh token brut pour comparaison dans le service.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET', { infer: true }),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtRefreshUser {
    const body = req.body as Record<string, unknown>;
    const refreshToken = body.refreshToken;

    if (typeof refreshToken !== 'string') {
      throw new Error('Refresh token manquant dans le body');
    }

    return {
      id: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}

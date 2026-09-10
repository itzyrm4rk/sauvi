import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard pour l'endpoint de refresh token.
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

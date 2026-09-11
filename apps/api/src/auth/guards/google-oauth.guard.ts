import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Guard pour les endpoints Google OAuth.
 * Transmet dynamiquement l'URL de redirection (ex: deep link mobile) via le paramètre OAuth state.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const redirectUri = req.query.redirect_uri as string | undefined;

    return {
      state: redirectUri || undefined,
    };
  }
}

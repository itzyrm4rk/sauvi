import { type ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Décorateur de paramètre pour extraire l'utilisateur authentifié de la requête.
 * Utilisé dans les controllers : @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user;
});

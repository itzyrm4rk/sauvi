import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Décorateur pour marquer un endpoint comme public (pas de JWT requis).
 * Utilisé en combinaison avec le JwtAuthGuard global.
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);

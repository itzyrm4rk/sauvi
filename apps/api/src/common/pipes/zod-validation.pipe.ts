import { type ArgumentMetadata, BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodError, ZodSchema } from 'zod';

/**
 * Pipe de validation générique basé sur Zod.
 * Valide le body de la requête contre un schéma Zod et retourne les erreurs formatées.
 *
 * @example
 * @Post()
 * async create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto) {}
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const zodError: ZodError = result.error;
      const formattedErrors = zodError.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw new BadRequestException({
        message: 'Validation échouée',
        details: formattedErrors,
      });
    }

    return result.data;
  }
}

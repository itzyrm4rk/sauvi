import {
  type ArgumentsHost,
  Catch,
  ConflictException,
  type ExceptionFilter,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

/**
 * Transforme les erreurs Prisma en exceptions HTTP typées SAUVI.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);
  private readonly httpFilter = new HttpExceptionFilter();

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const httpException = this.mapPrismaError(exception);
    this.logger.warn(`Prisma ${exception.code} — ${exception.message}`);
    this.httpFilter.catch(httpException, host);
  }

  private mapPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): ConflictException | NotFoundException | InternalServerErrorException {
    switch (exception.code) {
      case 'P2002':
        return new ConflictException('Une ressource avec ces données existe déjà');
      case 'P2025':
        return new NotFoundException('Ressource introuvable');
      case 'P2003':
        return new ConflictException('Référence invalide vers une ressource liée');
      default:
        return new InternalServerErrorException('Erreur de base de données');
    }
  }
}

/**
 * Filtre pour les erreurs de validation Prisma (données invalides).
 */
@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaValidationExceptionFilter.name);
  private readonly httpFilter = new HttpExceptionFilter();

  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost): void {
    this.logger.warn(`Prisma validation — ${exception.message}`);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides pour la base de données',
      },
    });
  }
}

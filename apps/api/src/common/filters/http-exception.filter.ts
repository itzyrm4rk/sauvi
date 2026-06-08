import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Filtre global pour formater toutes les HttpException au format SAUVI.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = exception.message;
    let details: unknown;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObject = exceptionResponse as Record<string, unknown>;
      if (typeof responseObject.message === 'string') {
        message = responseObject.message;
      } else if (Array.isArray(responseObject.message)) {
        message = responseObject.message.join(', ');
        details = responseObject.message;
      }
      if (responseObject.details !== undefined) {
        details = responseObject.details;
      }
    }

    const code = this.mapStatusToCode(status);

    const body: ErrorResponse = {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };

    this.logger.warn(`HTTP ${status} — ${code}: ${message}`);

    response.status(status).json(body);
  }

  private mapStatusToCode(status: number): string {
    const statusMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    return statusMap[status] ?? 'HTTP_ERROR';
  }
}

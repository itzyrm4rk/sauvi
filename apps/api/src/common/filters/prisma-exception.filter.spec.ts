import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  const filter = new PrismaExceptionFilter();

  const createHost = (): {
    host: { switchToHttp: () => { getResponse: () => { status: jest.Mock } } };
    status: jest.Mock;
    json: jest.Mock;
  } => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    return {
      status,
      json,
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
        }),
      },
    };
  };

  it('should return CONFLICT when unique constraint is violated', () => {
    const { status, json, host } = createHost();
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '6.0.0',
    });

    filter.catch(error, host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'CONFLICT' }),
      }),
    );
  });

  it('should return NOT_FOUND when record is not found', () => {
    const { status, json, host } = createHost();
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
    });

    filter.catch(error, host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      }),
    );
  });
});

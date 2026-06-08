import { Test, type TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
          },
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should return health status when health endpoint is called', async () => {
    const result = await controller.getHealth();
    expect(result.data.status).toBe('ok');
    expect(result.data.database).toBe('connected');
    expect(result.data.redis).toBe('connected');
  });
});

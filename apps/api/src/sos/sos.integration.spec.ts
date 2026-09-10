import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { INestApplication, NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BloodType, NotificationType, SosStatus } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { BloodCompatibilityService } from '../eligibility/blood-compatibility.service';
import { FcmService } from '../notifications/fcm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SosController } from './sos.controller';
import { SosService } from './sos.service';

@Injectable()
class TestUserMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    req.user = {
      id: 'requester-1',
      email: 'requester@sauvi.test',
      name: 'Requester',
      profileComplete: true,
    };
    next();
  }
}

describe('SosController integration', () => {
  let app: INestApplication<App>;
  let prismaService: jest.Mocked<PrismaService>;
  let fcmService: jest.Mocked<FcmService>;

  const now = new Date('2026-06-26T10:00:00.000Z');
  const createdSos = {
    id: 'sos-1',
    requesterId: 'requester-1',
    bloodTypeNeeded: BloodType.A_POS,
    unitsNeeded: 2,
    priority: 'urgence_vitale',
    hospitalName: 'Hopital Laquintinie',
    hospitalAddress: 'Boulevard de la Liberte',
    latitude: 4.0511,
    longitude: 9.7679,
    city: 'Douala',
    status: SosStatus.active,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const createBody = {
    bloodTypeNeeded: 'A+',
    unitsNeeded: 2,
    priority: 'urgence_vitale',
    hospitalName: 'Hopital Laquintinie',
    hospitalAddress: 'Boulevard de la Liberte',
    latitude: 4.0511,
    longitude: 9.7679,
    city: 'Douala',
  };

  beforeEach(async () => {
    const mockPrisma = {
      sosAlert: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdSos),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
      inAppNotification: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const mockFcm = {
      sendToDevice: jest.fn(),
      sendToMany: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0 }),
    } as unknown as jest.Mocked<FcmService>;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SosController],
      providers: [
        SosService,
        NotificationsService,
        BloodCompatibilityService,
        TestUserMiddleware,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FcmService, useValue: mockFcm },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(new TestUserMiddleware().use);
    await app.init();

    prismaService = moduleFixture.get(PrismaService);
    fcmService = moduleFixture.get(FcmService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /sos should send push notifications to matching donors by direct token', async () => {
    (prismaService.user.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 'donor-1', fcmToken: 'token-1' }])
      .mockResolvedValueOnce([{ id: 'donor-1', fcmToken: 'token-1' }])
      .mockResolvedValueOnce([
        { id: 'user-other-city', fcmToken: 'token-2' },
        { id: 'user-ineligible', fcmToken: null },
      ]);

    await request(app.getHttpServer()).post('/sos').send(createBody).expect(201);

    expect(prismaService.user.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: { not: 'requester-1' },
        city: 'Douala',
        OR: [{ isEligible: true }, { nextEligibleDate: { lte: expect.any(Date) } }],
        bloodType: { in: [BloodType.O_NEG, BloodType.O_POS, BloodType.A_NEG, BloodType.A_POS] },
        fcmToken: { not: null },
      },
      select: { id: true, fcmToken: true },
    });
    expect(fcmService.sendToMany).toHaveBeenCalledWith(
      ['token-1'],
      expect.objectContaining({
        data: { type: 'sos_created', sosId: 'sos-1' },
      }),
    );
  });

  it('POST /sos should create in-app notifications for non matching users only', async () => {
    (prismaService.user.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 'donor-1', fcmToken: 'token-1' }])
      .mockResolvedValueOnce([{ id: 'donor-1', fcmToken: 'token-1' }])
      .mockResolvedValueOnce([
        { id: 'user-other-city', fcmToken: 'token-2' },
        { id: 'user-ineligible', fcmToken: null },
      ]);

    await request(app.getHttpServer()).post('/sos').send(createBody).expect(201);

    expect(prismaService.inAppNotification.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: 'user-other-city',
          sosId: 'sos-1',
          type: NotificationType.sos_share,
          title: '🚨 Relayer un SOS urgent',
          body: '🚨 URGENCE SAUVI : Besoin urgent de don de sang A+ (2 unité(s)) à Hopital Laquintinie — Douala.',
          shareUrl: 'sauvi://sos/sos-1',
        },
        {
          userId: 'user-ineligible',
          sosId: 'sos-1',
          type: NotificationType.sos_share,
          title: '🚨 Relayer un SOS urgent',
          body: '🚨 URGENCE SAUVI : Besoin urgent de don de sang A+ (2 unité(s)) à Hopital Laquintinie — Douala.',
          shareUrl: 'sauvi://sos/sos-1',
        },
      ],
    });
  });

  it('POST /sos should return 409 when requester already has an active SOS', async () => {
    (prismaService.sosAlert.findFirst as jest.Mock).mockResolvedValue({ id: 'active-sos' });

    await request(app.getHttpServer()).post('/sos').send(createBody).expect(409);
    expect(fcmService.sendToMany).not.toHaveBeenCalled();
  });
});

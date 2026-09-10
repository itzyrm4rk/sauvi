import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BloodType, SosStatus } from '@prisma/client';
import { BloodCompatibilityService } from '../eligibility/blood-compatibility.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSosDto } from './dto/create-sos.dto';
import { SosService } from './sos.service';

describe('SosService', () => {
  let service: SosService;
  let prismaService: jest.Mocked<PrismaService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const now = new Date('2026-06-26T10:00:00.000Z');
  const mockSos = {
    id: 'sos-1',
    requesterId: 'user-1',
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

  const createDto: CreateSosDto = {
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
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SosService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationsService,
          useValue: {
            notifySosCreated: jest.fn().mockResolvedValue({
              data: { pushRecipients: 0, inAppRecipients: 0 },
            }),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
        BloodCompatibilityService,
      ],
    }).compile();

    service = module.get<SosService>(SosService);
    prismaService = module.get(PrismaService);
    notificationsService = module.get(NotificationsService);
  });

  describe('create', () => {
    it('should create a SOS when user has no active SOS', async () => {
      (prismaService.sosAlert.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.sosAlert.create as jest.Mock).mockResolvedValue(mockSos);

      const result = await service.create('user-1', createDto);

      expect(prismaService.sosAlert.findFirst).toHaveBeenCalledWith({
        where: { requesterId: 'user-1', status: SosStatus.active },
        select: { id: true },
      });
      expect(prismaService.sosAlert.create).toHaveBeenCalledWith({
        data: {
          requesterId: 'user-1',
          bloodTypeNeeded: BloodType.A_POS,
          unitsNeeded: 2,
          priority: 'urgence_vitale',
          hospitalName: 'Hopital Laquintinie',
          hospitalAddress: 'Boulevard de la Liberte',
          latitude: 4.0511,
          longitude: 9.7679,
          city: 'Douala',
        },
        select: expect.any(Object),
      });
      expect(notificationsService.notifySosCreated).toHaveBeenCalledWith(mockSos);
      expect(result.data).toEqual(mockSos);
    });

    it('should reject creation when user already has an active SOS', async () => {
      (prismaService.sosAlert.findFirst as jest.Mock).mockResolvedValue({ id: 'sos-active' });

      await expect(service.create('user-1', createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('getActiveForUser', () => {
    it('should return the active SOS for the user', async () => {
      (prismaService.sosAlert.findFirst as jest.Mock).mockResolvedValue(mockSos);

      const result = await service.getActiveForUser('user-1');

      expect(prismaService.sosAlert.findFirst).toHaveBeenCalledWith({
        where: { requesterId: 'user-1', status: SosStatus.active },
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
      expect(result.data).toEqual(mockSos);
    });

    it('should return null when user has no active SOS', async () => {
      (prismaService.sosAlert.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getActiveForUser('user-1');

      expect(result.data).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return a SOS by id', async () => {
      (prismaService.sosAlert.findUnique as jest.Mock).mockResolvedValue(mockSos);

      const result = await service.getById('sos-1');

      expect(prismaService.sosAlert.findUnique).toHaveBeenCalledWith({
        where: { id: 'sos-1' },
        select: expect.any(Object),
      });
      expect(result.data).toEqual(mockSos);
    });

    it('should throw NotFoundException when SOS does not exist', async () => {
      (prismaService.sosAlert.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('close', () => {
    it('should close a SOS owned by the user', async () => {
      const closedSos = { ...mockSos, status: SosStatus.closed, closedAt: now };

      (prismaService.sosAlert.findUnique as jest.Mock).mockResolvedValue({
        id: 'sos-1',
        requesterId: 'user-1',
        status: SosStatus.active,
      });
      (prismaService.sosAlert.update as jest.Mock).mockResolvedValue(closedSos);

      const result = await service.close('user-1', 'sos-1');

      expect(prismaService.sosAlert.update).toHaveBeenCalledWith({
        where: { id: 'sos-1' },
        data: {
          status: SosStatus.closed,
          closedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
      expect(result.data).toEqual(closedSos);
    });

    it('should throw NotFoundException when SOS does not exist', async () => {
      (prismaService.sosAlert.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.close('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the SOS', async () => {
      (prismaService.sosAlert.findUnique as jest.Mock).mockResolvedValue({
        id: 'sos-1',
        requesterId: 'other-user',
        status: SosStatus.active,
      });

      await expect(service.close('user-1', 'sos-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getNearby', () => {
    it('should return active SOS alerts in the requested city', async () => {
      (prismaService.sosAlert.findMany as jest.Mock).mockResolvedValue([mockSos]);

      const result = await service.getNearby('Douala');

      expect(prismaService.sosAlert.findMany).toHaveBeenCalledWith({
        where: { city: 'Douala', status: SosStatus.active },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        select: expect.any(Object),
        skip: 0,
        take: 20,
      });
      expect(result.data).toEqual([mockSos]);
    });
  });
});

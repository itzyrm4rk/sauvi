import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EligibilityService } from '../eligibility/eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;
  let eligibilityService: jest.Mocked<EligibilityService>;
  let storageService: jest.Mocked<SupabaseStorageService>;

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123456789',
    city: 'Douala',
    bloodType: 'O_POS',
    gender: 'masculin',
    birthDate: new Date('2000-01-01'),
    avatarUrl: null,
    reputationPoints: 10,
    isEligible: true,
    lastDonationDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Create mocks with correct typing for PrismaService methods we use
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const mockEligibility = {
      calculateNextEligibleDate: jest.fn(),
      isCurrentlyEligible: jest.fn(),
      getDaysRemaining: jest.fn(),
    } as unknown as jest.Mocked<EligibilityService>;

    const mockStorage = {
      uploadBuffer: jest.fn(),
    } as unknown as jest.Mocked<SupabaseStorageService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EligibilityService, useValue: mockEligibility },
        { provide: SupabaseStorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
    eligibilityService = module.get(EligibilityService);
    storageService = module.get(SupabaseStorageService);
  });

  describe('getMe', () => {
    it('should return user data when user exists', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getMe('user-1');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.any(Object),
      });
      expect(result.data).toEqual(mockUser);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getMe('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMe', () => {
    it('should update user and return new data', async () => {
      const dto = { city: 'Yaoundé' };
      const updatedUser = { ...mockUser, city: 'Yaoundé' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.updateMe('user-1', dto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: dto,
        select: expect.any(Object),
      });
      expect(result.data).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user is not found before update', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.updateMe('user-1', { city: 'Yaoundé' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadAvatar', () => {
    it('should upload image to Supabase Storage and update user avatarUrl', async () => {
      const mockBuffer = Buffer.from('fake-image-data');
      const mockUrl = 'https://xxxx.supabase.co/storage/v1/object/public/avatars/user-1-123456.jpg';
      const updatedUser = { ...mockUser, avatarUrl: mockUrl };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      storageService.uploadBuffer.mockResolvedValue(mockUrl);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.uploadAvatar('user-1', mockBuffer, 'image/jpeg');

      expect(storageService.uploadBuffer).toHaveBeenCalledWith(
        mockBuffer,
        expect.stringMatching(/^avatars\/user-1-\d+\.jpeg$/),
        'image/jpeg',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { avatarUrl: mockUrl },
        select: expect.any(Object),
      });
      expect(result.data).toEqual(updatedUser);
    });
  });

  describe('getEligibility', () => {
    it('should calculate eligibility and update user status in DB', async () => {
      const mockNextDate = new Date('2025-05-01');

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        gender: 'masculin',
        lastDonationDate: new Date('2025-01-01'),
      });

      eligibilityService.calculateNextEligibleDate.mockReturnValue(mockNextDate);
      eligibilityService.isCurrentlyEligible.mockReturnValue(false);
      eligibilityService.getDaysRemaining.mockReturnValue(30);

      (prismaService.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' });

      const result = await service.getEligibility('user-1');

      expect(eligibilityService.calculateNextEligibleDate).toHaveBeenCalledWith(
        'masculin',
        new Date('2025-01-01'),
      );

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isEligible: false,
          nextEligibleDate: mockNextDate,
        },
        select: { id: true },
      });

      expect(result.data).toEqual({
        isEligible: false,
        nextEligibleDate: mockNextDate,
        daysRemaining: 30,
      });
    });
  });

  describe('updateFcmToken', () => {
    it('should update fcm token', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prismaService.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' });

      const result = await service.updateFcmToken('user-1', { fcmToken: 'new-token' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { fcmToken: 'new-token' },
        select: { id: true },
      });
      expect(result.data.message).toEqual('FCM token mis à jour');
    });
  });
});

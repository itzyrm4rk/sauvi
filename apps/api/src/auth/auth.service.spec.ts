import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthService } from './auth.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_value'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock crypto
jest.mock('node:crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock_reset_token_hex'),
  }),
}));

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-minimum-32-chars',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
      FRONTEND_URL: 'http://localhost:8081',
    };
    return config[key];
  }),
};

const mockRedisClient = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
};

const mockRedisService = {
  getClient: jest.fn().mockReturnValue(mockRedisClient),
};

const mockMailService = {
  sendMail: jest.fn().mockResolvedValue(true),
  sendPasswordResetOtp: jest.fn().mockResolvedValue(true),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_value');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.signAsync
      .mockResolvedValueOnce('mock_access_token')
      .mockResolvedValueOnce('mock_refresh_token');
    mockRedisService.getClient.mockReturnValue(mockRedisClient);
  });

  describe('registerStep1', () => {
    const dto = { name: 'John Doe', email: 'john@example.com', password: 'Password1' };

    it('should create a new user and return tokens when email is not taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        city: '',
        bloodType: 'O_POS',
        gender: 'masculin',
        birthDate: new Date('2000-01-01'),
        avatarUrl: null,
        reputationPoints: 0,
        isEligible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.registerStep1(dto);

      expect(result.data.user.email).toBe('john@example.com');
      expect(result.data.tokens.accessToken).toBe('mock_access_token');
      expect(result.data.tokens.refreshToken).toBe('mock_refresh_token');
      expect(result.data.profileComplete).toBe(false);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when email is already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.registerStep1(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('registerStep2', () => {
    const dto = {
      bloodType: 'A+' as const,
      gender: 'masculin' as const,
      birthDate: '2000-01-15T00:00:00.000Z',
      city: 'Douala',
      phone: '+237690000000',
    };

    it('should complete user profile when valid data is provided', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.registerStep2('user-1', dto);

      expect(result.data.profileComplete).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          bloodType: 'A_POS',
          gender: 'masculin',
          city: 'Douala',
          phone: '+237690000000',
        }),
      });
    });

    it('should throw BadRequestException when blood type is invalid', async () => {
      const invalidDto = { ...dto, bloodType: 'INVALID' as 'A+' };

      await expect(service.registerStep2('user-1', invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const dto = { email: 'john@example.com', password: 'Password1' };

    it('should return tokens and user data when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        phone: '+237690000000',
        city: 'Douala',
        bloodType: 'A_POS',
        gender: 'masculin',
        birthDate: new Date('2000-01-15'),
        avatarUrl: null,
        reputationPoints: 10,
        isEligible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.login(dto);

      expect(result.data.user.email).toBe('john@example.com');
      expect(result.data.tokens.accessToken).toBe('mock_access_token');
      expect(result.data.profileComplete).toBe(true);
      // Ensure passwordHash is NOT in the response
      expect((result.data.user as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
        phone: '+237690000000',
        city: 'Douala',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no password (Google-only account)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        passwordHash: null,
        phone: '+237690000000',
      });

      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens when refresh token is valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        refreshToken: 'hashed_refresh_token',
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.refreshTokens('user-1', 'valid_refresh_token');

      expect(result.data.tokens.accessToken).toBe('mock_access_token');
      expect(result.data.tokens.refreshToken).toBe('mock_refresh_token');
    });

    it('should throw ForbiddenException when user has no refresh token in DB', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        refreshToken: null,
      });

      await expect(service.refreshTokens('user-1', 'some_token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when refresh token does not match hash', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        refreshToken: 'hashed_refresh_token',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('user-1', 'wrong_token')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('logout', () => {
    it('should nullify refresh token in database', async () => {
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.logout('user-1');

      expect(result.data.message).toBe('Déconnexion réussie');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
    });
  });

  describe('forgotPassword', () => {
    it('should store OTP in Redis and send email when user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
      });

      const result = await service.forgotPassword({ email: 'john@example.com' });

      expect(result.data.message).toContain('code de réinitialisation');
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'reset-otp:john@example.com',
        expect.any(String),
        'EX',
        900,
      );
      expect(mockMailService.sendPasswordResetOtp).toHaveBeenCalledWith(
        'john@example.com',
        expect.any(String),
        'John Doe',
      );
    });

    it('should return same message when user does not exist (no information leak)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'unknown@example.com' });

      expect(result.data.message).toContain('code de réinitialisation');
      expect(mockRedisClient.set).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password and invalidate sessions when OTP is valid', async () => {
      mockRedisClient.get.mockResolvedValue('123456');
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.resetPassword({
        email: 'john@example.com',
        otp: '123456',
        password: 'NewPassword1',
      });

      expect(result.data.message).toBe('Mot de passe réinitialisé avec succès');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          passwordHash: 'hashed_value',
          refreshToken: null,
        },
      });
      expect(mockRedisClient.del).toHaveBeenCalledWith('reset-otp:john@example.com');
    });

    it('should throw BadRequestException when OTP is expired or invalid', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'john@example.com',
          otp: '000000',
          password: 'NewPassword1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateGoogleUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'john@gmail.com',
      name: 'John Google',
      avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
    };

    it('should return existing user when googleId is found', async () => {
      const existingUser = {
        id: 'user-1',
        name: 'John Google',
        email: 'john@gmail.com',
        googleId: 'google-123',
        phone: '+237690000000',
        city: 'Douala',
        bloodType: 'A_POS',
        gender: 'masculin',
        birthDate: new Date('2000-01-15'),
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        reputationPoints: 0,
        isEligible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.data.user.email).toBe('john@gmail.com');
      expect(result.data.tokens.accessToken).toBe('mock_access_token');
    });

    it('should create new user when googleId and email are not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user',
        name: 'John Google',
        email: 'john@gmail.com',
        googleId: 'google-123',
        phone: '',
        city: '',
        bloodType: 'O_POS',
        gender: 'masculin',
        birthDate: new Date('2000-01-01'),
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        reputationPoints: 0,
        isEligible: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.data.profileComplete).toBe(false);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const tokens = await service.generateTokens('user-1', 'john@example.com');

      expect(tokens.accessToken).toBe('mock_access_token');
      expect(tokens.refreshToken).toBe('mock_refresh_token');
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });
});

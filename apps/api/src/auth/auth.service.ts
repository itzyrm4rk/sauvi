import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { BloodType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Env } from '../config/env.validation';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterStep1Dto } from './dto/register-step1.dto';
import type { RegisterStep2Dto } from './dto/register-step2.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { GoogleProfile } from './strategies/google.strategy';
import type { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_SALT_ROUNDS = 12;
const RESET_OTP_TTL_SECONDS = 900; // 15 minutes
const RESET_OTP_PREFIX = 'reset-otp:';

/** Champs sélectionnés pour les réponses user — jamais de passwordHash */
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  city: true,
  bloodType: true,
  gender: true,
  birthDate: true,
  avatarUrl: true,
  reputationPoints: true,
  isEligible: true,
  createdAt: true,
  updatedAt: true,
} as const;

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      bloodType: string | null;
      gender: string | null;
      birthDate: Date | null;
      avatarUrl: string | null;
      reputationPoints: number;
      isEligible: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    tokens: AuthTokens;
    profileComplete: boolean;
  };
}

/**
 * Service d'authentification — gère l'inscription, la connexion, les tokens JWT,
 * Google OAuth, la réinitialisation de mot de passe.
 *
 * Refresh tokens : hashés avec bcrypt avant stockage en base, rotation à chaque utilisation.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Env, true>,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async registerStep1(dto: RegisterStep1Dto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: `pending_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        city: '',
        bloodType: 'O_POS',
        gender: 'masculin',
        birthDate: new Date('2000-01-01'),
      },
      select: USER_SELECT,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    this.logger.log(`Inscription step1 réussie pour ${user.email}`);

    return {
      data: {
        user,
        tokens,
        profileComplete: false,
      },
    };
  }

  async registerStep2(
    userId: string,
    dto: RegisterStep2Dto,
  ): Promise<{ data: { profileComplete: boolean } }> {
    const bloodTypeMap: Record<string, string> = {
      'O-': 'O_NEG',
      'O+': 'O_POS',
      'A-': 'A_NEG',
      'A+': 'A_POS',
      'B-': 'B_NEG',
      'B+': 'B_POS',
      'AB-': 'AB_NEG',
      'AB+': 'AB_POS',
    };

    const prismaBloodType = bloodTypeMap[dto.bloodType];
    if (!prismaBloodType) {
      throw new BadRequestException('Groupe sanguin invalide');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        bloodType: prismaBloodType as BloodType,
        gender: dto.gender as 'masculin' | 'feminin',
        birthDate: new Date(dto.birthDate),
        city: dto.city,
        phone: dto.phone,
      },
    });

    this.logger.log(`Inscription step2 complétée pour userId=${userId}`);

    return { data: { profileComplete: true } };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        ...USER_SELECT,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await this.comparePasswords(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    // Exclure passwordHash de la réponse
    const { passwordHash: _, ...userWithoutPassword } = user;

    const profileComplete = Boolean(user.phone && user.city && user.phone !== '');

    this.logger.log(`Connexion réussie pour ${user.email}`);

    return {
      data: {
        user: userWithoutPassword,
        tokens,
        profileComplete,
      },
    };
  }

  /**
   * Rafraîchit la paire de tokens JWT.
   * Le refresh token est comparé au hash stocké en base, puis remplacé (rotation).
   */
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ data: { tokens: AuthTokens } }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, refreshToken: true },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Accès refusé');
    }

    const isRefreshTokenValid = await this.comparePasswords(refreshToken, user.refreshToken);

    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Refresh token invalide');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    this.logger.log(`Tokens rafraîchis pour userId=${userId}`);

    return { data: { tokens } };
  }

  /**
   * Déconnexion — supprime le refresh token hashé en base.
   */
  async logout(userId: string): Promise<{ data: { message: string } }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.logger.log(`Déconnexion réussie pour userId=${userId}`);

    return { data: { message: 'Déconnexion réussie' } };
  }

  /**
   * Mot de passe oublié — génère un code OTP à 6 chiffres stocké dans Redis (TTL 15 min)
   * et l'envoie par email via le MailService.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ data: { message: string } }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      select: { id: true, email: true, name: true },
    });

    // Toujours retourner un succès pour ne pas révéler l'existence d'un compte
    if (!user) {
      this.logger.warn(`Tentative de reset pour un email inexistant : ${dto.email}`);
      return {
        data: {
          message: 'Si un compte existe avec cet email, un code de réinitialisation a été envoyé',
        },
      };
    }

    // Générer un code OTP numérique sécurisé à 6 chiffres (ex: 739281)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `${RESET_OTP_PREFIX}${user.email.toLowerCase().trim()}`;

    const redis = this.redisService.getClient();
    await redis.set(redisKey, otp, 'EX', RESET_OTP_TTL_SECONDS);

    // Envoi de l'email sécurisé anti-spam
    await this.mailService.sendPasswordResetOtp(user.email, otp, user.name);

    this.logger.log(`Code OTP de réinitialisation envoyé pour ${user.email}`);

    return {
      data: {
        message: 'Si un compte existe avec cet email, un code de réinitialisation a été envoyé',
      },
    };
  }

  /**
   * Réinitialise le mot de passe avec le code OTP reçu par email.
   * Valide le code dans Redis, met à jour le mot de passe, invalide le refresh token.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ data: { message: string } }> {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const redisKey = `${RESET_OTP_PREFIX}${normalizedEmail}`;
    const redis = this.redisService.getClient();
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp || storedOtp !== dto.otp) {
      throw new BadRequestException('Code de réinitialisation invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const passwordHash = await this.hashPassword(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        refreshToken: null, // Invalider toutes les sessions
      },
    });

    // Supprimer le code OTP Redis une fois utilisé
    await redis.del(redisKey);

    this.logger.log(`Mot de passe réinitialisé avec succès pour userId=${user.id}`);

    return { data: { message: 'Mot de passe réinitialisé avec succès' } };
  }

  /**
   * Valide ou crée un utilisateur via Google OAuth.
   * Si l'utilisateur existe déjà (par googleId ou email), retourne ses tokens.
   * Sinon, crée un nouveau compte partiel.
   */
  async validateGoogleUser(profile: GoogleProfile): Promise<AuthResponse> {
    // Chercher par googleId d'abord, puis par email
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
      select: { ...USER_SELECT, googleId: true },
    });

    if (!user) {
      // Vérifier si un compte avec le même email existe
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
        select: { id: true },
      });

      if (existingByEmail) {
        // Lier le compte Google au compte existant
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: profile.avatarUrl,
          },
          select: { ...USER_SELECT, googleId: true },
        });
      } else {
        // Créer un nouveau compte partiel
        user = await this.prisma.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            googleId: profile.googleId,
            avatarUrl: profile.avatarUrl,
            // Champs obligatoires — valeurs par défaut, complétés en step2
            phone: `pending_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            city: '',
            bloodType: 'O_POS',
            gender: 'masculin',
            birthDate: new Date('2000-01-01'),
          },
          select: { ...USER_SELECT, googleId: true },
        });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    const { googleId: _, ...userWithoutGoogleId } = user;
    const profileComplete = Boolean(user.phone && user.city && user.phone !== '');

    this.logger.log(`Connexion Google réussie pour ${user.email}`);

    return {
      data: {
        user: userWithoutGoogleId,
        tokens,
        profileComplete,
      },
    };
  }

  /**
   * Génère une paire de tokens JWT (access + refresh).
   */
  async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET', { infer: true }),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', { infer: true }),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', {
          infer: true,
        }),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Met à jour le hash du refresh token en base.
   */
  private async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await this.hashPassword(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hash },
    });
  }

  /**
   * Hash un mot de passe avec bcrypt.
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  /**
   * Compare un mot de passe en clair avec un hash bcrypt.
   */
  private async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Vérifie un token JWT pour une connexion WebSocket.
   */
  async verifyWsToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('JWT_SECRET', { infer: true }),
      });
      return payload;
    } catch {
      return null;
    }
  }
}

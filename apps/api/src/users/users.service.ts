import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EligibilityService } from '../eligibility/eligibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseStorageService } from '../storage/supabase-storage.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

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
  fcmToken: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eligibilityService: EligibilityService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return { data: user };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    // Vérifier l'unicité du téléphone s'il a changé
    if (dto.phone && dto.phone !== user.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
        select: { id: true },
      });
      if (existingPhone && existingPhone.id !== userId) {
        throw new ConflictException('Ce numéro de téléphone est déjà associé à un autre compte');
      }
    }

    // Vérifier l'unicité de l'email s'il a changé
    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
        select: { id: true },
      });
      if (existingEmail && existingEmail.id !== userId) {
        throw new ConflictException('Cette adresse email est déjà associée à un autre compte');
      }
    }

    // Nettoyer les propriétés undefined
    const cleanData = Object.fromEntries(Object.entries(dto).filter(([_, v]) => v !== undefined));
    if (cleanData.email) {
      cleanData.email = (cleanData.email as string).toLowerCase();
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: cleanData,
      select: USER_SELECT,
    });

    return { data: updatedUser };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Ce compte utilise une connexion tierce (Google). Vous ne pouvez pas modifier de mot de passe.',
      );
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mot de passe actuel incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent du mot de passe actuel',
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        refreshToken: '', // Invalide le refresh token existant pour forcer la sécurité
      },
      select: { id: true },
    });

    return { data: { message: 'Mot de passe mis à jour avec succès' } };
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimeType: string) {
    // Le timestamp assure une URL unique et force le refresh du cache CDN
    const timestamp = Date.now();
    const extension = mimeType.split('/')[1] ?? 'jpg';
    const key = `avatars/${userId}-${timestamp}.${extension}`;

    // Upload brut sans conversion — les transformations sont appliquées côté CDN
    // via paramètres URL (?width=200&quality=80)
    const avatarUrl = await this.storageService.uploadBuffer(buffer, key, mimeType);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: USER_SELECT,
    });

    return { data: updatedUser };
  }

  async getEligibility(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true, lastDonationDate: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const nextEligibleDate = this.eligibilityService.calculateNextEligibleDate(
      user.gender,
      user.lastDonationDate,
    );

    const isEligible = this.eligibilityService.isCurrentlyEligible(nextEligibleDate);
    const daysRemaining = this.eligibilityService.getDaysRemaining(nextEligibleDate);

    // Mettre à jour le statut en base si nécessaire
    // S'il n'est pas éligible, la vérification le dira.
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isEligible,
        nextEligibleDate,
      },
      select: { id: true },
    });

    return {
      data: {
        isEligible,
        nextEligibleDate,
        daysRemaining,
      },
    };
  }

  async updateFcmToken(userId: string, dto: UpdateFcmTokenDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: dto.fcmToken },
      select: { id: true },
    });

    return { data: { message: 'FCM token mis à jour' } };
  }

  async disableNotifications(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
      select: { id: true },
    });
    return { data: { message: 'Notifications désactivées' } };
  }

  async getActiveDonation(userId: string) {
    const active = await this.prisma.donorWaitlist.findFirst({
      where: {
        donorId: userId,
        status: { in: ['waiting', 'validated'] },
        sos: { status: 'active' },
      },
      include: {
        sos: {
          select: {
            id: true,
            hospitalName: true,
            hospitalAddress: true,
            city: true,
            bloodTypeNeeded: true,
            unitsNeeded: true,
            priority: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return { data: active };
  }

  async getPublicProfile(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        bloodType: true,
        reputationPoints: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const [totalDonations, totalSos, badges] = await Promise.all([
      this.prisma.donorWaitlist.count({
        where: { donorId: targetUserId, status: 'donated' },
      }),
      this.prisma.sosAlert.count({
        where: { requesterId: targetUserId },
      }),
      this.prisma.badge.findMany({
        where: { userId: targetUserId },
        select: { type: true, earnedAt: true },
        orderBy: { earnedAt: 'asc' },
      }),
    ]);

    return {
      data: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        city: user.city,
        bloodType: user.bloodType,
        reputationPoints: user.reputationPoints,
        totalDonations,
        totalSos,
        memberSince: user.createdAt,
        badges,
      },
    };
  }

  async getDonationHistory(userId: string) {
    const entries = await this.prisma.donorWaitlist.findMany({
      where: { donorId: userId, status: 'donated' },
      orderBy: { donatedAt: 'desc' },
      select: {
        id: true,
        donatedAt: true,
        sos: {
          select: {
            id: true,
            hospitalName: true,
            city: true,
            bloodTypeNeeded: true,
            createdAt: true,
            requester: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });
    return {
      data: entries.map((e) => ({
        id: e.id,
        sosId: e.sos.id,
        date: e.donatedAt,
        hospitalName: e.sos.hospitalName,
        city: e.sos.city,
        bloodTypeNeeded: e.sos.bloodTypeNeeded,
        pointsEarned: 50,
        requesterId: e.sos.requester?.id ?? null,
        requesterName: e.sos.requester?.name ?? null,
        requesterPhone: e.sos.requester?.phone ?? null,
        sosCreatedAt: e.sos.createdAt,
      })),
    };
  }

  async getSosHistory(userId: string) {
    const alerts = await this.prisma.sosAlert.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bloodTypeNeeded: true,
        unitsNeeded: true,
        priority: true,
        hospitalName: true,
        hospitalAddress: true,
        latitude: true,
        longitude: true,
        city: true,
        status: true,
        createdAt: true,
        closedAt: true,
        _count: {
          select: {
            waitlist: { where: { status: 'donated' } },
          },
        },
        waitlist: {
          where: { status: 'donated' },
          orderBy: { donatedAt: 'asc' },
          select: {
            donor: { select: { id: true, name: true, phone: true, bloodType: true } },
          },
        },
      },
    });

    // Compte total des inscrits (tous statuts sauf cancelled/rejected)
    const waitlistCounts = await Promise.all(
      alerts.map((a) =>
        this.prisma.donorWaitlist.count({
          where: {
            sosId: a.id,
            status: { notIn: ['cancelled', 'rejected'] },
          },
        }),
      ),
    );

    return {
      data: alerts.map((a, i) => ({
        id: a.id,
        bloodTypeNeeded: a.bloodTypeNeeded,
        unitsNeeded: a.unitsNeeded,
        priority: a.priority,
        hospitalName: a.hospitalName,
        hospitalAddress: a.hospitalAddress,
        latitude: a.latitude ? Number(a.latitude) : undefined,
        longitude: a.longitude ? Number(a.longitude) : undefined,
        city: a.city,
        status: a.status,
        createdAt: a.createdAt,
        closedAt: a.closedAt,
        donationsCount: a._count.waitlist,
        waitlistCount: waitlistCounts[i],
        donors: a.waitlist.map((w) => ({
          id: w.donor.id,
          name: w.donor.name,
          phone: w.donor.phone ?? null,
          bloodType: w.donor.bloodType ?? null,
        })),
        firstDonorId: a.waitlist[0]?.donor?.id ?? null,
        firstDonorName: a.waitlist[0]?.donor?.name ?? null,
        firstDonorPhone: a.waitlist[0]?.donor?.phone ?? null,
        firstDonorBloodType: a.waitlist[0]?.donor?.bloodType ?? null,
      })),
    };
  }
}

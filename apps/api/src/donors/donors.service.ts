import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BloodType, NotificationType, Priority, SosStatus, WaitlistStatus } from '@prisma/client';
import { EligibilityService } from '../eligibility/eligibility.service';
import { FcmService } from '../notifications/fcm.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReputationAction, ReputationService } from '../reputation/reputation.service';
import { DonorsGateway } from './donors.gateway';
import type { JoinWaitlistDto } from './dto/join-waitlist.dto';

/**
 * Calcule la distance en km entre deux points GPS via la formule de Haversine.
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // arrondi à 1 décimale
}

@Injectable()
export class DonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
    private readonly reputationService: ReputationService,
    private readonly eligibilityService: EligibilityService,
    private readonly donorsGateway: DonorsGateway,
  ) {}

  async join(donorId: string, sosId: string, dto?: JoinWaitlistDto) {
    const sos = await this.prisma.sosAlert.findUnique({ where: { id: sosId } });
    if (!sos) throw new NotFoundException('SOS introuvable');
    if (sos.status !== SosStatus.active) throw new ConflictException("Ce SOS n'est plus actif");
    if (sos.requesterId === donorId)
      throw new ForbiddenException('Vous ne pouvez pas rejoindre votre propre SOS');

    // Vérifier si le donneur a déjà un engagement actif sur un autre SOS
    const existingActive = await this.prisma.donorWaitlist.findFirst({
      where: {
        donorId,
        status: { in: [WaitlistStatus.waiting, WaitlistStatus.validated] },
        sos: { status: SosStatus.active },
      },
      include: {
        sos: { select: { id: true, hospitalName: true, city: true } },
      },
    });

    if (existingActive && existingActive.sosId !== sosId) {
      throw new ConflictException(
        `Vous êtes déjà inscrit dans la file d'attente d'un autre SOS (${existingActive.sos.hospitalName}). Veuillez annuler votre participation précédente avant d'en rejoindre une nouvelle.`,
      );
    }

    const donor = await this.prisma.user.findUnique({ where: { id: donorId } });
    if (!donor) throw new NotFoundException('Utilisateur introuvable');
    const isEligibleNow =
      donor.isEligible ||
      (donor.nextEligibleDate && new Date(donor.nextEligibleDate) <= new Date());
    if (!isEligibleNow)
      throw new ForbiddenException("Vous n'êtes pas éligible au don actuellement");

    try {
      const waitlistEntry = await this.prisma.donorWaitlist.create({
        data: {
          sosId,
          donorId,
          status: WaitlistStatus.waiting,
          latitude: dto?.latitude ?? null,
          longitude: dto?.longitude ?? null,
        },
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              bloodType: true,
              phone: true,
              avatarUrl: true,
              city: true,
              isEligible: true,
            },
          },
        },
      });

      // Notif FCM à la famille
      const requester = await this.prisma.user.findUnique({
        where: { id: sos.requesterId },
        select: { fcmToken: true, name: true },
      });
      if (requester?.fcmToken) {
        await this.fcmService.sendToDevice(requester.fcmToken, {
          title: 'Nouveau donneur disponible !',
          body: `${donor?.name} a rejoint la file d'attente de votre SOS.`,
          data: { type: 'donor_joined', sosId },
        });
      }

      // Enregistrement de la notification dans la cloche du demandeur
      await this.prisma.inAppNotification.create({
        data: {
          userId: sos.requesterId,
          sosId,
          type: NotificationType.donor_joined,
          title: 'Nouveau donneur disponible !',
          body: `${donor?.name} a rejoint la file d'attente de votre SOS.`,
        },
      });

      await this.reputationService.addPoints(donorId, ReputationAction.JOINED_WAITLIST);

      this.donorsGateway.emitDonorJoined(sosId, waitlistEntry.donor);

      const waitlist = await this.getWaitlistData(sosId);
      this.donorsGateway.emitWaitlistUpdate(sosId, waitlist);

      return { data: waitlistEntry };
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException("Vous êtes déjà dans la liste d'attente");
      throw error;
    }
  }

  async getActiveParticipation(donorId: string) {
    const active = await this.prisma.donorWaitlist.findFirst({
      where: {
        donorId,
        status: { in: [WaitlistStatus.waiting, WaitlistStatus.validated] },
        sos: { status: SosStatus.active },
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

  async cancel(donorId: string, sosId: string) {
    const entry = await this.prisma.donorWaitlist.findUnique({
      where: { sosId_donorId: { sosId, donorId } },
    });

    if (!entry) throw new NotFoundException("Vous n'êtes pas dans la liste d'attente");
    if (entry.status === WaitlistStatus.donated)
      throw new ConflictException("Impossible d'annuler un don déjà effectué");
    if (entry.status === WaitlistStatus.cancelled) throw new ConflictException('Déjà annulé');

    await this.prisma.donorWaitlist.update({
      where: { id: entry.id },
      data: { status: WaitlistStatus.cancelled },
    });

    // Déduire les 5 pts accordés à l'inscription pour éviter le farming
    await this.reputationService.deductPoints(donorId, 5);

    // Si était validé, notif à la famille
    if (entry.status === WaitlistStatus.validated) {
      // Notifier la famille que le donneur validé a annulé
      const sos = await this.prisma.sosAlert.findUnique({
        where: { id: sosId },
        select: { requesterId: true },
      });
      if (sos) {
        const requester = await this.prisma.user.findUnique({
          where: { id: sos.requesterId },
          select: { fcmToken: true },
        });
        const donor = await this.prisma.user.findUnique({
          where: { id: donorId },
          select: { name: true },
        });
        if (requester?.fcmToken) {
          await this.fcmService.sendToDevice(requester.fcmToken, {
            title: 'Donneur désisté',
            body: `${donor?.name || 'Un donneur'} a annulé sa participation.`,
            data: { type: 'donor_cancelled', sosId },
          });
        }
        await this.prisma.inAppNotification.create({
          data: {
            userId: sos.requesterId,
            sosId,
            type: NotificationType.donor_cancelled,
            title: 'Donneur désisté',
            body: `${donor?.name || 'Un donneur'} a annulé sa participation.`,
          },
        });
      }
    }

    const waitlist = await this.getWaitlistData(sosId);
    this.donorsGateway.emitWaitlistUpdate(sosId, waitlist);

    return { success: true };
  }

  async updateStatus(
    requesterId: string,
    sosId: string,
    donorId: string,
    newStatus: WaitlistStatus,
  ) {
    const sos = await this.prisma.sosAlert.findUnique({ where: { id: sosId } });
    if (!sos) throw new NotFoundException('SOS introuvable');
    if (sos.requesterId !== requesterId)
      throw new ForbiddenException('Seul le créateur du SOS peut faire ça');

    const entry = await this.prisma.donorWaitlist.findUnique({
      where: { sosId_donorId: { sosId, donorId } },
    });

    if (!entry) throw new NotFoundException('Donneur introuvable dans la liste');
    if (entry.status === WaitlistStatus.donated)
      throw new ConflictException('Le don est déjà confirmé');
    if (entry.status === WaitlistStatus.cancelled || entry.status === WaitlistStatus.rejected) {
      throw new ConflictException('Ce donneur a annulé ou été refusé');
    }

    const updated = await this.prisma.donorWaitlist.update({
      where: { id: entry.id },
      data: {
        status: newStatus,
        ...(newStatus === WaitlistStatus.validated ? { validatedAt: new Date() } : {}),
        ...(newStatus === WaitlistStatus.donated ? { donatedAt: new Date() } : {}),
      },
    });

    if (newStatus === WaitlistStatus.validated) {
      // Notifier le donneur qu'il a été sélectionné
      const donorUser = await this.prisma.user.findUnique({
        where: { id: donorId },
        select: { fcmToken: true },
      });
      if (donorUser?.fcmToken) {
        await this.fcmService.sendToDevice(donorUser.fcmToken, {
          title: 'Vous avez été sélectionné !',
          body: "Le demandeur vous a choisi pour ce don. Rendez-vous à l'hôpital.",
          data: { type: 'donor_validated', sosId },
        });
      }
      await this.prisma.inAppNotification.create({
        data: {
          userId: donorId,
          sosId,
          type: NotificationType.donor_validated,
          title: 'Vous avez été sélectionné !',
          body: "Le demandeur vous a choisi pour ce don. Rendez-vous à l'hôpital.",
        },
      });
    }

    if (newStatus === WaitlistStatus.donated) {
      // Calculer les points et l'action de réputation
      let action = ReputationAction.DONATED;
      let pointsEarned = 50;

      if (sos.priority === Priority.urgence_vitale) {
        action = ReputationAction.DONATED_URGENCY;
        pointsEarned = 75;
      } else if (sos.bloodTypeNeeded === BloodType.O_NEG) {
        action = ReputationAction.DONATED_O_NEG;
        pointsEarned = 100;
      }

      // Notifier le donneur que son don a été confirmé
      const donorUser = await this.prisma.user.findUnique({
        where: { id: donorId },
        select: { fcmToken: true },
      });
      if (donorUser?.fcmToken) {
        await this.fcmService.sendToDevice(donorUser.fcmToken, {
          title: 'Don confirmé par le demandeur !',
          body: `Merci pour votre don. Vous avez gagné +${pointsEarned} points de réputation.`,
          data: { type: 'donation_confirmed', sosId },
        });
      }
      await this.prisma.inAppNotification.create({
        data: {
          userId: donorId,
          sosId,
          type: NotificationType.donation_confirmed,
          title: 'Don confirmé par le demandeur !',
          body: `Merci pour votre don. Vous avez gagné +${pointsEarned} points de réputation.`,
        },
      });
      // Wrapped dans un try/catch pour que les erreurs de badge ne cassent pas la réponse
      try {
        await this.reputationService.addPoints(donorId, action);
        await this.eligibilityService.updateDonorEligibility(donorId);
      } catch (e: unknown) {
        console.error('Erreur reputationService.addPoints (donation):', e);
      }

      // Clôture automatique si toutes les unités requises sont collectées
      const totalDonated = await this.prisma.donorWaitlist.count({
        where: { sosId, status: WaitlistStatus.donated },
      });

      if (totalDonated >= sos.unitsNeeded) {
        await this.prisma.sosAlert.update({
          where: { id: sosId },
          data: {
            status: SosStatus.fulfilled,
            closedAt: new Date(),
          },
        });
        this.donorsGateway.emitSosClosed(sosId);
      }
    }

    const waitlist = await this.getWaitlistData(sosId);
    this.donorsGateway.emitWaitlistUpdate(sosId, waitlist);

    return { data: updated };
  }

  async getWaitlist(sosId: string, userId: string) {
    const sos = await this.prisma.sosAlert.findUnique({ where: { id: sosId } });
    if (!sos) throw new NotFoundException('SOS introuvable');

    const isRequester = sos.requesterId === userId;
    const waitlist = await this.getWaitlistData(sosId);

    if (!isRequester) {
      // Masquer le numéro de téléphone des autres donneurs pour préserver la vie privée
      return {
        data: waitlist.map((entry) => ({
          ...entry,
          donor: {
            ...entry.donor,
            phone: entry.donor.id === userId ? entry.donor.phone : null,
          },
        })),
      };
    }

    return { data: waitlist };
  }

  /**
   * Permet à un donneur de voir sa propre entrée dans la file d'attente
   * sans avoir besoin d'être le requester.
   */
  async getMyWaitlistEntry(sosId: string, donorId: string) {
    const entry = await this.prisma.donorWaitlist.findUnique({
      where: { sosId_donorId: { sosId, donorId } },
      select: {
        id: true,
        sosId: true,
        donorId: true,
        status: true,
        joinedAt: true,
        validatedAt: true,
        donatedAt: true,
      },
    });
    return { data: entry ?? null };
  }

  private async getWaitlistData(sosId: string) {
    const sos = await this.prisma.sosAlert.findUnique({
      where: { id: sosId },
      select: { latitude: true, longitude: true },
    });

    const entries = await this.prisma.donorWaitlist.findMany({
      where: { sosId, status: { not: WaitlistStatus.cancelled } },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            bloodType: true,
            phone: true,
            avatarUrl: true,
            city: true,
            isEligible: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return entries.map((entry) => {
      let distanceKm: number | null = null;
      if (sos && entry.latitude != null && entry.longitude != null) {
        distanceKm = haversineKm(
          Number(sos.latitude),
          Number(sos.longitude),
          Number(entry.latitude),
          Number(entry.longitude),
        );
      }
      return { ...entry, distanceKm };
    });
  }
}

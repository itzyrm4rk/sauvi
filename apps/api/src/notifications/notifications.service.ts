import { Injectable } from '@nestjs/common';
import { BloodType, NotificationType, type Prisma, WaitlistStatus } from '@prisma/client';
import type { BloodType as SharedBloodType } from '@sauvi/shared';
import { BloodCompatibilityService } from '../eligibility/blood-compatibility.service';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from './fcm.service';

const USER_NOTIFICATION_SELECT = {
  id: true,
  fcmToken: true,
} satisfies Prisma.UserSelect;

const PRISMA_TO_SHARED_BLOOD_TYPE: Record<BloodType, SharedBloodType> = {
  O_NEG: 'O-',
  O_POS: 'O+',
  A_NEG: 'A-',
  A_POS: 'A+',
  B_NEG: 'B-',
  B_POS: 'B+',
  AB_NEG: 'AB-',
  AB_POS: 'AB+',
};

const SHARED_TO_PRISMA_BLOOD_TYPE: Record<SharedBloodType, BloodType> = {
  'O-': BloodType.O_NEG,
  'O+': BloodType.O_POS,
  'A-': BloodType.A_NEG,
  'A+': BloodType.A_POS,
  'B-': BloodType.B_NEG,
  'B+': BloodType.B_POS,
  'AB-': BloodType.AB_NEG,
  'AB+': BloodType.AB_POS,
};

export interface SosNotificationTarget {
  id: string;
  fcmToken: string | null;
}

export interface SosNotificationInput {
  id: string;
  requesterId: string;
  bloodTypeNeeded: BloodType;
  unitsNeeded: number;
  hospitalName: string;
  city: string;
}

/**
 * Orchestre les notifications SOS: push FCM aux donneurs eligibles, in-app aux autres.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bloodCompatibilityService: BloodCompatibilityService,
    private readonly fcmService: FcmService,
  ) {}

  async findEligibleDonors(sos: SosNotificationInput): Promise<SosNotificationTarget[]> {
    const sharedBloodType = PRISMA_TO_SHARED_BLOOD_TYPE[sos.bloodTypeNeeded];
    const compatibleTypes = this.bloodCompatibilityService
      .getCompatibleTypes(sharedBloodType)
      .map((bloodType) => SHARED_TO_PRISMA_BLOOD_TYPE[bloodType]);

    const now = new Date();
    return this.prisma.user.findMany({
      where: {
        id: { not: sos.requesterId },
        city: sos.city,
        OR: [{ isEligible: true }, { nextEligibleDate: { lte: now } }],
        bloodType: { in: compatibleTypes },
        fcmToken: { not: null },
      },
      select: USER_NOTIFICATION_SELECT,
    });
  }

  async findNonMatchingUsers(sos: SosNotificationInput): Promise<SosNotificationTarget[]> {
    const eligibleDonors = await this.findEligibleDonors(sos);
    const eligibleDonorIds = eligibleDonors.map((donor) => donor.id);

    return this.prisma.user.findMany({
      where: {
        id: {
          notIn: [sos.requesterId, ...eligibleDonorIds],
        },
        city: sos.city,
      },
      select: USER_NOTIFICATION_SELECT,
    });
  }

  async notifySosCreated(sos: SosNotificationInput): Promise<{
    data: { pushRecipients: number; inAppRecipients: number };
  }> {
    const eligibleDonors = await this.findEligibleDonors(sos);
    const tokens = eligibleDonors
      .map((donor) => donor.fcmToken)
      .filter((token): token is string => token !== null);

    const fcmResult = await this.fcmService.sendToMany(tokens, {
      title: 'SOS don de sang',
      body: `${sos.unitsNeeded} poche(s) de sang ${PRISMA_TO_SHARED_BLOOD_TYPE[sos.bloodTypeNeeded]} recherchées à ${sos.hospitalName} (${sos.city})`,
      data: {
        type: 'sos_created',
        sosId: sos.id,
      },
    });

    // Purger automatiquement les tokens FCM périmés de la BDD
    if (fcmResult?.staleTokens && fcmResult.staleTokens.length > 0) {
      await this.prisma.user.updateMany({
        where: { fcmToken: { in: fcmResult.staleTokens } },
        data: { fcmToken: null },
      });
    }

    if (eligibleDonors.length > 0) {
      await this.prisma.inAppNotification.createMany({
        data: eligibleDonors.map((donor) => ({
          userId: donor.id,
          sosId: sos.id,
          type: NotificationType.sos_match,
          title: '🚨 SOS don de sang compatible',
          body: `${sos.unitsNeeded} poche(s) de sang ${PRISMA_TO_SHARED_BLOOD_TYPE[sos.bloodTypeNeeded]} recherchées à ${sos.hospitalName} (${sos.city})`,
          shareUrl: `sauvi://sos/${sos.id}`,
        })),
      });
    }

    const nonMatchingUsers = await this.findNonMatchingUsers(sos);

    if (nonMatchingUsers.length > 0) {
      const sharedBloodType = PRISMA_TO_SHARED_BLOOD_TYPE[sos.bloodTypeNeeded];
      const shareBody = `🚨 URGENCE SAUVI : Besoin urgent de don de sang ${sharedBloodType} (${sos.unitsNeeded} unité(s)) à ${sos.hospitalName} — ${sos.city}.`;

      await this.prisma.inAppNotification.createMany({
        data: nonMatchingUsers.map((user) => ({
          userId: user.id,
          sosId: sos.id,
          type: NotificationType.sos_share,
          title: '🚨 Relayer un SOS urgent',
          body: shareBody,
          shareUrl: `sauvi://sos/${sos.id}`,
        })),
      });
    }

    return {
      data: {
        pushRecipients: tokens.length,
        inAppRecipients: nonMatchingUsers.length,
      },
    };
  }

  async getForUser(userId: string): Promise<{
    data: {
      id: string;
      type: string;
      title: string;
      body: string;
      shareUrl: string | null;
      sosId: string | null;
      readAt: Date | null;
      createdAt: Date;
    }[];
  }> {
    const notifications = await this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        shareUrl: true,
        sosId: true,
        readAt: true,
        createdAt: true,
      },
    });
    return { data: notifications };
  }

  async markAllRead(userId: string): Promise<{ data: { count: number } }> {
    const result = await this.prisma.inAppNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { data: { count: result.count } };
  }

  async markOneRead(userId: string, notificationId: string): Promise<{ data: { id: string } }> {
    const notification = await this.prisma.inAppNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      return { data: { id: notificationId } };
    }
    await this.prisma.inAppNotification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return { data: { id: notificationId } };
  }

  async notifySosExpired(sos: {
    id: string;
    requesterId: string;
    hospitalName: string;
    city: string;
  }): Promise<void> {
    await this.prisma.inAppNotification.create({
      data: {
        userId: sos.requesterId,
        sosId: sos.id,
        type: NotificationType.sos_expired,
        title: 'Demande de don de sang expirée',
        body: `Votre alerte SOS à ${sos.hospitalName} (${sos.city}) a atteint sa date d'échéance et a été clôturée automatiquement.`,
      },
    });

    const requester = await this.prisma.user.findUnique({
      where: { id: sos.requesterId },
      select: { fcmToken: true },
    });

    if (requester?.fcmToken) {
      await this.fcmService.sendToDevice(requester.fcmToken, {
        title: 'Demande de don de sang expirée',
        body: `Votre alerte SOS à ${sos.hospitalName} a expiré. Vous pouvez la relancer si nécessaire.`,
        data: { type: 'sos_expired', sosId: sos.id },
      });
    }

    // Notifier avec bienveillance tous les donneurs inscrits en file d'attente (waiting ou validated)
    try {
      const waitlistEntries = await this.prisma.donorWaitlist.findMany({
        where: {
          sosId: sos.id,
          status: { in: [WaitlistStatus.waiting, WaitlistStatus.validated] },
        },
        include: {
          donor: { select: { id: true, fcmToken: true } },
        },
      });

      for (const entry of waitlistEntries) {
        await this.prisma.inAppNotification.create({
          data: {
            userId: entry.donor.id,
            sosId: sos.id,
            type: NotificationType.sos_expired,
            title: 'Demande de don de sang expirée',
            body: `L'alerte SOS à ${sos.hospitalName} (${sos.city}) a atteint son échéance. Merci infiniment pour votre élan de solidarité et votre disponibilité ! Vos points d'engagement sont conservés.`,
          },
        });
      }

      // Envoi du push FCM aux donneurs inscrits pour leur éviter un déplacement inutile
      const donorTokens = waitlistEntries
        .map((entry) => entry.donor.fcmToken)
        .filter((token): token is string => token !== null && token.trim().length > 0);

      if (donorTokens.length > 0) {
        await this.fcmService.sendToMany(donorTokens, {
          title: 'Demande de don de sang expirée',
          body: `L'alerte SOS à ${sos.hospitalName} (${sos.city}) a atteint son échéance. Merci pour votre disponibilité !`,
          channelId: 'sauvi-sos-channel',
          data: { type: 'sos_expired', sosId: sos.id },
        });
      }
    } catch (error) {
      console.error('Erreur notification donneurs sos_expired:', error);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { BadgeType, NotificationType } from '@prisma/client';
import { FcmService } from '../notifications/fcm.service';
import { PrismaService } from '../prisma/prisma.service';

export enum ReputationAction {
  JOINED_WAITLIST = 'JOINED_WAITLIST',
  DONATED = 'DONATED',
  DONATED_URGENCY = 'DONATED_URGENCY',
  DONATED_O_NEG = 'DONATED_O_NEG',
}

const ACTION_POINTS: Record<ReputationAction, number> = {
  [ReputationAction.JOINED_WAITLIST]: 5,
  [ReputationAction.DONATED]: 50,
  [ReputationAction.DONATED_URGENCY]: 75,
  [ReputationAction.DONATED_O_NEG]: 100,
};

const BADGE_THRESHOLDS = {
  [BadgeType.bronze]: 50,
  [BadgeType.argent]: 250,
  [BadgeType.or]: 600,
  [BadgeType.diamant]: 1200,
  [BadgeType.legende]: 2000,
};

const BADGE_LABELS: Record<BadgeType, string> = {
  [BadgeType.bronze]: 'Cœur de Bronze 🥉',
  [BadgeType.argent]: "Héros d'Argent 🥈",
  [BadgeType.or]: "Sauveur d'Or 🥇",
  [BadgeType.diamant]: 'Gardien de Diamant 💎',
  [BadgeType.legende]: 'Légende SAUVI 👑',
};

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * Ajoute des points de réputation à un utilisateur et vérifie le déblocage de badges.
   */
  async addPoints(userId: string, action: ReputationAction): Promise<void> {
    const pointsToAdd = ACTION_POINTS[action];

    // Transaction pour assurer l'atomicité
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        reputationPoints: {
          increment: pointsToAdd,
        },
      },
      select: { id: true, reputationPoints: true },
    });

    this.logger.log(`+${pointsToAdd} points attribués à ${userId} pour ${action}`);

    await this.checkBadgeUnlock(updatedUser.id, updatedUser.reputationPoints);
  }

  /**
   * Retire des points de réputation à un utilisateur (ex: annulation de participation).
   * Le solde ne peut pas descendre en dessous de 0.
   */
  async deductPoints(userId: string, points: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { reputationPoints: true },
    });
    if (!user) return;

    const newPoints = Math.max(0, user.reputationPoints - points);
    await this.prisma.user.update({
      where: { id: userId },
      data: { reputationPoints: newPoints },
    });
    this.logger.log(`-${points} points retirés à ${userId} (nouveau solde: ${newPoints})`);
  }

  /**
   * Vérifie si l'utilisateur a atteint un palier pour débloquer un badge.
   */
  private async checkBadgeUnlock(userId: string, currentPoints: number): Promise<void> {
    const earnedBadges = await this.prisma.badge.findMany({
      where: { userId },
      select: { type: true },
    });

    const earnedTypes = earnedBadges.map((b) => b.type);

    for (const [badgeType, threshold] of Object.entries(BADGE_THRESHOLDS) as [
      BadgeType,
      number,
    ][]) {
      if (currentPoints >= threshold && !earnedTypes.includes(badgeType)) {
        await this.prisma.badge.create({
          data: {
            userId,
            type: badgeType,
          },
        });
        const badgeLabel = BADGE_LABELS[badgeType] || badgeType;
        this.logger.log(`Badge ${badgeType} (${badgeLabel}) débloqué pour l'utilisateur ${userId}`);

        // 1. Notification dans la cloche In-App
        await this.prisma.inAppNotification.create({
          data: {
            userId,
            type: NotificationType.badge_unlocked,
            title: '🎖️ Nouveau badge débloqué !',
            body: `Félicitations ! Vous avez obtenu le badge ${badgeLabel}. Vos dons et vos actes de solidarité sauvent des vies.`,
          },
        });

        // 2. Notification Push FCM sur le canal système
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { fcmToken: true },
        });

        if (user?.fcmToken) {
          await this.fcmService.sendToDevice(user.fcmToken, {
            title: '🎖️ Nouveau badge débloqué !',
            body: `Félicitations ! Vous avez obtenu le badge ${badgeLabel}.`,
            channelId: 'sauvi-system-channel',
            data: {
              type: 'badge_unlocked',
              badge: badgeType,
            },
          });
        }
      }
    }
  }
}

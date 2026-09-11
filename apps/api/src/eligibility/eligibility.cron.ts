import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { FcmService } from '../notifications/fcm.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EligibilityCron {
  private readonly logger = new Logger(EligibilityCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * 1. RÉACTIVATION SILENCIEUSE EN BASE (Minuit 00h01)
   * Passe isEligible = true pour tous les donneurs dont nextEligibleDate <= aujourd'hui.
   * ZÉRO notification push envoyée à cette heure-là pour préserver le sommeil des donneurs.
   * Ainsi, si une urgence SOS vitale survient à 05h ou 06h du matin, le donneur est prêt et réactif !
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async reactivateEligibilityAtMidnight() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.log(`[Cron Minuit] Réactivation médicale silencieuse — ${today.toISOString()}`);

    const reactivatedUsers = await this.prisma.user.findMany({
      where: {
        isEligible: false,
        nextEligibleDate: { lte: today },
      },
      select: { id: true },
    });

    if (reactivatedUsers.length === 0) {
      this.logger.log('[Cron Minuit] Aucun utilisateur à réactiver.');
      return;
    }

    await this.prisma.user.updateMany({
      where: {
        id: { in: reactivatedUsers.map((u) => u.id) },
      },
      data: { isEligible: true },
    });

    this.logger.log(`[Cron Minuit] ${reactivatedUsers.length} donneur(s) réactivé(s) en base.`);
  }

  /**
   * 2. NOTIFICATION COURTOISE DU MATIN (09h00)
   * Envoie le push de bienveillance à une heure respectueuse du sommeil
   * aux donneurs devenus éligibles aujourd'hui.
   */
  @Cron('0 9 * * *')
  async sendEligibilityMorningNotifications() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.log(`[Cron 09h00] Envoi des notifications d'éligibilité du matin.`);

    // Trouve les donneurs dont la période de repos s'est achevée
    const eligibleDonors = await this.prisma.user.findMany({
      where: {
        isEligible: true,
        nextEligibleDate: { not: null, lte: today },
      },
      select: { id: true, name: true, fcmToken: true },
    });

    if (eligibleDonors.length === 0) {
      this.logger.log('[Cron 09h00] Aucun donneur à notifier ce matin.');
      return;
    }

    const donorIds = eligibleDonors.map((u) => u.id);

    // Envoi des push FCM pour ceux qui ont un token
    const fcmDonors = eligibleDonors.filter((u) => u.fcmToken);
    const notifications = fcmDonors.map((u) =>
      this.fcmService.sendToDevice(u.fcmToken as string, {
        title: '🩸 Vous êtes à nouveau éligible !',
        body: 'Votre période de repos est terminée. Vous pouvez à nouveau répondre aux SOS.',
        data: { type: 'eligibility_restored' },
      }),
    );

    if (notifications.length > 0) {
      await Promise.allSettled(notifications);
    }

    // Enregistrement dans la cloche des notifications in-app pour tous les donneurs réactivés
    await this.prisma.inAppNotification.createMany({
      data: eligibleDonors.map((u) => ({
        userId: u.id,
        type: NotificationType.eligibility_restored,
        title: '🩸 Vous êtes à nouveau éligible !',
        body: 'Votre période de repos est terminée. Vous pouvez à nouveau répondre aux alertes SOS.',
      })),
    });

    // Remettre nextEligibleDate à null pour éviter que la Cron ne les re-notifie chaque matin
    await this.prisma.user.updateMany({
      where: { id: { in: donorIds } },
      data: { nextEligibleDate: null },
    });

    this.logger.log(
      `[Cron 09h00] ${eligibleDonors.length} donneur(s) notifié(s) (Push FCM: ${notifications.length}, In-App: ${eligibleDonors.length}).`,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { COOLDOWN_DAYS } from '@sauvi/shared';
import type { Gender } from '@sauvi/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service d'éligibilité — calcule la prochaine date de don de sang total.
 * Délais de carence : homme = 56 jours, femme = 84 jours.
 * Ce service est pur (pas de dépendance DB) et doit avoir 100% de couverture test.
 */
@Injectable()
export class EligibilityService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Calcule la prochaine date à laquelle le donneur sera éligible.
   * @param gender - Genre du donneur ('masculin' | 'feminin')
   * @param lastDonationDate - Date du dernier don (null si jamais donné)
   * @returns La prochaine date d'éligibilité, ou null si jamais donné (donc éligible)
   */
  calculateNextEligibleDate(gender: Gender, lastDonationDate: Date | null): Date | null {
    if (!lastDonationDate) {
      return null;
    }

    const cooldownDays = COOLDOWN_DAYS[gender];
    if (cooldownDays === undefined) {
      return null;
    }

    const nextDate = new Date(lastDonationDate.getTime());
    nextDate.setDate(nextDate.getDate() + cooldownDays);
    return nextDate;
  }

  /**
   * Vérifie si le donneur est actuellement éligible au don de sang.
   * @param nextEligibleDate - La prochaine date d'éligibilité (null = toujours éligible)
   * @returns true si le donneur peut donner aujourd'hui
   */
  isCurrentlyEligible(nextEligibleDate: Date | null): boolean {
    if (!nextEligibleDate) {
      return true;
    }

    const now = new Date();
    // Comparer uniquement les dates (pas les heures)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eligibleDate = new Date(
      nextEligibleDate.getFullYear(),
      nextEligibleDate.getMonth(),
      nextEligibleDate.getDate(),
    );

    return today >= eligibleDate;
  }

  /**
   * Calcule le nombre de jours restants avant l'éligibilité.
   * @returns 0 si déjà éligible, sinon le nombre de jours restants
   */
  getDaysRemaining(nextEligibleDate: Date | null): number {
    if (!nextEligibleDate) {
      return 0;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eligibleDate = new Date(
      nextEligibleDate.getFullYear(),
      nextEligibleDate.getMonth(),
      nextEligibleDate.getDate(),
    );

    const diffMs = eligibleDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Met à jour l'éligibilité d'un donneur suite à un don confirmé.
   */
  async updateDonorEligibility(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { gender: true },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const lastDonationDate = new Date();
    const nextEligibleDate = this.calculateNextEligibleDate(
      user.gender as Gender,
      lastDonationDate,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastDonationDate,
        nextEligibleDate,
        isEligible: false,
      },
    });
  }
}

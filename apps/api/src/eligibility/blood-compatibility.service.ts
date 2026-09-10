import { Injectable } from '@nestjs/common';
import type { BloodType } from '@sauvi/shared';

export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['O-', 'B-', 'A-', 'AB-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'A-': ['O-', 'A-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'B-': ['O-', 'B-'],
  'O+': ['O-', 'O+'],
  'O-': ['O-'],
};

/**
 * Service pur de compatibilite ABO/Rhesus pour determiner les donneurs compatibles.
 */
@Injectable()
export class BloodCompatibilityService {
  /**
   * Retourne les groupes sanguins donneurs compatibles avec le groupe demande.
   */
  getCompatibleTypes(bloodTypeNeeded: BloodType): BloodType[] {
    return [...BLOOD_COMPATIBILITY[bloodTypeNeeded]];
  }
}

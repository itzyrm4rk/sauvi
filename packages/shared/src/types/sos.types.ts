import type { BloodType } from './user.types';

export type Priority = 'preventif' | 'urgence_vitale';

export type SosStatus = 'active' | 'closed' | 'fulfilled' | 'expired';

export interface ISosAlert {
  id: string;
  requesterId: string;
  bloodTypeNeeded: BloodType;
  unitsNeeded: number;
  priority: Priority;
  hospitalName: string;
  hospitalAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  status: SosStatus;
  expiresAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

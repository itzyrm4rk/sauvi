import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BloodType,
  NotificationType,
  type Prisma,
  SosStatus,
  WaitlistStatus,
} from '@prisma/client';
import type { BloodType as SharedBloodType } from '@sauvi/shared';
import type { Cache } from 'cache-manager';
import { DonorsGateway } from '../donors/donors.gateway';
import { BloodCompatibilityService } from '../eligibility/blood-compatibility.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateSosDto } from './dto/create-sos.dto';

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:full'?: string;
    'addr:city'?: string;
  };
}

export interface BackendHospital {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
}

const SOS_SELECT = {
  id: true,
  requesterId: true,
  bloodTypeNeeded: true,
  unitsNeeded: true,
  priority: true,
  hospitalName: true,
  hospitalAddress: true,
  latitude: true,
  longitude: true,
  city: true,
  status: true,
  expiresAt: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  requester: {
    select: {
      name: true,
      phone: true,
    },
  },
} satisfies Prisma.SosAlertSelect;

const BLOOD_TYPE_TO_PRISMA: Record<SharedBloodType, BloodType> = {
  'O-': BloodType.O_NEG,
  'O+': BloodType.O_POS,
  'A-': BloodType.A_NEG,
  'A+': BloodType.A_POS,
  'B-': BloodType.B_NEG,
  'B+': BloodType.B_POS,
  'AB-': BloodType.AB_NEG,
  'AB+': BloodType.AB_POS,
};

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class SosService {
  private readonly logger = new Logger(SosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly bloodCompatibilityService: BloodCompatibilityService,
    private readonly donorsGateway: DonorsGateway,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async estimateDonors(
    bloodTypeNeeded: SharedBloodType,
    city: string,
  ): Promise<{ data: { estimatedDonors: number } }> {
    const compatibleTypes = this.bloodCompatibilityService.getCompatibleTypes(bloodTypeNeeded);
    const compatiblePrismaTypes = compatibleTypes.map((type) => BLOOD_TYPE_TO_PRISMA[type]);

    const count = await this.prisma.user.count({
      where: {
        city,
        isEligible: true,
        bloodType: {
          in: compatiblePrismaTypes,
        },
      },
    });

    return { data: { estimatedDonors: count } };
  }

  /**
   * Cree un SOS si l'utilisateur n'a pas deja une alerte active.
   */
  async create(
    userId: string,
    dto: CreateSosDto,
  ): Promise<{ data: Prisma.SosAlertGetPayload<{ select: typeof SOS_SELECT }> }> {
    const activeSos = await this.prisma.sosAlert.findFirst({
      where: { requesterId: userId, status: SosStatus.active },
      select: { id: true },
    });

    if (activeSos) {
      throw new ConflictException('Un SOS actif existe deja pour cet utilisateur');
    }

    const expiresAt =
      dto.priority === 'urgence_vitale'
        ? new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 heures pour urgence vitale
        : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 jours pour préventif

    const sos = await this.prisma.sosAlert.create({
      data: {
        requesterId: userId,
        bloodTypeNeeded: BLOOD_TYPE_TO_PRISMA[dto.bloodTypeNeeded],
        unitsNeeded: dto.unitsNeeded,
        priority: dto.priority,
        hospitalName: dto.hospitalName,
        hospitalAddress: dto.hospitalAddress,
        latitude: dto.latitude,
        longitude: dto.longitude,
        city: dto.city,
        expiresAt,
      },
      select: SOS_SELECT,
    });

    await this.notificationsService.notifySosCreated(sos);

    return { data: sos };
  }

  async getActiveForUser(
    userId: string,
  ): Promise<{ data: Prisma.SosAlertGetPayload<{ select: typeof SOS_SELECT }> | null }> {
    const sos = await this.prisma.sosAlert.findFirst({
      where: { requesterId: userId, status: SosStatus.active },
      orderBy: { createdAt: 'desc' },
      select: SOS_SELECT,
    });

    return { data: sos };
  }

  async getById(id: string): Promise<{
    data: Prisma.SosAlertGetPayload<{ select: typeof SOS_SELECT }> & { waitlistCount: number };
  }> {
    const sos = await this.prisma.sosAlert.findUnique({
      where: { id },
      select: SOS_SELECT,
    });

    if (!sos) {
      throw new NotFoundException('SOS introuvable');
    }

    const waitlistCount = await this.prisma.donorWaitlist.count({
      where: {
        sosId: id,
        status: { in: [WaitlistStatus.waiting, WaitlistStatus.validated] },
      },
    });

    return { data: { ...sos, waitlistCount } };
  }

  async close(
    userId: string,
    id: string,
  ): Promise<{ data: Prisma.SosAlertGetPayload<{ select: typeof SOS_SELECT }> }> {
    const sos = await this.prisma.sosAlert.findUnique({
      where: { id },
      select: { id: true, requesterId: true, status: true },
    });

    if (!sos) {
      throw new NotFoundException('SOS introuvable');
    }

    if (sos.requesterId !== userId) {
      throw new ForbiddenException('Vous ne pouvez cloturer que vos propres SOS');
    }

    const closedSos = await this.prisma.sosAlert.update({
      where: { id },
      data: {
        status: SosStatus.closed,
        closedAt: new Date(),
      },
      select: SOS_SELECT,
    });

    // Notification WebSocket broadcast temps réel
    this.donorsGateway.emitSosClosed(id);

    // Notifier dans la cloche (In-App uniquement) tous les donneurs inscrits en file d'attente
    try {
      const waitlistEntries = await this.prisma.donorWaitlist.findMany({
        where: {
          sosId: id,
          status: { in: [WaitlistStatus.waiting, WaitlistStatus.validated] },
        },
        select: { donorId: true },
      });

      if (waitlistEntries.length > 0) {
        await this.prisma.inAppNotification.createMany({
          data: waitlistEntries.map((entry) => ({
            userId: entry.donorId,
            sosId: id,
            type: NotificationType.sos_expired,
            title: 'Alerte SOS clôturée',
            body: `L'alerte SOS à ${closedSos.hospitalName} (${closedSos.city}) a été clôturée par le demandeur. Merci infiniment pour votre mobilisation et votre disponibilité solidaire !`,
          })),
        });
      }
    } catch (error) {
      this.logger.error('Erreur notification in-app donneurs sos:closed:', error);
    }

    return { data: closedSos };
  }

  /**
   * Tâche Cron exécutée toutes les 30 minutes pour détecter et expirer les SOS échus.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleExpiredSos(): Promise<void> {
    const now = new Date();
    const expiredAlerts = await this.prisma.sosAlert.findMany({
      where: {
        status: SosStatus.active,
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        requesterId: true,
        hospitalName: true,
        city: true,
      },
    });

    if (expiredAlerts.length === 0) return;

    this.logger.log(`Traitement automatique de ${expiredAlerts.length} SOS expiré(s)...`);

    for (const sos of expiredAlerts) {
      await this.prisma.sosAlert.update({
        where: { id: sos.id },
        data: { status: SosStatus.expired },
      });

      await this.notificationsService.notifySosExpired(sos);
      this.donorsGateway.emitSosExpired(sos.id);
    }
  }

  async getNearby(
    city?: string,
    bloodType?: BloodType,
    _excludeUserId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Prisma.SosAlertGetPayload<{ select: typeof SOS_SELECT }>[]; total: number }> {
    const now = new Date();
    const where: Prisma.SosAlertWhereInput = {
      status: SosStatus.active,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(city ? { city } : {}),
      ...(bloodType ? { bloodTypeNeeded: bloodType } : {}),
    };

    const [sosAlerts, total] = await Promise.all([
      this.prisma.sosAlert.findMany({
        where,
        // urgence_vitale first, then by createdAt descending
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        select: SOS_SELECT,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sosAlert.count({ where }),
    ]);

    return { data: sosAlerts, total };
  }

  async getMine(
    userId: string,
  ): Promise<{ data: Prisma.SosAlertGetPayload<{ select: typeof SOS_SELECT }>[] }> {
    const sosAlerts = await this.prisma.sosAlert.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      select: SOS_SELECT,
    });

    return { data: sosAlerts };
  }
  async getNearbyHospitals(lat: number, lon: number): Promise<{ data: BackendHospital[] }> {
    // Geohash simple : on arrondit à 2 décimales (grille d'environ 1.1km x 1.1km)
    const roundedLat = lat.toFixed(2);
    const roundedLon = lon.toFixed(2);
    const cacheKey = `hospitals:zone:${roundedLat}:${roundedLon}`;

    let hospitals: OverpassElement[] = [];
    const cached = await this.cacheManager.get<OverpassElement[]>(cacheKey);

    if (cached) {
      hospitals = cached;
    } else {
      const radius = 5000;
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
          way["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
          relation["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
          node["amenity"="clinic"](around:${radius}, ${lat}, ${lon});
          way["amenity"="clinic"](around:${radius}, ${lat}, ${lon});
          relation["amenity"="clinic"](around:${radius}, ${lat}, ${lon});
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });

      if (!response.ok) {
        throw new Error('Erreur API Overpass');
      }

      const data = (await response.json()) as { elements: OverpassElement[] };
      hospitals = data.elements || [];

      // Mettre en cache pour 24h
      await this.cacheManager.set(cacheKey, hospitals, 86400000);
    }

    // Calcul de distance précise (Haversine) et tri
    const results = hospitals
      .map((el) => {
        const hLat = el.lat || el.center?.lat || 0;
        const hLon = el.lon || el.center?.lon || 0;
        const name = el.tags?.name || 'Hôpital inconnu';
        const address = el.tags?.['addr:street'] || el.tags?.['addr:full'] || 'Adresse inconnue';
        const city = el.tags?.['addr:city'] || '';

        let distance = 9999;
        if (hLat && hLon) {
          distance = getDistanceInKm(lat, lon, hLat, hLon);
        }

        return {
          name,
          address,
          city,
          latitude: hLat,
          longitude: hLon,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    return { data: results };
  }
}

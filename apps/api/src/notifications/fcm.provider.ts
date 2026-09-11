import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import type { Env } from '../config/env.validation';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

const logger = new Logger('FirebaseAdminProvider');

export const fcmProvider = {
  provide: FIREBASE_ADMIN,
  useFactory: (configService: ConfigService<Env, true>) => {
    try {
      const projectId = configService.get('FIREBASE_PROJECT_ID', { infer: true });
      const clientEmail = configService.get('FIREBASE_CLIENT_EMAIL', { infer: true });
      const privateKey = configService
        .get('FIREBASE_PRIVATE_KEY', { infer: true })
        .replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        logger.warn('Firebase credentials manquantes. Les notifications push seront désactivées.');
        return null;
      }

      if (admin.apps.length === 0) {
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      return admin.app();
    } catch (error) {
      logger.warn(
        `Impossible d'initialiser Firebase Admin: ${(error as Error).message}. Les notifications push seront désactivées.`,
      );
      return null;
    }
  },
  inject: [ConfigService],
};

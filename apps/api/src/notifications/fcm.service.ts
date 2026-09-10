import { Inject, Injectable, Logger } from '@nestjs/common';
import type admin from 'firebase-admin';
import { FIREBASE_ADMIN } from './fcm.provider';

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  /** Tokens FCM invalides/périmés à supprimer de la base de données */
  staleTokens: string[];
}

/** Codes d'erreur FCM indiquant un token définitivement invalide (à purger de la BDD) */
const STALE_TOKEN_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * Service FCM en mode token direct uniquement. Aucun topic FCM n'est utilise.
 * Si Firebase Admin n'est pas configuré (credentials manquantes), les méthodes
 * logguent un warning et retournent un résultat vide sans crasher.
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App | null) {}

  private resolveChannelId(payload: FcmPayload): string {
    if (payload.channelId) {
      return payload.channelId;
    }
    const type = payload.data?.type;
    if (type === 'chat_message') {
      return 'sauvi-chat-channel';
    }
    if (type === 'eligibility_restored' || type === 'badge_unlocked') {
      return 'sauvi-system-channel';
    }
    return 'sauvi-sos-channel';
  }

  async sendToDevice(token: string, payload: FcmPayload): Promise<FcmSendResult> {
    if (!this.firebaseAdmin) {
      this.logger.warn('Firebase Admin non configuré — push ignoré');
      return { successCount: 0, failureCount: 0, staleTokens: [] };
    }

    if (!token.trim()) {
      return { successCount: 0, failureCount: 1, staleTokens: [] };
    }

    const channelId = this.resolveChannelId(payload);

    try {
      const response = await this.firebaseAdmin.messaging().send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        android: {
          priority: 'high',
          notification: {
            channelId,
            sound: 'default',
            defaultVibrateTimings: true,
          },
        },
        ...(payload.data ? { data: payload.data } : {}),
      });
      this.logger.log(`Push FCM direct token envoye: ${payload.title} (${response})`);
      return { successCount: 1, failureCount: 0, staleTokens: [] };
    } catch (error) {
      const err = error as { errorInfo?: { code?: string } };
      const isStale = err.errorInfo?.code ? STALE_TOKEN_ERROR_CODES.has(err.errorInfo.code) : false;
      if (isStale) {
        this.logger.warn(
          `Token FCM périmé détecté (direct), suppression à effectuer: ${token.substring(0, 15)}...`,
        );
      }
      this.logger.error(`Erreur envoi FCM: ${(error as Error).message}`);
      return { successCount: 0, failureCount: 1, staleTokens: isStale ? [token] : [] };
    }
  }

  async sendToMany(tokens: string[], payload: FcmPayload): Promise<FcmSendResult> {
    if (!this.firebaseAdmin) {
      this.logger.warn('Firebase Admin non configuré — push multicast ignoré');
      return { successCount: 0, failureCount: 0, staleTokens: [] };
    }

    const uniqueTokens = [...new Set(tokens.filter((token) => token.trim().length > 0))];

    if (uniqueTokens.length === 0) {
      return { successCount: 0, failureCount: 0, staleTokens: [] };
    }

    const channelId = this.resolveChannelId(payload);

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: uniqueTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        android: {
          priority: 'high',
          notification: {
            channelId,
            sound: 'default',
            defaultVibrateTimings: true,
          },
        },
        ...(payload.data ? { data: payload.data } : {}),
      };

      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Push FCM multicast envoye: ${response.successCount} succes, ${response.failureCount} echecs`,
      );

      const staleTokens: string[] = [];

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const tokenPreview = `${uniqueTokens[idx]?.substring(0, 15)}...`;
            const errorCode = resp.error?.code ?? '';
            this.logger.warn(
              `Echec envoi push pour token [${tokenPreview}]: ${errorCode || resp.error?.message}`,
            );
            // Collecter les tokens définitivement invalides pour nettoyage BDD
            if (STALE_TOKEN_ERROR_CODES.has(errorCode) && uniqueTokens[idx]) {
              staleTokens.push(uniqueTokens[idx] as string);
            }
          }
        });

        if (staleTokens.length > 0) {
          this.logger.warn(
            `${staleTokens.length} token(s) FCM périmé(s) à supprimer de la BDD (registration-token-not-registered)`,
          );
        }
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        staleTokens,
      };
    } catch (error) {
      this.logger.error(`Erreur envoi FCM multicast: ${(error as Error).message}`);
      return { successCount: 0, failureCount: uniqueTokens.length, staleTokens: [] };
    }
  }
}

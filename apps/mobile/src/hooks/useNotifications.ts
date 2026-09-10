import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Toast } from '../components/ui/toastConfig';
import { navigateFromNotification } from '../navigation/navigationRef';
import type { RootState } from '../store';
import { notificationsApi } from '../store/api/notificationsApi';
import { useUpdateFcmTokenMutation } from '../store/api/usersApi';
import { getPushNotificationsEnabled } from '../utils/notificationPreferences';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ForegroundNotificationState {
  title: string;
  body: string;
}

export function useNotifications(): ForegroundNotificationState | null {
  const [updateFcmToken] = useUpdateFcmTokenMutation();
  const dispatch = useDispatch();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotificationState | null>(null);

  useEffect(() => {
    let mounted = true;

    async function registerDeviceToken(): Promise<void> {
      // Respect absolu du choix de l'utilisateur : si le toggle a été désactivé, on ne synchronise aucun token
      const isPushAllowed = await getPushNotificationsEnabled();
      if (!isPushAllowed) {
        return;
      }

      const existingPermission = await Notifications.getPermissionsAsync();
      const finalPermission = existingPermission.granted
        ? existingPermission
        : await Notifications.requestPermissionsAsync();

      if (!finalPermission.granted) {
        return;
      }

      if (Platform.OS === 'android') {
        // Canal 1 — Alertes SOS urgentes (importance MAX, vibration forte)
        await Notifications.setNotificationChannelAsync('sauvi-sos-channel', {
          name: 'Alertes SOS Urgentes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 200, 500, 200, 1000],
          lightColor: '#E24B4A',
          enableVibrate: true,
          sound: 'default',
        });

        // Canal 2 — Discussions & Messages (importance HIGH, vibration discrète)
        await Notifications.setNotificationChannelAsync('sauvi-chat-channel', {
          name: 'Discussions & Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 150, 100, 150],
          lightColor: '#7C3AED',
          enableVibrate: true,
          sound: 'default',
        });

        // Canal 3 — Système : badges, carence (importance DEFAULT, sans vibration lourde)
        await Notifications.setNotificationChannelAsync('sauvi-system-channel', {
          name: 'Compte & Récompenses',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 100],
          lightColor: '#F59E0B',
          enableVibrate: true,
          sound: 'default',
        });
      }

      const token = await Notifications.getDevicePushTokenAsync();
      const fcmToken = String(token.data);

      if (mounted && fcmToken.length > 0 && accessToken) {
        await updateFcmToken({ fcmToken }).unwrap();
      }
    }

    registerDeviceToken().catch(() => {
      // L'app reste utilisable sans notifications push.
    });

    // 1. Écoute des notifications arrivant en premier plan (Foreground)
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;

      setForegroundNotification({
        title: content.title ?? 'Nouvelle alerte',
        body: content.body ?? '',
      });

      // Bannière In-App interactive selon le type de notification
      if (data?.type === 'chat_message') {
        Toast.show({
          type: 'chat',
          text1: content.title ?? 'Nouveau message',
          text2: content.body ?? '',
          duration: 4500,
          onPress: () => {
            navigateFromNotification(data);
          },
        });
      } else if (data?.type === 'badge_unlocked') {
        Toast.show({
          type: 'badge',
          text1: content.title ?? '🎖️ Nouveau badge !',
          text2: content.body ?? '',
          duration: 5000,
          onPress: () => {
            navigateFromNotification(data);
          },
        });
      } else {
        Toast.show({
          type: 'info',
          text1: content.title ?? 'Nouvelle alerte',
          text2: content.body ?? '',
          duration: 3500,
          onPress: () => {
            navigateFromNotification(data);
          },
        });
      }

      // Force le rafraîchissement des notifications pour mettre à jour la cloche
      dispatch(notificationsApi.util.invalidateTags(['Notifications']));
    });

    // 2. Écoute du clic sur la notification dans le centre de notifications (App en arrière-plan ou ouverte)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        navigateFromNotification(data);
      },
    );

    // 3. Gestion de l'ouverture à froid (quand l'app était complètement fermée/killée au moment du clic)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && mounted) {
        const data = response.notification.request.content.data;
        navigateFromNotification(data);
      }
    });

    return () => {
      mounted = false;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [dispatch, updateFcmToken, accessToken]);

  return foregroundNotification;
}

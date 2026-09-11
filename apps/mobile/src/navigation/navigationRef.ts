import { createNavigationContainerRef } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';
import type { RootStackParamList } from '../types/navigation.types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Routeur universel déclenché lors du clic sur une notification native.
 */
export function navigateFromNotification(data?: Record<string, unknown> | null): void {
  if (!data || !navigationRef.isReady()) {
    return;
  }

  const { type, sosId } = data as {
    type?: string;
    sosId?: string;
    senderId?: string;
    contactName?: string;
    contactPhone?: string;
  };

  if (type === 'chat_message' && sosId && data.senderId) {
    navigationRef.navigate('Chat', {
      sosId,
      contactId: String(data.senderId),
      contactName: String(data.contactName || 'Contact'),
      ...(data.contactPhone ? { contactPhone: String(data.contactPhone) } : {}),
    });
    return;
  }

  if (sosId && (type === 'donor_validated' || type === 'donation_confirmed')) {
    navigationRef.navigate('DonorWaitlist', { sosId });
    return;
  }

  if (sosId && (type === 'donor_joined' || type === 'donor_cancelled')) {
    navigationRef.navigate('SosDashboard', { sosId });
    return;
  }

  if (sosId && (type === 'sos_created' || type === 'sos_match' || type === 'sos_share')) {
    navigationRef.navigate('SosDetail', { sosId });
    return;
  }

  if (type === 'eligibility_restored') {
    navigationRef.navigate('MainTabs', {
      screen: ROUTES.MAIN.PROFILE,
    });
    return;
  }

  if (type === 'badge_unlocked') {
    navigationRef.navigate('MainTabs', {
      screen: ROUTES.MAIN.PROFILE,
      params: { screen: 'Badges' },
    });
    return;
  }
}

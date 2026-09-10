import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'sauvi_push_notifications_enabled';

/**
 * Lit la préférence persistante de notifications push.
 * Retourne true par défaut si jamais explicitement configurée.
 */
export async function getPushNotificationsEnabled(userId?: string): Promise<boolean> {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const value = await SecureStore.getItemAsync(key);
    if (value === null && userId) {
      // Si la clé spécifique à l'utilisateur n'existe pas encore, vérifie la clé globale
      const globalValue = await SecureStore.getItemAsync(STORAGE_KEY);
      return globalValue !== 'false';
    }
    return value !== 'false';
  } catch {
    return true;
  }
}

/**
 * Enregistre la préférence persistante de notifications push dans le stockage sécurisé.
 */
export async function setPushNotificationsEnabled(
  enabled: boolean,
  userId?: string,
): Promise<void> {
  try {
    const val = enabled ? 'true' : 'false';
    await SecureStore.setItemAsync(STORAGE_KEY, val);
    if (userId) {
      await SecureStore.setItemAsync(`${STORAGE_KEY}_${userId}`, val);
    }
  } catch {
    // Ne pas bloquer l'exécution si SecureStore échoue
  }
}

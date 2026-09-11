import * as SecureStore from 'expo-secure-store';
import type { Storage } from 'redux-persist';

/**
 * Adaptateur redux-persist basé sur Expo SecureStore pour les tokens JWT.
 */
export const secureStorage: Storage = {
  getItem: (key: string): Promise<string | null> => {
    const safeKey = key.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    return SecureStore.getItemAsync(safeKey);
  },
  setItem: (key: string, value: string): Promise<void> => {
    const safeKey = key.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    return SecureStore.setItemAsync(safeKey, value);
  },
  removeItem: (key: string): Promise<void> => {
    const safeKey = key.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    return SecureStore.deleteItemAsync(safeKey);
  },
};

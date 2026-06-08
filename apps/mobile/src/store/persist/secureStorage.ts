import * as SecureStore from 'expo-secure-store';
import type { Storage } from 'redux-persist';

/**
 * Adaptateur redux-persist basé sur Expo SecureStore pour les tokens JWT.
 */
export const secureStorage: Storage = {
  getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};

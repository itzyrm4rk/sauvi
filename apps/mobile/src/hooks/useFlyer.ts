import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type ViewShot from 'react-native-view-shot';
import { Toast } from '../components/ui/toastConfig';

export function useFlyer() {
  const viewShotRef = useRef<ViewShot>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const captureFlyer = useCallback(async (): Promise<string | null> => {
    try {
      setIsCapturing(true);
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref not available');
      }
      const uri = await viewShotRef.current.capture();
      return uri;
    } catch (_error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de capturer le flyer.',
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  /**
   * Partage le flyer via le dialogue natif du téléphone.
   * Sur Android, Share.share() ignore le champ `url` — on utilise donc
   * Sharing.shareAsync() d'expo-sharing qui partage réellement le fichier image.
   */
  const shareFlyer = useCallback(async () => {
    try {
      const flyerUri = await captureFlyer();
      if (!flyerUri) return;

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        // expo-sharing partage le fichier image réel sur Android ET iOS
        await Sharing.shareAsync(flyerUri, {
          mimeType: 'image/png',
          dialogTitle: 'Partager le SOS SAUVI',
          UTI: 'public.png', // iOS uniquement
        });
      } else if (Platform.OS === 'ios') {
        // Fallback iOS natif si expo-sharing indisponible
        const { Share } = await import('react-native');
        await Share.share(
          {
            url: flyerUri,
            message: "Téléchargez l'application SAUVI et sauvez des vies ! 👉 https://sauvi.app",
          },
          { dialogTitle: 'Partager le SOS SAUVI' },
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Partage indisponible',
          text2: "Le partage de fichiers n'est pas disponible sur cet appareil.",
        });
      }
    } catch (_error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de partager le flyer.',
      });
    }
  }, [captureFlyer]);

  return { viewShotRef, captureFlyer, shareFlyer, isCapturing };
}

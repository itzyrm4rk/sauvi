import { Linking, Platform } from 'react-native';
import { Toast } from '../components/ui/toastConfig';

export function useNativeCall() {
  const call = async (phoneNumber: string) => {
    // Nettoyer le numéro pour éviter les erreurs
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    let url = '';

    if (Platform.OS === 'android') {
      url = `tel:${cleanNumber}`;
    } else {
      url = `telprompt:${cleanNumber}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2:
            'Impossible de lancer un appel sur cet appareil (simulateur ou fonctionnalité non supportée).',
        });
      }
    } catch (_error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Une erreur est survenue lors de la tentative d'appel.",
      });
    }
  };

  return { call };
}

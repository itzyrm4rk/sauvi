import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '../../constants/theme';
import { useGetMySosQuery } from '../../store/api/sosApi';
import type { SosStackParamList } from '../../types/navigation.types';

export function SosIndexScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SosStackParamList>>();
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;

  const {
    data: mySosList,
    isSuccess,
    isError,
  } = useGetMySosQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Stocker les valeurs dans des refs pour éviter les stale closures dans le timeout
  const isSuccessRef = useRef(isSuccess);
  const isErrorRef = useRef(isError);
  const mySosListRef = useRef(mySosList);
  isSuccessRef.current = isSuccess;
  isErrorRef.current = isError;
  mySosListRef.current = mySosList;

  // Routage principal : dès que l'API répond avec succès
  useEffect(() => {
    if (!isSuccess) return;
    const activeSos = mySosList?.data?.find((sos) => sos.status === 'active');
    if (activeSos) {
      navigationRef.current.replace('SosDashboard', { sosId: activeSos.id });
    } else {
      navigationRef.current.replace('SosStep1');
    }
  }, [isSuccess, mySosList]);

  // Sécurité : si l'API échoue (hors-ligne, erreur serveur…) → SosStep1
  useEffect(() => {
    if (!isError) return;
    navigationRef.current.replace('SosStep1');
  }, [isError]);

  // Sécurité : timeout de 3s max — s'exécute UNE SEULE FOIS au montage
  // Dépendances vides [] pour ne jamais être annulé/relancé par un re-render
  useEffect(() => {
    const timer = setTimeout(() => {
      // Vérifie l'état courant via les refs (pas de stale closure)
      if (isSuccessRef.current || isErrorRef.current) return;
      const activeSos = mySosListRef.current?.data?.find((sos) => sos.status === 'active');
      if (activeSos) {
        navigationRef.current.replace('SosDashboard', { sosId: activeSos.id });
      } else {
        navigationRef.current.replace('SosStep1');
      }
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size='large' color={colors.primary} />
    </View>
  );
}

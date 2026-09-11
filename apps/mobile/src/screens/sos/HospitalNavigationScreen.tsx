import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { MapPin, MessageSquare, Navigation2, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/toastConfig';
import { colors, spacing, typography } from '../../constants/theme';
import { useNativeCall } from '../../hooks/useNativeCall';
import { useGetMyWaitlistEntryQuery, useGetSosByIdQuery } from '../../store/api/sosApi';
import type { SosStackParamList } from '../../types/navigation.types';

export function HospitalNavigationScreen() {
  const route = useRoute<RouteProp<SosStackParamList, 'HospitalNavigation'>>();
  const navigation = useNavigation<NativeStackNavigationProp<SosStackParamList>>();
  const { sosId } = route.params;

  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const { data: sosResponse, isLoading } = useGetSosByIdQuery({ sosId });
  const sos = sosResponse?.data;

  const { data: entryResp, isLoading: isLoadingEntry } = useGetMyWaitlistEntryQuery({ sosId });
  const myEntry = entryResp?.data;

  useEffect(() => {
    async function checkPermission() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          setHasLocationPermission(true);
        } else {
          const requested = await Location.requestForegroundPermissionsAsync();
          setHasLocationPermission(requested.status === Location.PermissionStatus.GRANTED);
        }
      } catch (_e) {
        setHasLocationPermission(false);
      }
    }
    checkPermission();
  }, []);

  useEffect(() => {
    if (myEntry?.status === 'donated' && sos) {
      // Aligner avec la logique backend (reputation.service.ts)
      let pointsEarned = 50;
      if (sos.bloodTypeNeeded === 'O-') {
        pointsEarned = 100; // DONATED_O_NEG
      } else if (sos.priority === 'urgence_vitale') {
        pointsEarned = 75; // DONATED_URGENCY
      }
      navigation.replace('DonationConfirm', { pointsEarned });
    }
  }, [myEntry?.status, sos, navigation]);

  const { call } = useNativeCall();
  const insets = useSafeAreaInsets();

  if (isLoading || isLoadingEntry || !sos) {
    return (
      <View style={styles.container}>
        <Skeleton height={300} borderRadius={0} />
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton height={24} width='70%' />
          <Skeleton height={16} width='50%' />
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
            <Skeleton height={56} borderRadius={12} style={{ flex: 1 }} />
            <Skeleton height={56} borderRadius={12} style={{ flex: 1 }} />
            <Skeleton height={56} borderRadius={12} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    );
  }

  const handleCallFamily = () => {
    if (sos.requester?.phone) {
      call(sos.requester.phone);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Information',
        text2: "Le numéro du demandeur n'est pas disponible.",
      });
    }
  };

  const handleChatFamily = () => {
    if (sos.requester) {
      navigation.navigate('Chat', {
        sosId,
        contactId: sos.requesterId,
        contactName: sos.requester.name || 'Demandeur',
        contactPhone: sos.requester.phone || '',
      });
    }
  };

  const handleNavigate = () => {
    // URL universelle Google Maps utilise automatiquement la position GPS actuelle
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${sos.latitude},${sos.longitude}`;
    // Schéma natif de guidage GPS Google Maps (Android)
    const googleMapsApp = `google.navigation:q=${sos.latitude},${sos.longitude}&mode=d`;
    // Schéma natif Apple Maps (iOS)
    const appleMaps = `maps:?daddr=${sos.latitude},${sos.longitude}&dirflg=d`;

    if (Platform.OS === 'ios') {
      Linking.openURL(appleMaps).catch(() => Linking.openURL(googleMapsUrl));
    } else {
      Linking.canOpenURL(googleMapsApp)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(googleMapsApp);
          }
          return Linking.openURL(googleMapsUrl);
        })
        .catch(() => Linking.openURL(googleMapsUrl));
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.infoStrip, { top: insets.top + spacing.md }]}>
        <Text style={styles.hospitalName} numberOfLines={1}>
          {sos.hospitalName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MapPin size={14} color={colors.textSecondary} />
          <Text style={styles.etaText}>{sos.city}</Text>
        </View>
      </View>

      <MapView
        style={styles.map}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={hasLocationPermission}
        initialRegion={{
          latitude: Number(sos.latitude),
          longitude: Number(sos.longitude),
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: Number(sos.latitude), longitude: Number(sos.longitude) }}
          title={sos.hospitalName}
          description={sos.hospitalAddress}
        />
      </MapView>

      <View style={styles.bottomSheet}>
        <Text style={styles.addressLabel}>Adresse</Text>
        <Text style={styles.addressValue}>
          {sos.hospitalAddress}, {sos.city}
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Groupe sanguin</Text>
          <Text style={styles.detailValue}>
            {sos.bloodTypeNeeded.replace('_POS', '+').replace('_NEG', '-')}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Unités requises</Text>
          <Text style={styles.detailValue}>{sos.unitsNeeded}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleNavigate}>
            <Navigation2 size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
            <Text style={styles.primaryButtonText}>Naviguer vers l'hôpital</Text>
          </TouchableOpacity>

          {sos.requester ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleChatFamily}
              >
                <MessageSquare
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={styles.secondaryButtonText}>Discuter avec le demandeur</Text>
              </TouchableOpacity>

              {sos.requester.phone ? (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={handleCallFamily}
                >
                  <Phone size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
                  <Text style={styles.secondaryButtonText}>Appeler le demandeur</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoStrip: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  hospitalName: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  etaText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.success,
    marginLeft: spacing.md,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    marginTop: -20,
  },
  addressLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  addressValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.primary,
  },
  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
});

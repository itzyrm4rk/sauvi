import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Compass,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Phone,
  XCircle,
} from 'lucide-react-native';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/toastConfig';
import { MAIN_TABS, ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useNativeCall } from '../../hooks/useNativeCall';
import { useSosWaitlist } from '../../hooks/useSosWaitlist';
import {
  useCancelWaitlistMutation,
  useGetMyWaitlistEntryQuery,
  useGetSosByIdQuery,
} from '../../store/api/sosApi';
import type { RootStackParamList, SosStackParamList } from '../../types/navigation.types';

export function DonorWaitlistScreen() {
  const route = useRoute<RouteProp<SosStackParamList, 'DonorWaitlist'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList & SosStackParamList>>();
  const insets = useSafeAreaInsets();
  const { sosId } = route.params;
  const { call } = useNativeCall();

  // WebSocket pour mises à jour temps réel
  const { waitlist } = useSosWaitlist(sosId);

  const { data: myEntryResponse, isLoading: isLoadingEntry } = useGetMyWaitlistEntryQuery(
    { sosId },
    { pollingInterval: 8000 },
  );

  const { data: sosResponse, isLoading: isLoadingSos } = useGetSosByIdQuery(
    { sosId },
    { pollingInterval: 10000 },
  );
  const sos = sosResponse?.data;

  const [cancelWaitlist, { isLoading: isCancelling }] = useCancelWaitlistMutation();

  const wsEntry = waitlist.find((d) => d.donorId === myEntryResponse?.data?.donorId);
  const myEntry = wsEntry ?? myEntryResponse?.data ?? null;

  const waitingDonors = waitlist.filter((d) => d.status === 'waiting');
  const foundIndex =
    myEntry?.status === 'waiting' && waitingDonors.length > 0
      ? waitingDonors.findIndex((d) => d.donorId === myEntry.donorId)
      : -1;
  const myPosition = foundIndex >= 0 ? foundIndex + 1 : 1;

  const handleCancelConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Annuler votre participation ?',
      'Êtes-vous sûr de vouloir vous retirer de cette file d’attente ? Le demandeur sera averti.',
      [
        { text: 'Non, rester inscrit', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelWaitlist({ sosId }).unwrap();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Toast.show({
                type: 'success',
                text1: 'Participation annulée',
                text2: 'Vous avez quitté la file d’attente.',
              });
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.HOME } }],
                });
              }
            } catch (error: unknown) {
              const msg =
                (error as { data?: { message?: string } })?.data?.message ||
                "Erreur lors de l'annulation";

              if (msg.includes('Déjà annulé')) {
                Toast.show({
                  type: 'info',
                  text1: 'Participation déjà annulée',
                  text2: 'Vous avez quitté la file d’attente.',
                });
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.HOME } }],
                  });
                }
                return;
              }

              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: msg,
              });
            }
          },
        },
      ],
    );
  };

  const handleOpenGps = async () => {
    if (!sos?.latitude || !sos?.longitude) {
      Toast.show({
        type: 'error',
        text1: 'Coordonnées GPS introuvables',
        text2: "Impossible de localiser l'hôpital.",
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lat = Number(sos.latitude);
    const lon = Number(sos.longitude);
    const destination = `${lat},${lon}`;
    const label = encodeURIComponent(sos.hospitalName || 'Hôpital');

    const googleMapsApp = `google.navigation:q=${destination}&mode=d`;
    const googleMapsWeb = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=${label}`;
    const appleMaps = `maps:?daddr=${destination}&dirflg=d`;

    try {
      if (Platform.OS === 'ios') {
        const canOpenApple = await Linking.canOpenURL(appleMaps);
        if (canOpenApple) {
          await Linking.openURL(appleMaps);
          return;
        }
      } else {
        const canOpenGoogle = await Linking.canOpenURL(googleMapsApp);
        if (canOpenGoogle) {
          await Linking.openURL(googleMapsApp);
          return;
        }
      }
      await Linking.openURL(googleMapsWeb);
    } catch (_err) {
      await Linking.openURL(googleMapsWeb);
    }
  };

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
  }, [myEntry?.status, navigation, sos]);

  // Si l'entrée a été annulée ou rejetée, rediriger automatiquement vers l'accueil sans rester bloqué
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (myEntry?.status === 'cancelled' || myEntry?.status === 'rejected') {
      timer = setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.HOME } }],
          });
        }
      }, 400);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [myEntry?.status, navigation]);

  if (isLoadingEntry || isLoadingSos) {
    return (
      <View
        style={[
          styles.container,
          {
            padding: spacing.xl,
            paddingTop: Math.max(insets.top + spacing.xxl, spacing.xxl * 2),
            gap: spacing.lg,
          },
        ]}
      >
        <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center' }} />
        <Skeleton height={24} width='60%' style={{ alignSelf: 'center' }} />
        <Skeleton height={16} width='80%' style={{ alignSelf: 'center' }} />
        <Skeleton height={100} borderRadius={16} style={{ marginTop: spacing.lg }} />
        <Skeleton height={48} borderRadius={100} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const isCancelledOrRejected = myEntry?.status === 'cancelled' || myEntry?.status === 'rejected';

  if (!myEntry || isCancelledOrRejected) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { paddingTop: insets.top, paddingHorizontal: spacing.xl },
        ]}
      >
        <View style={[styles.iconWrapperClosed, { marginBottom: spacing.md }]}>
          <CheckCircle2 size={44} color={colors.textSecondary} />
        </View>
        <Text style={styles.title}>Participation annulée</Text>
        <Text
          style={[
            styles.description,
            { textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
          ]}
        >
          Vous n'êtes plus dans la file d'attente de ce SOS. Merci pour votre intention solidaire !
        </Text>
        <TouchableOpacity
          style={styles.backButtonCenter}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.HOME } }],
              });
            }
          }}
        >
          <Text style={styles.backButtonCenterText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isValidated = myEntry.status === 'validated';
  const isExpired = sos?.status === 'expired';
  const isFulfilled = sos?.status === 'fulfilled';
  const isClosed = sos?.status === 'closed';
  const isSosEnded = isExpired || isFulfilled || isClosed;

  return (
    <View style={styles.container}>
      {/* TOP BAR AVEC BOUTON RETOUR SÉCURISÉ */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, spacing.xs) }]}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.HOME } }],
              });
            }
          }}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Suivi de votre don</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CARTE STATUT */}
        <View style={[styles.statusCard, isExpired && styles.statusCardExpired]}>
          {isExpired ? (
            <View style={styles.iconWrapperExpired}>
              <Clock size={44} color='#D97706' />
            </View>
          ) : isFulfilled ? (
            <View style={styles.iconWrapperSuccess}>
              <CheckCircle2 size={44} color={colors.success} />
            </View>
          ) : isClosed ? (
            <View style={styles.iconWrapperClosed}>
              <CheckCircle2 size={44} color={colors.textSecondary} />
            </View>
          ) : isValidated ? (
            <View style={styles.iconWrapperSuccess}>
              <CheckCircle2 size={44} color={colors.success} />
            </View>
          ) : (
            <View style={styles.iconWrapperWaiting}>
              <Clock size={44} color={colors.warning} />
            </View>
          )}

          <Text style={styles.title}>
            {isExpired
              ? 'Cette alerte SOS a expiré'
              : isFulfilled
                ? 'Besoin de don satisfait !'
                : isClosed
                  ? 'Cette alerte a été clôturée'
                  : isValidated
                    ? 'Vous avez été sélectionné !'
                    : "Vous êtes dans la file d'attente"}
          </Text>

          {!isValidated && !isSosEnded && (
            <View style={styles.positionContainer}>
              <Text style={styles.positionLabel}>Votre position</Text>
              <Text style={styles.positionValue}>#{myPosition}</Text>
            </View>
          )}

          <Text style={styles.description}>
            {isExpired
              ? "La demande de don a atteint sa date d'échéance et a été clôturée automatiquement. Merci infiniment pour votre élan de solidarité et votre disponibilité ! Vos points d'engagement sont conservés."
              : isFulfilled
                ? 'Le besoin en sang a été accompli avec succès grâce à la mobilisation des donneurs. Merci pour votre engagement civique !'
                : isClosed
                  ? 'Le demandeur a clôturé cette demande de don. Merci infiniment pour votre soutien !'
                  : isValidated
                    ? "Le demandeur a validé votre profil pour ce don. Vous pouvez échanger avec lui et ouvrir l'itinéraire GPS quand vous partez."
                    : 'Le demandeur a été notifié de votre disponibilité. Vous serez alerté dès qu’il valide votre participation.'}
          </Text>
        </View>

        {/* DÉTAILS DE L'HÔPITAL ET DU SOS */}
        {sos && (
          <View style={styles.hospitalCard}>
            <View style={styles.hospitalCardHeader}>
              <Building2 size={20} color={colors.primary} />
              <Text style={styles.hospitalCardTitle}>Lieu du don</Text>
            </View>
            <Text style={styles.hospitalName}>{sos.hospitalName}</Text>
            <View style={styles.addressRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.addressText}>
                {sos.hospitalAddress} — {sos.city}
              </Text>
            </View>
          </View>
        )}

        {/* ACTIONS DU DONNEUR */}
        <View style={styles.actionContainer}>
          {isSosEnded ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() =>
                navigation.navigate('MainTabs', {
                  screen: ROUTES.MAIN.EXPLORER,
                })
              }
            >
              <Compass size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
              <Text style={styles.primaryButtonText}>Explorer d'autres besoins</Text>
            </TouchableOpacity>
          ) : (
            <>
              {isValidated && (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleOpenGps}
                  >
                    <MapIcon size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
                    <Text style={styles.primaryButtonText}>Voir l'itinéraire GPS</Text>
                  </TouchableOpacity>

                  {sos?.requester && (
                    <>
                      <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={() =>
                          navigation.navigate('Chat', {
                            sosId,
                            contactId: sos.requesterId,
                            contactName: sos.requester?.name || 'Demandeur',
                            contactPhone: sos.requester?.phone || '',
                            isClosed: false,
                          })
                        }
                      >
                        <MessageSquare
                          size={20}
                          color={colors.primary}
                          style={{ marginRight: spacing.sm }}
                        />
                        <Text style={styles.secondaryButtonText}>Discuter avec le demandeur</Text>
                      </TouchableOpacity>

                      {sos?.requester?.phone ? (
                        <TouchableOpacity
                          style={[styles.button, styles.secondaryButton]}
                          onPress={() => call(sos?.requester?.phone as string)}
                        >
                          <Phone
                            size={20}
                            color={colors.primary}
                            style={{ marginRight: spacing.sm }}
                          />
                          <Text style={styles.secondaryButtonText}>Appeler le demandeur</Text>
                        </TouchableOpacity>
                      ) : null}
                    </>
                  )}

                  <View style={styles.separator} />
                </>
              )}

              {myEntry.status !== 'donated' && (
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={handleCancelConfirm}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator color={colors.error} />
                  ) : (
                    <>
                      <XCircle size={18} color={colors.error} style={{ marginRight: spacing.xs }} />
                      <Text style={styles.dangerButtonText}>Annuler ma participation</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusCardExpired: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  iconWrapperSuccess: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrapperWaiting: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrapperExpired: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrapperClosed: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  positionContainer: {
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  positionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  positionValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    color: colors.primary,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  hospitalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  hospitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  hospitalCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  hospitalName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  addressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  dangerButton: {
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FFCCC7',
  },
  dangerButtonText: {
    color: colors.error,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  disabledButton: {
    opacity: 0.45,
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  backButtonCenter: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.button,
    marginTop: spacing.md,
  },
  backButtonCenterText: {
    color: colors.white,
    fontFamily: typography.fontFamily.bold,
  },
});

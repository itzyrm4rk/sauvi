import { BLOOD_COMPATIBILITY, formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  HeartHandshake,
  Info,
  MapPin,
  Navigation,
  Share2,
  User,
  Users,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PublicProfileModal } from '../../components/profile/PublicProfileModal';
import { Button } from '../../components/ui/Button';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/toastConfig';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import {
  useGetMyWaitlistEntryQuery,
  useGetSosByIdQuery,
  useGetWaitlistQuery,
  useJoinWaitlistMutation,
} from '../../store/api/sosApi';
import {
  useGetActiveDonationQuery,
  useGetEligibilityQuery,
  useGetMeQuery,
} from '../../store/api/usersApi';
import type { RootStackParamList, SosStackParamList } from '../../types/navigation.types';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function SosDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<SosStackParamList, 'SosDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList & SosStackParamList>>();
  const insets = useSafeAreaInsets();
  const { sosId, sos: initialSos } = route.params;

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const {
    data: fetchedSosResp,
    isLoading: isLoadingSos,
    isError,
    refetch,
  } = useGetSosByIdQuery({ sosId }, { skip: !sosId || !!initialSos });

  const sos = initialSos || fetchedSosResp?.data;

  const { data: userResponse } = useGetMeQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const currentUser = userResponse?.data;

  const { data: eligibilityResponse } = useGetEligibilityQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const eligibility = eligibilityResponse?.data;

  const { data: activeDonationResp } = useGetActiveDonationQuery(undefined, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
  });
  const activeDonation = activeDonationResp?.data;
  const currentSosId = (sos?.id || sosId) as string;

  const { data: myWaitlistEntryResp } = useGetMyWaitlistEntryQuery(
    { sosId: currentSosId },
    { skip: !currentSosId, pollingInterval: 8000 },
  );
  const myEntry = myWaitlistEntryResp?.data;

  const isCommittedToThisSos = Boolean(
    activeDonation?.sosId && activeDonation.sosId === currentSosId,
  );
  const isCommittedToOtherSos = Boolean(
    activeDonation?.sosId && activeDonation.sosId !== currentSosId,
  );

  const [joinWaitlist, { isLoading: isJoining }] = useJoinWaitlistMutation();
  const { data: waitlistData } = useGetWaitlistQuery(
    { sosId: currentSosId },
    { skip: !currentSosId, pollingInterval: 10000 },
  );

  const activeWaitlistMembers = useMemo(
    () =>
      waitlistData?.data?.filter((d) => d.status === 'waiting' || d.status === 'validated') || [],
    [waitlistData],
  );

  const donatedDonors = useMemo(
    () => waitlistData?.data?.filter((d) => d.status === 'donated') || [],
    [waitlistData],
  );
  const donatedCount = donatedDonors.length;

  const waitlistCount = useMemo(() => {
    if (sos?.waitlistCount !== undefined) {
      return Math.max(sos.waitlistCount, activeWaitlistMembers.length);
    }
    return activeWaitlistMembers.length;
  }, [sos?.waitlistCount, activeWaitlistMembers]);

  const isAlreadyInWaitlist = Boolean(
    isCommittedToThisSos ||
      myEntry?.status === 'waiting' ||
      myEntry?.status === 'validated' ||
      activeWaitlistMembers.some((d) => d.donorId === currentUser?.id),
  );
  const isOwner = Boolean(currentUser?.id && sos?.requesterId === currentUser.id);

  // Position utilisateur pour calculer la distance
  useEffect(() => {
    async function fetchUserLoc() {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === Location.PermissionStatus.GRANTED) {
          const last = await Location.getLastKnownPositionAsync();
          if (last) {
            setUserLocation({ latitude: last.coords.latitude, longitude: last.coords.longitude });
          } else {
            const current = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setUserLocation({
              latitude: current.coords.latitude,
              longitude: current.coords.longitude,
            });
          }
        }
      } catch (_e) {
        // Position non disponible
      }
    }
    fetchUserLoc();
  }, []);

  const distanceKm = useMemo(() => {
    if (!userLocation || !sos?.latitude || !sos?.longitude) return null;
    return calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      Number(sos.latitude),
      Number(sos.longitude),
    );
  }, [userLocation, sos?.latitude, sos?.longitude]);

  const isUrgent = sos?.priority === 'urgence_vitale';
  const isExpired = sos?.status === 'expired';
  const isClosed = sos?.status === 'closed';
  const isFulfilled = sos?.status === 'fulfilled';
  const isEnded = isExpired || isClosed || isFulfilled;
  const priorityColor = isEnded ? colors.textSecondary : isUrgent ? colors.primary : colors.warning;
  const priorityBg = isEnded ? `${colors.border}40` : isUrgent ? colors.primaryLight : '#FFF4E2';

  const formattedBloodTypeNeeded = sos?.bloodTypeNeeded ? formatBloodType(sos.bloodTypeNeeded) : '';
  const formattedUserBloodType = currentUser?.bloodType
    ? formatBloodType(currentUser.bloodType)
    : '';

  const compatibleDonorsList = formattedBloodTypeNeeded
    ? (BLOOD_COMPATIBILITY[formattedBloodTypeNeeded] || [formattedBloodTypeNeeded]).map((bg) =>
        formatBloodType(bg),
      )
    : [];

  const isUserCompatible =
    Boolean(formattedUserBloodType) && compatibleDonorsList.includes(formattedUserBloodType);

  // Éligibilité dynamique (délai de carence)
  const isEligibleDynamically = useMemo(() => {
    if (eligibility?.isEligible) return true;
    if (eligibility?.daysRemaining !== undefined && eligibility.daysRemaining <= 0) return true;
    if (eligibility?.nextEligibleDate && new Date(eligibility.nextEligibleDate) <= new Date())
      return true;
    if (currentUser?.isEligible) return true;
    return false;
  }, [eligibility, currentUser]);

  const daysRemaining = eligibility?.daysRemaining ?? 0;

  // Localisation : Même ville que le SOS ?
  const isSameCity = useMemo(() => {
    if (!currentUser?.city || !sos?.city) return true;
    return currentUser.city.trim().toLowerCase() === sos.city.trim().toLowerCase();
  }, [currentUser?.city, sos?.city]);

  const handleShare = async () => {
    if (!sos) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const bloodType = formatBloodType(sos.bloodTypeNeeded);
    const message = `🚨 URGENCE SAUVI : Besoin urgent de don de sang ${bloodType} (${sos.unitsNeeded} unité(s)) à ${sos.hospitalName} — ${sos.city}.\n\nRejoignez l'alerte sur SAUVI pour aider : sauvi://sos/${sos.id}`;
    try {
      await Share.share({ message });
    } catch (_e) {
      // Annulation du partage ignorée
    }
  };

  const handleJoin = async () => {
    if (!sos) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const params: { sosId: string; latitude?: number; longitude?: number } = { sosId: sos.id };

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        params.latitude = location.coords.latitude;
        params.longitude = location.coords.longitude;
      } else {
        Toast.show({
          type: 'info',
          text1: 'Localisation désactivée',
          text2: 'Votre position ne sera pas partagée avec le demandeur.',
        });
      }

      await joinWaitlist(params).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('DonorWaitlist', { sosId: sos.id });
    } catch (error: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2:
          (error as { data?: { message?: string } })?.data?.message || 'Une erreur est survenue',
      });
    }
  };

  if (isError) {
    return <ErrorScreen onRetry={refetch} />;
  }

  if (isLoadingSos || !sos) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top + spacing.md, spacing.xl),
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <Skeleton height={40} borderRadius={20} style={{ marginBottom: spacing.md }} />
        <Skeleton height={180} borderRadius={16} style={{ marginBottom: spacing.md }} />
        <Skeleton height={120} borderRadius={16} style={{ marginBottom: spacing.md }} />
        <Skeleton height={200} borderRadius={16} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP APP BAR */}
      <View style={[styles.navBar, { paddingTop: Math.max(insets.top, spacing.xs) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Détails de l'alerte</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Share2 size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 120, spacing.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD : Urgence & Groupe Sanguin */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
              {isEnded ? (
                <CheckCircle2 size={14} color={priorityColor} />
              ) : isUrgent ? (
                <AlertCircle size={14} color={priorityColor} />
              ) : (
                <Clock size={14} color={priorityColor} />
              )}
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {isExpired
                  ? 'Alerte Expirée'
                  : isFulfilled
                    ? 'Besoin Satisfait'
                    : isClosed
                      ? 'Alerte Clôturée'
                      : isUrgent
                        ? 'Urgence Vitale'
                        : 'Besoin Préventif'}
              </Text>
            </View>
            <View style={styles.timeWrapper}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={styles.timeText}>
                {formatTime(sos.createdAt)} • Il y a{' '}
                {formatDistanceToNow(new Date(sos.createdAt), { locale: fr })}
              </Text>
            </View>
          </View>

          <View style={styles.bloodTypeSection}>
            <View style={styles.bloodBadgeOuter}>
              <View style={styles.bloodBadgeInner}>
                <Text style={styles.bloodTypeText}>{formattedBloodTypeNeeded}</Text>
              </View>
            </View>
            <View style={styles.unitsSection}>
              <Text style={styles.unitsCount}>
                {donatedCount > 0 ? `${donatedCount} / ${sos.unitsNeeded}` : sos.unitsNeeded}
              </Text>
              <Text style={styles.unitsLabel}>
                {donatedCount > 0
                  ? `Poche${donatedCount > 1 ? 's' : ''} collectée${donatedCount > 1 ? 's' : ''}`
                  : sos.unitsNeeded > 1
                    ? 'Unités nécessaires'
                    : 'Unité nécessaire'}
              </Text>
            </View>
          </View>

          {/* DEMANDEUR & COMPTEUR */}
          <View style={styles.metaRow}>
            {sos.requester?.name && (
              <TouchableOpacity
                style={styles.requesterBadge}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedUserId(sos.requesterId);
                }}
              >
                <User size={14} color={colors.primary} />
                <Text style={styles.requesterText}>
                  Demandé par <Text style={styles.requesterNameBold}>{sos.requester.name}</Text>
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.waitlistCounter}>
              <Users size={14} color={colors.primary} />
              <Text style={styles.waitlistCounterText}>
                <Text style={styles.waitlistBold}>{waitlistCount}</Text> en attente
              </Text>
            </View>
          </View>

          {/* DATE COMPLÈTE DE CRÉATION */}
          <View style={styles.publishedRow}>
            <Clock size={13} color={colors.textSecondary} />
            <Text style={styles.publishedText}>
              Publié le {formatDateFull(sos.createdAt)} à {formatTime(sos.createdAt)}
            </Text>
          </View>
        </Animated.View>

        {/* INFORMATIONS D'ÉLIGIBILITÉ OU CARTE PROPRIÉTAIRE */}
        {isOwner ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
            <View style={styles.cardHeader}>
              <HeartHandshake size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Votre demande SOS active</Text>
            </View>
            <Text style={styles.cardDesc}>
              Votre besoin en sang de groupe {formattedBloodTypeNeeded} est diffusé aux donneurs
              compatibles à {sos.city}. Consultez votre tableau de bord pour voir les volontaires en
              direct.
            </Text>
          </Animated.View>
        ) : (
          currentUser?.bloodType && (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.noticeContainer}
            >
              {/* Cas -1: Déjà inscrit sur CE SOS */}
              {isAlreadyInWaitlist ? (
                <View
                  style={[styles.ruleCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                >
                  <CheckCircle2 size={18} color='#2563EB' style={{ marginTop: 2 }} />
                  <View style={styles.ruleCardContent}>
                    <Text style={[styles.ruleCardTitleSuccess, { color: '#1E40AF' }]}>
                      Vous participez à ce don
                    </Text>
                    <Text style={[styles.ruleCardTextSuccess, { color: '#1E3A8A' }]}>
                      Votre présence est signalée au demandeur. Vous pouvez suivre votre statut ou
                      vous désister à tout moment.
                    </Text>
                  </View>
                </View>
              ) : isCommittedToOtherSos && activeDonation?.sos ? (
                /* Cas 0: Déjà engagé sur un autre SOS */
                <View style={[styles.ruleCard, styles.ruleCardWarning]}>
                  <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 2 }} />
                  <View style={styles.ruleCardContent}>
                    <Text style={styles.ruleCardTitleWarning}>Engagement de don en cours</Text>
                    <Text style={styles.ruleCardTextWarning}>
                      Vous participez actuellement à un don à {activeDonation.sos.hospitalName} (
                      {activeDonation.sos.city}). Vous devez finaliser ou annuler votre
                      participation précédente pour rejoindre ce SOS.
                    </Text>
                  </View>
                </View>
              ) : !isUserCompatible ? (
                /* Cas 1: Groupe non compatible */
                <View style={[styles.ruleCard, styles.ruleCardWarning]}>
                  <AlertTriangle size={18} color={colors.warning} style={{ marginTop: 2 }} />
                  <View style={styles.ruleCardContent}>
                    <Text style={styles.ruleCardTitleWarning}>Groupe non compatible</Text>
                    <Text style={styles.ruleCardTextWarning}>
                      Votre groupe ({formattedUserBloodType}) n'est pas directement compatible avec
                      ce besoin ({formattedBloodTypeNeeded}). Vous pouvez aider en partageant cette
                      alerte à vos proches !
                    </Text>
                  </View>
                </View>
              ) : !isEligibleDynamically ? (
                /* Cas 2: Groupe compatible mais en période de carence */
                <View style={[styles.ruleCard, styles.ruleCardWarning]}>
                  <Clock size={18} color={colors.warning} style={{ marginTop: 2 }} />
                  <View style={styles.ruleCardContent}>
                    <Text style={styles.ruleCardTitleWarning}>Période de carence médicale</Text>
                    <Text style={styles.ruleCardTextWarning}>
                      Votre groupe ({formattedUserBloodType}) est compatible, mais vous êtes
                      actuellement en délai de carence ({daysRemaining}j restant
                      {daysRemaining > 1 ? 's' : ''}). Vous pouvez sauver cette vie en partageant
                      l'alerte !
                    </Text>
                  </View>
                </View>
              ) : !isSameCity ? (
                /* Cas 3: Compatible + Éligible mais ville différente */
                <View style={[styles.ruleCard, styles.ruleCardInfo]}>
                  <Info size={18} color={colors.info} style={{ marginTop: 2 }} />
                  <View style={styles.ruleCardContent}>
                    <Text style={styles.ruleCardTitleInfo}>Besoin dans une autre ville</Text>
                    <Text style={styles.ruleCardTextInfo}>
                      Ce SOS est à {sos.city} alors que votre profil indique {currentUser.city}. Si
                      vous êtes sur place, vous pouvez vous porter volontaire, ou relayer ce SOS à
                      vos contacts à {sos.city}.
                    </Text>
                  </View>
                </View>
              ) : (
                /* Cas 4: Tout est parfait (Compatible + Éligible + Même ville) */
                <View style={[styles.ruleCard, styles.ruleCardSuccess]}>
                  <CheckCircle2 size={18} color={colors.success} style={{ marginTop: 2 }} />
                  <View style={styles.ruleCardContent}>
                    <Text style={styles.ruleCardTitleSuccess}>Vous pouvez effectuer ce don</Text>
                    <Text style={styles.ruleCardTextSuccess}>
                      Excellente nouvelle ! Votre groupe ({formattedUserBloodType}) est compatible
                      et vous êtes éligible au don à {sos.city}.
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )
        )}

        {/* LIEU DU DON */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Building2 size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Lieu du don</Text>
          </View>

          <View style={styles.locationBody}>
            <View style={styles.hospitalHeaderRow}>
              <Text style={styles.hospitalName}>{sos.hospitalName}</Text>
              {distanceKm != null && isSameCity && (
                <View style={styles.distanceBadge}>
                  <Navigation size={12} color={colors.primary} />
                  <Text style={styles.distanceText}>À ~{distanceKm} km</Text>
                </View>
              )}
            </View>
            <View style={styles.addressRow}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.addressText}>
                {sos.hospitalAddress} — {sos.city}
              </Text>
            </View>
          </View>

          <View style={styles.gpsLockedInfo}>
            <Info size={16} color={colors.textSecondary} style={{ marginTop: 1 }} />
            <Text style={styles.gpsLockedText}>
              L'itinéraire GPS guidé et la mise en relation par chat/appel seront activés dès que le
              demandeur aura validé votre profil dans la file d'attente.
            </Text>
          </View>
        </Animated.View>

        {/* QUE FAIRE ? (ADAPTÉ AU DEMANDEUR OU AU DONNEUR) */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <HeartHandshake size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Que faire ?</Text>
          </View>

          <View style={styles.stepsList}>
            {isOwner ? (
              <>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Surveillez la file d'attente des donneurs volontaires pour votre alerte.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Validez le donneur disponible et contactez-le par appel direct ou chat pour
                    coordonner sa venue.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Une fois le don effectué à l'hôpital, confirmez-le pour récompenser le donneur
                    avec des points.
                  </Text>
                </View>
              </>
            ) : isUserCompatible && !isEligibleDynamically ? (
              /* Cas : Compatible MAIS en carence médicale */
              <>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Votre groupe est compatible mais vous êtes en période de carence ({daysRemaining}{' '}
                    jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}). Vous
                    ne pouvez pas donner pour l'instant.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Partagez cette alerte à vos proches — un contact compatible peut sauver cette vie
                    à votre place !
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Ajoutez votre prochain don possible à votre agenda pour ne pas l'oublier. Vous
                    pouvez le faire depuis votre profil dans l'onglet Éligibilité.
                  </Text>
                </View>
              </>
            ) : !isUserCompatible ? (
              /* Cas : Groupe non compatible */
              <>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Votre groupe sanguin ({formattedUserBloodType}) n'est pas compatible avec ce
                    besoin. Vous ne pouvez pas donner directement.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Partagez cette alerte à vos proches ou sur vos réseaux — quelqu'un parmi eux
                    pourrait être compatible et sauver cette vie !
                  </Text>
                </View>
              </>
            ) : !isSameCity ? (
              /* Cas : Compatible + Éligible mais ville différente */
              <>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Ce SOS est à {sos?.city} alors que votre profil indique {currentUser?.city}. Si
                    vous êtes sur place, vous pouvez rejoindre la liste d'attente.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Sinon, partagez l'alerte à vos contacts à {sos?.city} pour maximiser les chances
                    de trouver un donneur rapidement.
                  </Text>
                </View>
              </>
            ) : (
              /* Cas : Compatible + Éligible + Même ville → Rejoindre */
              <>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Rejoignez la liste pour signaler votre disponibilité.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Le demandeur valide votre profil et vous échangez par chat ou appel avant votre
                    venue.
                  </Text>
                </View>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Rendez-vous à l'hôpital guidé par le GPS, le demandeur confirme votre don et
                    vous gagnez des points.
                  </Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* FLOATING BOTTOM ACTION BAR */}
      <View
        style={[
          styles.floatingBar,
          { paddingBottom: Math.max(insets.bottom + spacing.xs, spacing.md) },
        ]}
      >
        {isOwner ? (
          <Button
            label='Gérer mon alerte SOS'
            onPress={() => navigation.navigate('SosDashboard', { sosId: currentSosId })}
            fullWidth
          />
        ) : isEnded ? (
          <View style={styles.endedCard}>
            <View style={styles.endedHeader}>
              <CheckCircle2 size={18} color={isExpired ? colors.warning : colors.success} />
              <Text
                style={[styles.endedTitle, { color: isExpired ? colors.warning : colors.success }]}
              >
                {isExpired
                  ? 'Cette demande a atteint sa date limite'
                  : isFulfilled && sos.unitsNeeded > 1
                    ? `Objectif atteint (${donatedCount || sos.unitsNeeded} / ${sos.unitsNeeded} poches)`
                    : 'Cette demande de don est terminée'}
              </Text>
            </View>
            <Text style={styles.endedDesc}>
              {isExpired
                ? `L'alerte a expiré et n'accepte plus de donneurs.${donatedCount > 0 ? ` ${donatedCount} don(s) ont pu être réalisés grâce à la communauté.` : ''} Merci infiniment pour votre solidarité !`
                : isFulfilled && sos.unitsNeeded > 1
                  ? `Les ${sos.unitsNeeded} donneurs requis se sont mobilisés avec succès pour sauver cette vie ! Merci pour votre précieuse solidarité.`
                  : 'Le besoin a été satisfait ou clôturé par le demandeur. Merci pour votre aide précieuse !'}
            </Text>
            <Button
              label='Explorer les autres besoins'
              onPress={() => navigation.goBack()}
              variant='outline'
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : isAlreadyInWaitlist ? (
          <View style={styles.actionRow}>
            <Button
              label="Voir mon statut en file d'attente"
              onPress={() => navigation.navigate('DonorWaitlist', { sosId: currentSosId })}
              variant='outline'
              fullWidth
            />
          </View>
        ) : isCommittedToOtherSos && activeDonation ? (
          /* Déjà engagé dans un autre SOS : bouton vers don en cours + bouton partage */
          <View style={styles.shareActionContainer}>
            <Button
              label={`Accéder à mon don (${activeDonation.sos.hospitalName})`}
              onPress={() => navigation.navigate('DonorWaitlist', { sosId: activeDonation.sosId })}
              variant='outline'
              fullWidth
              style={{ marginBottom: spacing.xs }}
            />
            <Button
              label='Partager cette alerte'
              onPress={handleShare}
              leftIcon={<Share2 size={18} color={colors.white} />}
              fullWidth
            />
          </View>
        ) : !isUserCompatible || !isEligibleDynamically ? (
          /* Non compatible ou en carence : Incitation prioritaire au partage */
          <View style={styles.shareActionContainer}>
            <Button
              label='Partager cette alerte'
              onPress={handleShare}
              leftIcon={<Share2 size={18} color={colors.white} />}
              fullWidth
            />
          </View>
        ) : (
          /* Compatible et éligible : Bouton rejoindre */
          <Button
            label="Rejoindre la liste d'attente"
            onPress={handleJoin}
            loading={isJoining}
            fullWidth
          />
        )}
      </View>

      {/* MODAL PROFIL PUBLIC */}
      <PublicProfileModal
        visible={Boolean(selectedUserId)}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    padding: spacing.md,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    gap: 6,
  },
  priorityText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  publishedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  publishedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  bloodTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bloodBadgeOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodBadgeInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bloodTypeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    color: colors.white,
  },
  unitsSection: {
    flex: 1,
  },
  unitsCount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    color: colors.textPrimary,
    lineHeight: 36,
  },
  unitsLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  requesterBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.input,
  },
  requesterText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  requesterNameBold: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  waitlistCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.input,
  },
  waitlistCounterText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  waitlistBold: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  compatPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  compatPill: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compatPillUser: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  compatPillText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  compatPillTextUser: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  noticeContainer: {
    marginTop: spacing.xs,
  },
  ruleCard: {
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ruleCardSuccess: {
    backgroundColor: '#EAF7F0',
    borderLeftColor: colors.success,
  },
  ruleCardWarning: {
    backgroundColor: '#FFF7E6',
    borderLeftColor: colors.warning,
  },
  ruleCardInfo: {
    backgroundColor: '#EAF3FF',
    borderLeftColor: colors.info,
  },
  ruleCardContent: {
    flex: 1,
  },
  ruleCardTitleSuccess: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginBottom: 2,
  },
  ruleCardTextSuccess: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ruleCardTitleWarning: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    marginBottom: 2,
  },
  ruleCardTextWarning: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ruleCardTitleInfo: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    marginBottom: 2,
  },
  ruleCardTextInfo: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  locationBody: {
    gap: 4,
  },
  hospitalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  hospitalName: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  distanceText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    color: colors.primary,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addressText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  gpsLockedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: borderRadius.input,
    marginTop: spacing.xs,
  },
  gpsLockedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  stepsList: {
    gap: spacing.sm,
    marginTop: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    color: colors.primary,
  },
  stepText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  actionRow: {
    width: '100%',
  },
  shareActionContainer: {
    width: '100%',
  },
  endedCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  endedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  endedTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
  },
  endedDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, Clock, HeartHandshake } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatBloodType } from '@sauvi/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SosAlertCard } from '../../components/sos/SosAlertCard';
import { Avatar, Badge, Card } from '../../components/ui';
import { Skeleton } from '../../components/ui/Skeleton';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { useGetNotificationsQuery } from '../../store/api/notificationsApi';
import { useGetNearbySosQuery } from '../../store/api/sosApi';
import {
  useGetActiveDonationQuery,
  useGetEligibilityQuery,
  useGetMeQuery,
} from '../../store/api/usersApi';
import type { RootStackParamList } from '../../types/navigation.types';

const ALERTS_VIEW_ALL_THRESHOLD = 3;

export function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { data: userResponse, isLoading: isLoadingUser } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });
  const { data: eligibilityResponse, isLoading: isLoadingEligibility } = useGetEligibilityQuery(
    undefined,
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  const { data: activeDonationResponse, refetch: refetchActiveDonation } =
    useGetActiveDonationQuery(undefined, {
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
      pollingInterval: 15000,
    });
  const activeDonation = activeDonationResponse?.data;

  const user = userResponse?.data;
  const eligibility = eligibilityResponse?.data;

  // Calcul dynamique en temps réel de l'éligibilité avec Fail-Safe
  const isEligibleDynamically = useMemo(() => {
    if (eligibility?.isEligible) return true;
    if (eligibility?.daysRemaining !== undefined && eligibility.daysRemaining <= 0) return true;
    if (eligibility?.nextEligibleDate && new Date(eligibility.nextEligibleDate) <= new Date())
      return true;
    if (user?.isEligible) return true;
    return false;
  }, [eligibility, user]);

  const daysRemaining = useMemo(() => {
    if (eligibility?.daysRemaining !== undefined) return eligibility.daysRemaining;
    return 0;
  }, [eligibility]);

  const { data: notificationsResponse, refetch: refetchNotifications } = useGetNotificationsQuery(
    undefined,
    {
      pollingInterval: 15000,
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    },
  );
  const unreadCount = useMemo(
    () => (notificationsResponse?.data ?? []).filter((n) => !n.readAt).length,
    [notificationsResponse],
  );

  const { data: nearbySosResponse, isLoading: isLoadingNearby } = useGetNearbySosQuery(
    {
      city: user?.city ?? undefined,
    },
    {
      pollingInterval: 15000,
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    },
  );

  const isLoading = isLoadingUser || isLoadingEligibility;

  const alerts = useMemo(() => nearbySosResponse?.data ?? [], [nearbySosResponse]);
  const hasAlerts = alerts.length > 0;
  const showViewAll = alerts.length >= ALERTS_VIEW_ALL_THRESHOLD;

  const [refreshing, setRefreshing] = useState(false);

  const { refetch: refetchUser } = useGetMeQuery(undefined);
  const { refetch: refetchEligibility } = useGetEligibilityQuery(undefined);
  const { refetch: refetchNearby } = useGetNearbySosQuery({ city: user?.city ?? undefined });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      refetchUser(),
      refetchEligibility(),
      refetchNearby(),
      refetchNotifications(),
      refetchActiveDonation(),
    ]);
    setRefreshing(false);
  }, [refetchUser, refetchEligibility, refetchNearby, refetchNotifications, refetchActiveDonation]);

  const handleShare = useCallback(async (alert: (typeof alerts)[0]) => {
    const bloodTypeFormatted = formatBloodType(alert.bloodTypeNeeded);
    const message = `🩸 Besoin urgent de ${bloodTypeFormatted} à ${alert.hospitalName} — ${alert.city}.\n\nTéléchargez SAUVI pour aider : sauvi://sos/${alert.id}`;
    try {
      await Share.share({ message });
    } catch (_e) {
      // ignore share cancel
    }
  }, []);

  // Pulse animation for SOS button
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true,
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleGoToProfile = useCallback(() => {
    navigation.navigate('MainTabs', { screen: ROUTES.MAIN.PROFILE });
  }, [navigation]);

  const handleGoToEligibility = useCallback(() => {
    navigation.navigate('MainTabs', {
      screen: ROUTES.MAIN.PROFILE,
      params: { screen: 'Eligibility' },
    });
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, spacing.xxl) },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerLeftWrapper}>
          {isLoading ? (
            <View style={styles.headerLeft}>
              <Skeleton width={48} height={48} borderRadius={24} />
              <View style={styles.headerTextContainer}>
                <Skeleton width={100} height={20} style={{ marginBottom: 4 }} />
                <Skeleton width={150} height={16} />
              </View>
            </View>
          ) : (
            <View style={styles.headerLeft}>
              <Pressable style={styles.avatarPressable} onPress={handleGoToProfile} hitSlop={6}>
                <Avatar
                  name={user?.name || 'Utilisateur'}
                  size='md'
                  imageUrl={user?.avatarUrl || null}
                />
              </Pressable>
              <View style={styles.headerTextContainer}>
                <Pressable onPress={handleGoToProfile} hitSlop={6}>
                  <Text style={styles.greeting} numberOfLines={1} ellipsizeMode='tail'>
                    {user?.name || ''}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleGoToEligibility}
                  hitSlop={6}
                  style={styles.badgePressable}
                >
                  {isEligibleDynamically ? (
                    <Badge label='Éligible au don' variant='success' />
                  ) : (
                    <Badge
                      label={`En carence · ${daysRemaining}j restant${daysRemaining > 1 ? 's' : ''}`}
                      variant='error'
                    />
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Pressable style={styles.bellButton} onPress={() => navigation.navigate('Notifications')}>
          <Bell color={colors.textPrimary} size={24} />
          {unreadCount > 0 && (
            <View style={styles.notificationDot}>
              <Text style={styles.notificationDotText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* SOS SECTION AVEC ESPACEMENT HARMONIEUX */}
      <View style={styles.sosContainer}>
        {isLoading ? (
          <Skeleton width={180} height={180} borderRadius={90} />
        ) : (
          <>
            <Animated.View style={[styles.sosOuterRing, pulseStyle]}>
              <Pressable
                onPress={() => navigation.navigate('MainTabs', { screen: ROUTES.MAIN.SOS })}
              >
                <LinearGradient
                  colors={['#ef4444', '#991b1b']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sosButton}
                >
                  <Image
                    source={require('../../../assets/images/logo.png')}
                    style={styles.sosLogo}
                    contentFit='contain'
                  />
                  <Text style={styles.sosText}>SOS</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
            <Text style={styles.sosSubtitle}>Appuyez pour diffuser une alerte de don</Text>
          </>
        )}
      </View>

      {/* BANDEAU DON ACTIF / ENGAGEMENT EN COURS */}
      {activeDonation?.sos && (
        <View style={styles.activeDonationWrapper}>
          <Pressable
            style={[
              styles.activeDonationCard,
              activeDonation.status === 'validated'
                ? styles.activeDonationCardValidated
                : styles.activeDonationCardWaiting,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('DonorWaitlist', { sosId: activeDonation.sosId });
            }}
          >
            <View style={styles.activeDonationIconWrapper}>
              {activeDonation.status === 'validated' ? (
                <HeartHandshake size={24} color={colors.success} />
              ) : (
                <Clock size={24} color={colors.warning} />
              )}
            </View>
            <View style={styles.activeDonationContent}>
              <View style={styles.activeDonationHeaderRow}>
                <Text style={styles.activeDonationBadge}>
                  {activeDonation.status === 'validated'
                    ? 'Vous êtes sélectionné !'
                    : 'Don en attente de validation'}
                </Text>
              </View>
              <Text style={styles.activeDonationHospital} numberOfLines={1}>
                {activeDonation.sos.hospitalName} ({activeDonation.sos.city})
              </Text>
              <Text style={styles.activeDonationHint}>
                {activeDonation.status === 'validated'
                  ? "Appuyez pour voir l'itinéraire ou contacter le demandeur"
                  : 'Appuyez pour suivre votre position ou vous désister'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* ALERTS SECTION AVEC BOUTON PARTAGER */}
      <View style={styles.alertsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertes donneurs</Text>
          {showViewAll && (
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: ROUTES.MAIN.EXPLORER })}
            >
              <Text style={styles.viewAllText}>Voir Tout</Text>
            </Pressable>
          )}
        </View>
        {isLoading || isLoadingNearby ? (
          <Card>
            <Skeleton width='100%' height={80} />
          </Card>
        ) : hasAlerts ? (
          <View>
            {alerts.slice(0, ALERTS_VIEW_ALL_THRESHOLD).map((alert) => (
              <SosAlertCard
                key={alert.id}
                alert={alert}
                onPress={() => navigation.navigate('SosDetail', { sosId: alert.id, sos: alert })}
                onShare={() => handleShare(alert)}
              />
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucune alerte à proximité pour le moment.</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeftWrapper: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarPressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  badgePressable: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  bellButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  notificationDotText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 13,
  },
  sosContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  sosSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
  sosLogo: {
    width: 48,
    height: 48,
    marginBottom: spacing.xs,
  },
  sosOuterRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  sosText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 42,
    color: colors.white,
    letterSpacing: 2,
  },
  alertsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  activeDonationWrapper: {
    marginBottom: spacing.md,
  },
  activeDonationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
  },
  activeDonationCardWaiting: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FFE58F',
  },
  activeDonationCardValidated: {
    backgroundColor: '#F6FFED',
    borderColor: '#B7EB8F',
  },
  activeDonationIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeDonationContent: {
    flex: 1,
    gap: 2,
  },
  activeDonationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDonationBadge: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  activeDonationHospital: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  activeDonationHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },
});

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, ChevronLeft, Droplets, Share2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DonorCard } from '../../components/sos/DonorCard';
import { Button } from '../../components/ui';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/toastConfig';
import { colors, spacing, typography } from '../../constants/theme';
import { useSosWaitlist } from '../../hooks/useSosWaitlist';
import {
  useCloseSosMutation,
  useGetSosByIdQuery,
  useGetWaitlistQuery,
  useUpdateWaitlistStatusMutation,
} from '../../store/api/sosApi';
import type { SosInitialData, SosPriority, SosStackParamList } from '../../types/navigation.types';

export function SosDashboardScreen(): React.JSX.Element {
  const route = useRoute<RouteProp<SosStackParamList, 'SosDashboard'>>();
  const navigation = useNavigation<NativeStackNavigationProp<SosStackParamList>>();
  const insets = useSafeAreaInsets();
  const { sosId } = route.params || {};

  const { data: sosResp, refetch: refetchSos } = useGetSosByIdQuery(
    { sosId },
    { skip: !sosId, pollingInterval: 15000 },
  );
  const sos = sosResp?.data;
  const status = sos?.status ?? 'active';
  const isActive = status === 'active';
  const isExpired = status === 'expired';
  const isFulfilled = status === 'fulfilled';

  type DashboardTab = 'waiting' | 'validated' | 'donated' | 'volunteers';
  const [activeTab, setActiveTab] = useState<DashboardTab>(isActive ? 'waiting' : 'donated');

  // Si le statut du SOS passe à inactif, basculer vers l'onglet des dons confirmés
  useEffect(() => {
    if (!isActive && activeTab !== 'donated' && activeTab !== 'volunteers') {
      setActiveTab('donated');
    }
  }, [isActive, activeTab]);

  const { waitlist } = useSosWaitlist(sosId);
  const {
    data: initialWaitlist,
    isLoading,
    isError,
    refetch: refetchWaitlist,
  } = useGetWaitlistQuery({ sosId }, { skip: !sosId, pollingInterval: 10000 });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateWaitlistStatusMutation();
  const [closeSos, { isLoading: isClosing }] = useCloseSosMutation();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchWaitlist(), refetchSos()]);
    setRefreshing(false);
  }, [refetchWaitlist, refetchSos]);

  if (!sosId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Erreur : SOS ID manquant</Text>
      </View>
    );
  }

  const activeList = useMemo(
    () => (waitlist.length > 0 ? waitlist : initialWaitlist?.data || []),
    [waitlist, initialWaitlist],
  );

  const waitingDonors = useMemo(
    () => activeList.filter((d) => d.status === 'waiting'),
    [activeList],
  );
  const validatedDonors = useMemo(
    () => activeList.filter((d) => d.status === 'validated' || d.status === 'donated'),
    [activeList],
  );

  const totalUnits = sos?.unitsNeeded ?? 1;
  const donatedDonors = useMemo(
    () => activeList.filter((d) => d.status === 'donated'),
    [activeList],
  );
  const otherDonors = useMemo(() => activeList.filter((d) => d.status !== 'donated'), [activeList]);
  const donatedCount = donatedDonors.length;
  const remainingUnits = Math.max(0, totalUnits - donatedCount);
  const progressRatio = totalUnits > 0 ? Math.min(1, donatedCount / totalUnits) : 0;

  const handleValidate = useCallback(
    async (donorId: string) => {
      if (!isActive) return;
      try {
        await updateStatus({ sosId, donorId, status: 'validated' }).unwrap();
        await refetchWaitlist();
      } catch (error: unknown) {
        const msg = (error as { data?: { message?: string } })?.data?.message;
        Toast.show({
          type: 'error',
          text1: 'Erreur de validation',
          text2: msg || 'Impossible de valider ce donneur',
        });
      }
    },
    [isActive, updateStatus, sosId, refetchWaitlist],
  );

  const handleConfirmDonation = useCallback(
    async (donorId: string) => {
      if (!isActive) return;
      try {
        await updateStatus({ sosId, donorId, status: 'donated' }).unwrap();
        await refetchWaitlist();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const newDonatedCount = donatedCount + 1;
        const newRemaining = Math.max(0, totalUnits - newDonatedCount);

        if (newRemaining > 0) {
          // FLUX SANS FRICTION : Il manque encore des poches, le SOS continue automatiquement
          Toast.show({
            type: 'success',
            text1: `🩸 Poche validée ! (${newDonatedCount}/${totalUnits})`,
            text2: `Encore ${newRemaining} poche${newRemaining > 1 ? 's' : ''} nécessaire${newRemaining > 1 ? 's' : ''}. Votre SOS reste actif.`,
          });
        } else {
          // BESOIN 100% SATISFAIT : Pas de questions superflues, accomplissement direct !
          await refetchSos();
          Alert.alert(
            '🎉 Besoin 100% satisfait !',
            `Toutes les ${totalUnits} poches de sang demandées ont été collectées avec succès grâce à la générosité des donneurs.`,
            [
              {
                text: 'Parfait !',
                style: 'default',
              },
            ],
          );
        }
      } catch (error: unknown) {
        const msg = (error as { data?: { message?: string } })?.data?.message;
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: msg || 'Erreur lors de la confirmation du don',
        });
      }
    },
    [isActive, updateStatus, refetchWaitlist, refetchSos, donatedCount, totalUnits, sosId],
  );

  const handleCloseSOS = useCallback(() => {
    Alert.alert(
      'Clôturer le SOS',
      'Êtes-vous sûr de vouloir clôturer cette alerte ? Les donneurs seront informés que le besoin est satisfait.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Clôturer',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeSos({ sosId }).unwrap();
              navigation.replace('SosStep1');
            } catch (error: unknown) {
              const msg = (error as { data?: { message?: string } })?.data?.message;
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: msg || 'Erreur lors de la clôture',
              });
            }
          },
        },
      ],
    );
  }, [closeSos, navigation, sosId]);

  const currentDisplayList = useMemo(() => {
    if (isActive) {
      return activeTab === 'waiting' ? waitingDonors : validatedDonors;
    }
    return activeTab === 'volunteers' ? otherDonors : donatedDonors;
  }, [isActive, activeTab, waitingDonors, validatedDonors, otherDonors, donatedDonors]);

  const emptyMessage = useMemo(() => {
    if (isActive) {
      return activeTab === 'waiting'
        ? 'Aucun donneur en attente pour le moment.'
        : 'Aucun donneur validé pour le moment.';
    }
    return activeTab === 'volunteers'
      ? 'Aucun autre volontaire inscrit.'
      : 'Aucun don validé avant la clôture de cette alerte.';
  }, [isActive, activeTab]);

  const getStatusBadge = () => {
    switch (status) {
      case 'expired':
        return { label: 'SOS EXPIRÉ', bg: colors.warning };
      case 'fulfilled':
        return { label: 'OBJECTIF ATTEINT', bg: '#16A34A' };
      case 'closed':
        return remainingUnits === 0 && donatedCount > 0
          ? { label: 'OBJECTIF ATTEINT', bg: '#16A34A' }
          : { label: 'CLÔTURÉ PAR L’AUTEUR', bg: '#6B7280' };
      case 'active':
        return { label: 'SOS ACTIF', bg: colors.error };
      default:
        return { label: 'SOS ACTIF', bg: colors.error };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xxl) }]}>
      {/* Header avec statut et bouton Flyer conditionné */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // @ts-ignore
                navigation.navigate('MainTabs', { screen: ROUTES.MAIN.HOME });
              }
            }}
            style={styles.backBtn}
            hitSlop={8}
          >
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
            <Text style={styles.badgeText}>{statusBadge.label}</Text>
          </View>
        </View>

        {isActive ? (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('SosFlyer', { sosId });
            }}
            activeOpacity={0.7}
          >
            <Share2 size={18} color={colors.primary} />
            <Text style={styles.shareText}>Flyer</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.shareDisabled}>
            <Share2 size={16} color={colors.textSecondary} />
            <Text style={styles.shareDisabledText}>Terminé</Text>
          </View>
        )}
      </View>

      {/* CARTE DE PROGRESSION DYNAMIQUE DES POCHES */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeaderRow}>
          <View style={styles.progressTitleCol}>
            <View style={styles.progressTitleWithIcon}>
              <View
                style={[
                  styles.progressIconBadge,
                  { backgroundColor: remainingUnits === 0 ? '#DCFCE7' : '#FEECEC' },
                ]}
              >
                {remainingUnits === 0 ? (
                  <CheckCircle2 size={16} color='#16A34A' />
                ) : (
                  <Droplets size={16} color={colors.primary} />
                )}
              </View>
              <Text style={styles.progressCardTitle}>
                {donatedCount} / {totalUnits} poche{totalUnits > 1 ? 's' : ''} validée
                {donatedCount > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.progressCardSub}>
              {remainingUnits === 0
                ? 'Objectif 100% atteint — Toutes les poches sont assurées'
                : !isActive
                  ? `Alerte clôturée • ${donatedCount} sur ${totalUnits} poche${totalUnits > 1 ? 's' : ''} collectée${donatedCount > 1 ? 's' : ''}`
                  : `Encore ${remainingUnits} poche${remainingUnits > 1 ? 's' : ''} nécessaire${remainingUnits > 1 ? 's' : ''} (1 donneur = 1 poche)`}
            </Text>
          </View>
          <Text
            style={[
              styles.progressPercentText,
              { color: remainingUnits === 0 ? '#16A34A' : colors.primary },
            ]}
          >
            {Math.round(progressRatio * 100)}%
          </Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.round(progressRatio * 100)}%`,
                backgroundColor: remainingUnits === 0 ? '#16A34A' : colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* ONGLETS ADAPTÉS : Opérationnels si actif, Bilan d'accomplissement si terminé */}
      {isActive ? (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'waiting' && styles.activeTab]}
            onPress={() => setActiveTab('waiting')}
          >
            <Text style={[styles.tabText, activeTab === 'waiting' && styles.activeTabText]}>
              En attente ({waitingDonors.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'validated' && styles.activeTab]}
            onPress={() => setActiveTab('validated')}
          >
            <Text style={[styles.tabText, activeTab === 'validated' && styles.activeTabText]}>
              Validés ({validatedDonors.length})
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'donated' && styles.activeTab]}
            onPress={() => setActiveTab('donated')}
          >
            <Text style={[styles.tabText, activeTab === 'donated' && styles.activeTabText]}>
              Dons confirmés ({donatedDonors.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'volunteers' && styles.activeTab]}
            onPress={() => setActiveTab('volunteers')}
          >
            <Text style={[styles.tabText, activeTab === 'volunteers' && styles.activeTabText]}>
              Volontaires libérés ({otherDonors.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isError ? (
        <ErrorScreen onRetry={onRefresh} />
      ) : isLoading && !refreshing ? (
        <View style={styles.listContent}>
          <Skeleton height={120} borderRadius={12} style={{ marginBottom: spacing.md }} />
          <Skeleton height={120} borderRadius={12} style={{ marginBottom: spacing.md }} />
          <Skeleton height={120} borderRadius={12} />
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {currentDisplayList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{emptyMessage}</Text>
            </View>
          ) : (
            currentDisplayList.map((item) => (
              <DonorCard
                key={item.id}
                item={item}
                isFamilyDashboard={true}
                sosStatus={sos?.status}
                onValidate={isActive && activeTab === 'waiting' ? handleValidate : undefined}
                onConfirmDonation={
                  isActive && activeTab === 'validated' && item.status !== 'donated'
                    ? handleConfirmDonation
                    : undefined
                }
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Footer adapté selon le statut du SOS */}
      <View style={styles.footer}>
        {isActive ? (
          <Button
            label='Clôturer le SOS'
            variant='outline'
            fullWidth
            onPress={handleCloseSOS}
            disabled={isClosing || isUpdating}
          />
        ) : isExpired ? (
          <View style={styles.endedContainer}>
            <Text style={styles.endedText}>
              Cette alerte SOS a expiré et n'est plus visible publiquement.
            </Text>
            <Button
              label='Relancer une nouvelle alerte'
              fullWidth
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(
                  'SosStep1',
                  sos
                    ? {
                        initialData: {
                          bloodTypeNeeded: formatBloodType(
                            sos.bloodTypeNeeded,
                          ) as SosInitialData['bloodTypeNeeded'],
                          unitsNeeded: sos.unitsNeeded,
                          priority: sos.priority as SosPriority,
                          hospitalName: sos.hospitalName,
                          hospitalAddress: sos.hospitalAddress,
                          city: sos.city,
                          latitude: Number(sos.latitude),
                          longitude: Number(sos.longitude),
                        },
                      }
                    : undefined,
                );
              }}
            />
          </View>
        ) : (
          <View style={styles.endedContainer}>
            <Text style={styles.endedText}>
              {isFulfilled
                ? 'Ce besoin en don de sang a été accompli avec succès !'
                : 'Cette alerte SOS a été clôturée par vos soins.'}
            </Text>
            <Button
              label='Lancer un nouveau SOS'
              variant='outline'
              fullWidth
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('SosStep1');
              }}
            />
          </View>
        )}
      </View>

      {(isUpdating || isClosing) && (
        <View style={styles.overlay}>
          <ActivityIndicator size='large' color={colors.white} />
        </View>
      )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  badgeText: {
    color: colors.white,
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: `${colors.primary}10`,
  },
  shareText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  shareDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.card,
    opacity: 0.7,
  },
  shareDisabledText: {
    marginLeft: spacing.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    fontSize: 15,
  },
  activeTabText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  endedContainer: {
    gap: spacing.sm,
  },
  endedText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  progressCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: spacing.sm,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressTitleCol: {
    flex: 1,
    gap: 2,
  },
  progressTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  progressCardSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressPercentText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

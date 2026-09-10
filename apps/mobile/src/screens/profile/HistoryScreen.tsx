import { useNavigation } from '@react-navigation/native';
import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import { Building2, ChevronLeft, Droplets, FileText, Siren } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DonationDetailModal } from '../../components/history/DonationDetailModal';
import { SosHistoryModal } from '../../components/history/SosHistoryModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { navigationRef } from '../../navigation/navigationRef';
import {
  type DonationHistoryItem,
  type SosHistoryItem,
  useGetDonationHistoryQuery,
  useGetSosHistoryQuery,
} from '../../store/api/usersApi';

type Tab = 'donations' | 'sos';
type SosFilter = 'all' | 'active' | 'expired' | 'closed';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: colors.success },
  closed: { label: 'Clôturé', color: colors.textSecondary },
  fulfilled: { label: 'Accompli', color: colors.info },
  expired: { label: 'Expiré', color: colors.warning },
};

const SOS_FILTERS: { key: SosFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'Actifs' },
  { key: 'expired', label: 'Expirés' },
  { key: 'closed', label: 'Terminés' },
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function HistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('donations');
  const [sosFilter, setSosFilter] = useState<SosFilter>('all');
  const [selectedDonation, setSelectedDonation] = useState<DonationHistoryItem | null>(null);
  const [selectedSos, setSelectedSos] = useState<SosHistoryItem | null>(null);

  const {
    data: donationsResp,
    isLoading: isLoadingDons,
    refetch: refetchDons,
  } = useGetDonationHistoryQuery();
  const { data: sosResp, isLoading: isLoadingSos, refetch: refetchSos } = useGetSosHistoryQuery();

  const donations = donationsResp?.data ?? [];
  const sosList = sosResp?.data ?? [];

  // Garantit que le SOS actif est TOUJOURS en toute première position
  const sortedSosList = useMemo(() => {
    return [...sosList].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [sosList]);

  const filteredSosList = sortedSosList.filter((sos) => {
    if (sosFilter === 'all') return true;
    if (sosFilter === 'active') return sos.status === 'active';
    if (sosFilter === 'expired') return sos.status === 'expired';
    if (sosFilter === 'closed') return sos.status === 'closed' || sos.status === 'fulfilled';
    return true;
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchDons(), refetchSos()]);
    setRefreshing(false);
  }, [refetchDons, refetchSos]);

  const isLoading = isLoadingDons || isLoadingSos;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'donations' && styles.tabActive]}
          onPress={() => setActiveTab('donations')}
        >
          <Droplets
            size={16}
            color={activeTab === 'donations' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'donations' && styles.tabTextActive]}>
            Mes dons ({donations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sos' && styles.tabActive]}
          onPress={() => setActiveTab('sos')}
        >
          <FileText size={16} color={activeTab === 'sos' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'sos' && styles.tabTextActive]}>
            Mes SOS ({sosList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barre de filtres de statut pour l'onglet Mes SOS */}
      {activeTab === 'sos' && sosList.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {SOS_FILTERS.map((f) => {
              const selected = sosFilter === f.key;
              const count =
                f.key === 'all'
                  ? sosList.length
                  : f.key === 'closed'
                    ? sosList.filter((s) => s.status === 'closed' || s.status === 'fulfilled')
                        .length
                    : sosList.filter((s) => s.status === f.key).length;

              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, selected && styles.filterChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSosFilter(f.key);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                    {f.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View>
            {[1, 2, 3].map((key) => (
              <Skeleton
                key={key}
                width='100%'
                height={90}
                borderRadius={12}
                style={{ marginBottom: 16 }}
              />
            ))}
          </View>
        ) : activeTab === 'donations' ? (
          donations.length === 0 ? (
            <EmptyState
              label='Aucun don enregistré pour le moment.'
              icon={<Droplets size={48} color={colors.textSecondary} />}
            />
          ) : (
            donations.map((don) => (
              <TouchableOpacity
                key={don.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDonation(don);
                }}
              >
                <View style={styles.cardIcon}>
                  <Droplets size={22} color={colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{don.hospitalName}</Text>
                  <Text style={styles.cardSubtitle}>
                    {don.city} · {formatBloodType(don.bloodTypeNeeded)} · {formatDate(don.date)}
                  </Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{don.pointsEarned}</Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : filteredSosList.length === 0 ? (
          <EmptyState
            label={
              sosFilter === 'all'
                ? 'Aucune alerte SOS lancée pour le moment.'
                : `Aucun SOS avec le statut "${SOS_FILTERS.find((f) => f.key === sosFilter)?.label.toLowerCase()}".`
            }
            icon={<Siren size={48} color={colors.textSecondary} />}
          />
        ) : (
          filteredSosList.map((sos) => {
            const statusInfo = STATUS_LABEL[sos.status] ?? {
              label: sos.status,
              color: colors.textSecondary,
            };
            return (
              <TouchableOpacity
                key={sos.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSos(sos);
                }}
              >
                <View style={[styles.cardIcon, { backgroundColor: '#FEECEC' }]}>
                  <Building2 size={22} color={colors.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>
                    {formatBloodType(sos.bloodTypeNeeded)} — {sos.hospitalName}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {sos.city} · {formatDate(sos.createdAt)}
                  </Text>
                  {sos.donationsCount > 0 && (
                    <Text style={styles.cardDetail}>
                      {sos.donationsCount} don{sos.donationsCount > 1 ? 's' : ''} effectué
                      {sos.donationsCount > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}22` }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* MODAL DÉTAILS D'UN DON */}
      <DonationDetailModal
        visible={Boolean(selectedDonation)}
        donation={selectedDonation}
        onClose={() => setSelectedDonation(null)}
        onOpenChat={({ sosId, contactId, contactName, contactPhone }) => {
          setSelectedDonation(null);
          navigationRef.navigate('Chat', {
            sosId,
            contactId,
            contactName,
            ...(contactPhone ? { contactPhone } : {}),
            isClosed: true,
          });
        }}
      />

      {/* MODAL FICHE D'UN SOS */}
      <SosHistoryModal
        visible={Boolean(selectedSos)}
        sos={selectedSos}
        onClose={() => setSelectedSos(null)}
        onNavigateToDashboard={(sosId) => {
          setSelectedSos(null);
          navigationRef.navigate('SosDashboard', { sosId });
        }}
        onOpenChat={({ sosId, contactId, contactName, contactPhone }) => {
          setSelectedSos(null);
          navigationRef.navigate('Chat', {
            sosId,
            contactId,
            contactName,
            ...(contactPhone ? { contactPhone } : {}),
            isClosed: true,
          });
        }}
      />
    </View>
  );
}

function EmptyState({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <View style={emptyStyles.container}>
      {icon}
      <Text style={emptyStyles.label}>{label}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  label: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tabTextActive: { color: colors.primary, fontFamily: typography.fontFamily.bold },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  filtersScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.sm },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  cardDetail: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  pointsBadge: {
    alignItems: 'center',
    backgroundColor: '#E7F8F1',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pointsText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.success,
  },
  pointsLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.success,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
});

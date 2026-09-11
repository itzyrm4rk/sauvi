import * as Haptics from 'expo-haptics';

import { formatBloodType } from '@sauvi/shared';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Droplet,
  MapPin,
  Search,
  Siren,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../../components/ui/Skeleton';
import { useGetNearbySosQuery } from '../../store/api/sosApi';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SosAlertCard } from '../../components/sos/SosAlertCard';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation.types';

const BLOOD_TYPES = [
  { label: 'Tous', value: undefined },
  { label: 'O-', value: 'O_NEG' },
  { label: 'O+', value: 'O_POS' },
  { label: 'A-', value: 'A_NEG' },
  { label: 'A+', value: 'A_POS' },
  { label: 'B-', value: 'B_NEG' },
  { label: 'B+', value: 'B_POS' },
  { label: 'AB-', value: 'AB_NEG' },
  { label: 'AB+', value: 'AB_POS' },
] as const;

const CITIES = [
  { label: 'Toutes', value: undefined },
  { label: 'Douala', value: 'Douala' },
  { label: 'Yaoundé', value: 'Yaoundé' },
  { label: 'Bafoussam', value: 'Bafoussam' },
  { label: 'Garoua', value: 'Garoua' },
  { label: 'Maroua', value: 'Maroua' },
  { label: 'Bamenda', value: 'Bamenda' },
  { label: 'Ngaoundéré', value: 'Ngaoundéré' },
  { label: 'Bertoua', value: 'Bertoua' },
  { label: 'Ebolowa', value: 'Ebolowa' },
  { label: 'Buea', value: 'Buea' },
] as const;

const PAGE_SIZE = 10;

export function ExplorerScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [selectedBloodType, setSelectedBloodType] = useState<string | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetNearbySosQuery(
    {
      city: selectedCity,
      bloodType: selectedBloodType,
      page,
      limit: PAGE_SIZE,
    },
    {
      pollingInterval: 15000,
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    },
  );

  const alerts = useMemo(() => data?.data ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleBloodTypeSelect = useCallback((value: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBloodType(value);
    setPage(1);
  }, []);

  const handleCitySelect = useCallback((value: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCity(value);
    setPage(1);
  }, []);

  const handleShare = useCallback(async (alert: (typeof alerts)[0]) => {
    const bloodTypeFormatted = formatBloodType(alert.bloodTypeNeeded);
    const message = `🩸 Besoin urgent de ${bloodTypeFormatted} à ${alert.hospitalName} — ${alert.city}.\n\nTéléchargez SAUVI pour aider : sauvi://sos/${alert.id}`;
    try {
      await Share.share({ message });
    } catch (_e) {
      // ignore share cancel
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof alerts)[0]; index: number }) => (
      <View key={item.id} style={styles.cardWrapper} testID={`sos-card-${index}`}>
        <SosAlertCard
          alert={item}
          onPress={() => navigation.navigate('SosDetail', { sosId: item.id, sos: item })}
          onShare={() => handleShare(item)}
        />
      </View>
    ),
    [navigation, handleShare],
  );

  const isEmpty = !isLoading && alerts.length === 0;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xxl) }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Search size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>Explorer les SOS</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {total} SOS actif{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
        </Text>
      </View>

      {/* CITY FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.chipsRow}
      >
        {CITIES.map((c) => {
          const active = selectedCity === c.value;
          return (
            <TouchableOpacity
              key={c.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => handleCitySelect(c.value)}
            >
              <MapPin size={12} color={active ? colors.white : colors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* BLOOD TYPE FILTER */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.chipsRow}
      >
        {BLOOD_TYPES.map((bt) => {
          const active = selectedBloodType === bt.value;
          return (
            <TouchableOpacity
              key={bt.label}
              style={[styles.chip, styles.chipBlood, active && styles.chipActiveBlood]}
              onPress={() => handleBloodTypeSelect(bt.value as string | undefined)}
            >
              {bt.value !== undefined && (
                <Droplet size={12} color={active ? colors.white : colors.primary} />
              )}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{bt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LIST */}
      {isLoading && !refreshing ? (
        <View style={styles.list}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.cardWrapper}>
              <Skeleton width='100%' height={120} borderRadius={16} style={{ marginBottom: 16 }} />
            </View>
          ))}
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <Siren size={52} color={colors.border} />
          <Text style={styles.emptyTitle}>Aucun SOS actif</Text>
          <Text style={styles.emptySubtitle}>
            Aucun SOS ne correspond à vos filtres pour le moment.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => {
                    if (page > 1) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPage((p) => p - 1);
                    }
                  }}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={18} color={page <= 1 ? colors.border : colors.primary} />
                </TouchableOpacity>
                <Text style={styles.pageText}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  onPress={() => {
                    if (page < totalPages) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPage((p) => p + 1);
                    }
                  }}
                  disabled={page >= totalPages}
                >
                  <ChevronRight
                    size={18}
                    color={page >= totalPages ? colors.border : colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Loading overlay for pagination */}
      {isFetching && !refreshing && !isLoading && (
        <View style={styles.fetchingOverlay}>
          <AlertCircle size={16} color={colors.textSecondary} />
          <Text style={styles.fetchingText}>Chargement...</Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipBlood: {
    borderColor: colors.primaryLight,
  },
  chipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  chipActiveBlood: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  fetchingOverlay: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  fetchingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});

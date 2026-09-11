import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import {
  BellOff,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronLeft,
  Clock,
  Droplets,
  MessageSquare,
  RotateCcw,
  Siren,
  Sparkles,
  UserMinus,
  UserPlus,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Skeleton } from '../../components/ui/Skeleton';
import { ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { navigationRef } from '../../navigation/navigationRef';
import {
  type InAppNotification,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../store/api/notificationsApi';
import { useLazyGetSosByIdQuery } from '../../store/api/sosApi';
import type { RootStackParamList, SosInitialData, SosPriority } from '../../types/navigation.types';

type FilterTab = 'all' | 'sos' | 'confirmations' | 'system';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'sos', label: 'SOS' },
  { key: 'confirmations', label: 'Dons' },
  { key: 'system', label: 'Système' },
];

function filterNotifications(notifs: InAppNotification[], tab: FilterTab): InAppNotification[] {
  if (tab === 'all') return notifs;
  if (tab === 'sos')
    return notifs.filter((n) => ['sos_share', 'sos_match', 'sos_expired'].includes(n.type));
  if (tab === 'confirmations')
    return notifs.filter((n) =>
      ['donor_joined', 'donor_validated', 'donation_confirmed', 'donor_cancelled'].includes(n.type),
    );
  if (tab === 'system')
    return notifs.filter(
      (n) =>
        ['eligibility_restored', 'chat_message'].includes(n.type) ||
        ![
          'sos_share',
          'sos_match',
          'sos_expired',
          'donor_joined',
          'donor_validated',
          'donation_confirmed',
          'donor_cancelled',
        ].includes(n.type),
    );
  return notifs;
}

function formatRelativeDate(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

export function NotificationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useGetNotificationsQuery(undefined, {
    pollingInterval: 15000,
  });
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [markOneRead] = useMarkNotificationReadMutation();
  const [triggerGetSos] = useLazyGetSosByIdQuery();

  const allNotifs = data?.data ?? [];
  const filtered = filterNotifications(allNotifs, activeTab);
  const globalUnreadCount = allNotifs.filter((n) => !n.readAt).length;
  const tabUnreadCount = filtered.filter((n) => !n.readAt).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMarkAll = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markAllRead();
  };

  const handleRelaunch = async (notif: InAppNotification) => {
    if (!notif.readAt) {
      markOneRead(notif.id);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let initialData = undefined;
    if (notif.sosId) {
      try {
        const resp = await triggerGetSos({ sosId: notif.sosId }).unwrap();
        const sos = resp?.data;
        if (sos) {
          initialData = {
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
          };
        }
      } catch (_e) {
        // En cas d'erreur réseau, continue sans initialData
      }
    }

    navigationRef.navigate('MainTabs', {
      screen: ROUTES.MAIN.SOS,
      params: {
        screen: 'SosStep1',
        ...(initialData ? { params: { initialData } } : {}),
      },
    });
  };

  const handleNotifPress = async (notif: InAppNotification) => {
    if (!notif.readAt) {
      await markOneRead(notif.id);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (notif.type === 'sos_expired') {
      const isMySos = notif.body?.startsWith('Votre alerte');
      if (isMySos) {
        handleRelaunch(notif);
      } else if (notif.sosId) {
        navigation.navigate('DonorWaitlist', { sosId: notif.sosId });
      }
      return;
    }

    // Donneur sélectionné/validé ou don confirmé : direction le suivi de don !
    if ((notif.type === 'donor_validated' || notif.type === 'donation_confirmed') && notif.sosId) {
      navigation.navigate('DonorWaitlist', { sosId: notif.sosId });
      return;
    }

    // Le demandeur reçoit une inscription ou désistement : direction le dashboard du SOS !
    if ((notif.type === 'donor_joined' || notif.type === 'donor_cancelled') && notif.sosId) {
      navigation.navigate('SosDashboard', { sosId: notif.sosId });
      return;
    }

    // Message de chat
    if (notif.type === 'chat_message' && notif.sosId) {
      navigation.navigate('Chat', {
        sosId: notif.sosId,
        contactId: '',
        contactName: 'Discussion',
      });
      return;
    }

    // Restauration d'éligibilité
    if (notif.type === 'eligibility_restored') {
      navigation.navigate('MainTabs', {
        screen: ROUTES.MAIN.PROFILE,
      });
      return;
    }

    // Autres alertes SOS (sos_match, sos_share, etc.)
    if (notif.sosId) {
      navigation.navigate('SosDetail', { sosId: notif.sosId });
    }
  };

  const handleShare = async (notif: InAppNotification) => {
    let message = notif.body ?? '';
    if (notif.shareUrl) {
      message += `\n\nRejoignez l'alerte sur SAUVI pour aider : ${notif.shareUrl}`;
    }
    try {
      await Share.share({ message });
    } catch (_e) {
      // ignore
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sos_match':
      case 'sos_share':
        return { icon: <Siren size={18} color={colors.white} />, bg: colors.primary };
      case 'sos_expired':
        return { icon: <Clock size={18} color={colors.white} />, bg: '#D97706' };
      case 'donor_joined':
        return { icon: <UserPlus size={18} color={colors.white} />, bg: '#2563EB' };
      case 'donor_validated':
        return { icon: <CheckCircle size={18} color={colors.white} />, bg: '#059669' };
      case 'donation_confirmed':
        return { icon: <Droplets size={18} color={colors.white} />, bg: '#D97706' };
      case 'donor_cancelled':
        return { icon: <UserMinus size={18} color={colors.white} />, bg: '#DC2626' };
      case 'eligibility_restored':
        return { icon: <Sparkles size={18} color={colors.white} />, bg: '#10B981' };
      case 'chat_message':
        return { icon: <MessageSquare size={18} color={colors.white} />, bg: '#6366F1' };
      default:
        return { icon: <Check size={18} color={colors.white} />, bg: colors.primary };
    }
  };

  const renderItem = ({ item }: { item: InAppNotification }) => {
    const isUnread = !item.readAt;
    const isShareable = item.type === 'sos_share' || item.type === 'sos_match';
    const isMySos = item.body?.startsWith('Votre alerte');
    const isExpired = item.type === 'sos_expired';
    const isCreatorExpired = isExpired && isMySos;
    const visual = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notifCard, isUnread && styles.notifCardUnread]}
        onPress={() => handleNotifPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.notifIcon, { backgroundColor: visual.bg }]}>{visual.icon}</View>
        <View style={styles.notifBody}>
          <View style={styles.notifTopRow}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifText} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.notifBottom}>
            <Text style={styles.notifTime}>{formatRelativeDate(item.createdAt)}</Text>
            {isCreatorExpired && (
              <TouchableOpacity
                style={styles.relaunchChip}
                onPress={() => handleRelaunch(item)}
                activeOpacity={0.7}
              >
                <RotateCcw size={12} color={colors.primary} />
                <Text style={styles.relaunchChipText}>Relancer</Text>
              </TouchableOpacity>
            )}
            {isShareable && item.sosId && (
              <TouchableOpacity
                style={styles.shareChip}
                onPress={() => handleShare(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.shareChipText}>Partager</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xxl) }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mes Alertes</Text>
          {tabUnreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{tabUnreadCount}</Text>
            </View>
          )}
        </View>
        {globalUnreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <CheckCheck size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllBtn} />
        )}
      </View>

      {/* TAB FILTERS */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      {isLoading && !refreshing ? (
        <View style={styles.list}>
          {[1, 2, 3, 4, 5].map((key) => (
            <Skeleton
              key={key}
              width='100%'
              height={80}
              borderRadius={12}
              style={{ marginBottom: 16 }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BellOff size={52} color={colors.border} />
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptySubtitle}>
                Vous n'avez aucune notification dans cette catégorie.
              </Text>
            </View>
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyContainer: {
    flexGrow: 1,
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
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifCardUnread: {
    borderColor: colors.primaryLight,
    backgroundColor: '#FEF4F4',
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifIconSos: {
    backgroundColor: colors.primary,
  },
  notifIconSystem: {
    backgroundColor: colors.success,
  },
  notifBody: {
    flex: 1,
    gap: spacing.xs,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notifTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notifText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notifBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  notifTime: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  shareChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
  },
  shareChipText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  relaunchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  relaunchChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
});

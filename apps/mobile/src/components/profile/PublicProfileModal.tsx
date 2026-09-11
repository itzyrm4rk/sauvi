import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import {
  Award,
  Calendar,
  Crown,
  Droplets,
  Gem,
  HeartHandshake,
  MapPin,
  Medal,
  Megaphone,
  ShieldCheck,
  Trophy,
  X,
} from 'lucide-react-native';
import { memo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useGetPublicProfileQuery } from '../../store/api/usersApi';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';

export interface PublicProfileModalProps {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
}

const BADGE_CONFIG = {
  bronze: { label: 'Bronze', color: '#A07044', bg: '#FDF0E0', IconComponent: Medal },
  argent: { label: 'Argent', color: '#757575', bg: '#F5F5F5', IconComponent: Medal },
  or: { label: 'Or', color: '#B8860B', bg: '#FFFAE0', IconComponent: Trophy },
  diamant: { label: 'Diamant', color: '#0EA5E9', bg: '#E0F2FE', IconComponent: Gem },
  legende: { label: 'Légende', color: '#7C3AED', bg: '#EDE9FE', IconComponent: Crown },
} as const;

function formatMemberDate(dateString?: string): string {
  if (!dateString) return 'Membre SAUVI';
  const date = new Date(dateString);
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  return `Membre depuis ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export const PublicProfileModal = memo(function PublicProfileModal({
  visible,
  userId,
  onClose,
}: PublicProfileModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { data: profileResp, isLoading } = useGetPublicProfileQuery(
    { userId: userId || '' },
    { skip: !userId || !visible, refetchOnMountOrArgChange: true },
  );

  const profile = profileResp?.data;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={handleClose} />

        <View
          style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          {/* DRAG HANDLE */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profil du membre</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading || !profile ? (
            <View style={styles.loadingContainer}>
              <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center' }} />
              <Skeleton
                height={20}
                width='50%'
                style={{ alignSelf: 'center', marginTop: spacing.md }}
              />
              <Skeleton
                height={14}
                width='35%'
                style={{ alignSelf: 'center', marginTop: spacing.xs }}
              />
              <View style={styles.statsGridSkeleton}>
                <Skeleton height={80} borderRadius={16} style={{ flex: 1 }} />
                <Skeleton height={80} borderRadius={16} style={{ flex: 1 }} />
                <Skeleton height={80} borderRadius={16} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* HERO USER */}
              <View style={styles.heroSection}>
                <View style={styles.avatarWrapper}>
                  <Avatar name={profile.name} imageUrl={profile.avatarUrl} size='lg' />
                  {profile.bloodType ? (
                    <View style={styles.bloodBadge}>
                      <Text style={styles.bloodBadgeText}>
                        {formatBloodType(profile.bloodType)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{profile.name}</Text>
                  <ShieldCheck size={18} color={colors.success} style={{ marginLeft: 4 }} />
                </View>

                <View style={styles.metaRow}>
                  {profile.city ? (
                    <View style={styles.metaItem}>
                      <MapPin size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{profile.city}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <Calendar size={13} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{formatMemberDate(profile.memberSince)}</Text>
                  </View>
                </View>
              </View>

              {/* STATS CARDS */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrapper, { backgroundColor: '#FEE2E2' }]}>
                    <Droplets size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{profile.totalDonations}</Text>
                  <Text style={styles.statLabel}>
                    {profile.totalDonations > 1 ? 'Dons réalisés' : 'Don réalisé'}
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                    <Trophy size={18} color='#D97706' />
                  </View>
                  <Text style={styles.statValue}>{profile.reputationPoints}</Text>
                  <Text style={styles.statLabel}>Points de réputation</Text>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconWrapper, { backgroundColor: '#E0E7FF' }]}>
                    <Megaphone size={18} color='#4F46E5' />
                  </View>
                  <Text style={styles.statValue}>{profile.totalSos}</Text>
                  <Text style={styles.statLabel}>
                    {profile.totalSos > 1 ? 'SOS lancés' : 'SOS lancé'}
                  </Text>
                </View>
              </View>

              {/* BADGES SECTION */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Award size={18} color={colors.textPrimary} />
                  <Text style={styles.sectionTitle}>Badges & Distinctions</Text>
                </View>

                {profile.badges && profile.badges.length > 0 ? (
                  <View style={styles.badgesContainer}>
                    {profile.badges.map((b) => {
                      const conf = BADGE_CONFIG[b.type] || {
                        label: b.type,
                        color: colors.primary,
                        bg: colors.card,
                        IconComponent: Award,
                      };
                      return (
                        <View key={b.type} style={[styles.badgePill, { backgroundColor: conf.bg }]}>
                          <conf.IconComponent size={15} color={conf.color} />
                          <Text style={[styles.badgeLabel, { color: conf.color }]}>
                            {conf.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyBadges}>
                    <Text style={styles.emptyBadgesText}>
                      Ce membre n'a pas encore débloqué de badge.
                    </Text>
                  </View>
                )}
              </View>

              {/* MESSAGE DE SOLIDARITÉ */}
              <View style={styles.solidarityCard}>
                <HeartHandshake size={20} color={colors.primary} />
                <Text style={styles.solidarityText}>
                  Membre engagé de la communauté SAUVI. Ensemble, chaque don sauve une vie.
                </Text>
              </View>

              {/* BOUTON FERMER */}
              <TouchableOpacity style={styles.closeActionButton} onPress={handleClose}>
                <Text style={styles.closeActionText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  statsGridSkeleton: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  bloodBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    borderWidth: 2,
    borderColor: colors.white,
  },
  bloodBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    color: colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  badgeLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
  },
  emptyBadges: {
    paddingVertical: spacing.xs,
  },
  emptyBadgesText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  solidarityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: borderRadius.card,
  },
  solidarityText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  closeActionButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  closeActionText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },
});

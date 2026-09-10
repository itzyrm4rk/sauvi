import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Crown,
  Droplets,
  Gem,
  Lock,
  Share2,
  Siren,
  Star,
  Trophy,
  UserPlus,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useGetMeQuery } from '../../store/api/usersApi';

interface BadgeDef {
  id: string;
  type: 'bronze' | 'argent' | 'or' | 'diamant' | 'legende';
  label: string;
  description: string;
  threshold: number;
  color: string;
  bgColor: string;
}

const BADGES: BadgeDef[] = [
  {
    id: 'bronze',
    type: 'bronze',
    label: 'Cœur de Bronze',
    description: 'Premier don effectué',
    threshold: 50,
    color: '#A07044',
    bgColor: '#FDF0E0',
  },
  {
    id: 'argent',
    type: 'argent',
    label: "Héros d'Argent",
    description: '~4 dons effectués',
    threshold: 250,
    color: '#9E9E9E',
    bgColor: '#F5F5F5',
  },
  {
    id: 'or',
    type: 'or',
    label: "Sauveur d'Or",
    description: '~8 dons effectués',
    threshold: 600,
    color: '#B8860B',
    bgColor: '#FFFAE0',
  },
  {
    id: 'diamant',
    type: 'diamant',
    label: 'Gardien de Diamant',
    description: '~15 dons — 2 ans de fidélité',
    threshold: 1200,
    color: '#0EA5E9',
    bgColor: '#E0F2FE',
  },
  {
    id: 'legende',
    type: 'legende',
    label: 'Légende SAUVI',
    description: '~25 dons — Héros absolu',
    threshold: 2000,
    color: '#7C3AED',
    bgColor: '#EDE9FE',
  },
];

function BadgeTile({
  badge,
  unlocked,
}: {
  badge: BadgeDef;
  unlocked: boolean;
  points: number;
}) {
  const handleShare = async () => {
    await Share.share({
      message: `J'ai obtenu le badge "${badge.label}" sur SAUVI, l'application de dons de sang ! Rejoins-moi sur SAUVI.`,
    });
  };
  const scale = useSharedValue(1);

  useEffect(() => {
    if (unlocked) {
      const delay = Math.random() * 2000;
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1.03, { duration: 1500 }), withTiming(1, { duration: 1500 })),
          -1,
          true,
        ),
      );
    }
  }, [unlocked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowColor: unlocked ? badge.color : colors.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: unlocked ? 0.3 : 0.1,
    shadowRadius: unlocked ? 8 : 4,
    elevation: unlocked ? 6 : 2,
  }));

  return (
    <Animated.View style={[tileStyles.tile, !unlocked && tileStyles.tileDisabled, animatedStyle]}>
      <View
        style={[tileStyles.iconWrapper, { backgroundColor: unlocked ? badge.bgColor : '#F0F0EE' }]}
      >
        {unlocked ? (
          badge.type === 'legende' ? (
            <Crown size={32} color={badge.color} />
          ) : badge.type === 'diamant' ? (
            <Gem size={32} color={badge.color} />
          ) : (
            <Trophy size={32} color={badge.color} />
          )
        ) : (
          <Lock size={28} color='#C0BEBA' />
        )}
      </View>
      <Text style={[tileStyles.label, !unlocked && tileStyles.labelDisabled]}>{badge.label}</Text>
      <Text style={tileStyles.desc}>{badge.description}</Text>
      <Text style={[tileStyles.threshold, { color: unlocked ? badge.color : '#C0BEBA' }]}>
        {unlocked ? '✓ Débloqué' : `${badge.threshold} pts requis`}
      </Text>
      {unlocked && (
        <TouchableOpacity
          style={[tileStyles.shareBtn, { borderColor: badge.color }]}
          onPress={handleShare}
        >
          <Share2 size={14} color={badge.color} />
          <Text style={[tileStyles.shareBtnText, { color: badge.color }]}>Partager</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const tileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: '44%',
    maxWidth: '48%',
  },
  tileDisabled: { opacity: 0.6 },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  labelDisabled: { color: colors.textSecondary },
  desc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  threshold: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  shareBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
});

export function BadgesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: userResp } = useGetMeQuery();
  const user = userResp?.data;
  const points = user?.reputationPoints ?? 0;

  // Calculer le prochain badge
  const nextBadge = BADGES.find((b) => points < b.threshold);
  const highestUnlocked = BADGES.slice()
    .reverse()
    .find((b) => points >= b.threshold);
  const nextThreshold = nextBadge?.threshold ?? BADGES[BADGES.length - 1]?.threshold ?? 0;
  const prevThreshold = highestUnlocked?.threshold ?? 0;
  const progressToNext =
    nextThreshold > prevThreshold
      ? Math.min(1, (points - prevThreshold) / (nextThreshold - prevThreshold))
      : 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badges & Réputation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero Score */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrapper}>
            <Star size={36} color='#FFD700' fill='#FFD700' />
          </View>
          <Text style={styles.heroPoints}>{points}</Text>
          <Text style={styles.heroLabel}>Points SAUVI</Text>

          {/* Barre vers prochain badge */}
          {nextBadge && (
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabelText}>{highestUnlocked?.label ?? 'Débutant'}</Text>
                <Text style={styles.progressLabelText}>{nextBadge.label}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressToNext * 100}%` }]} />
              </View>
              <Text style={styles.progressHint}>
                Encore{' '}
                <Text style={{ fontFamily: typography.fontFamily.bold }}>
                  {nextThreshold - points} pts
                </Text>{' '}
                pour le prochain badge
              </Text>
            </View>
          )}

          {!nextBadge && (
            <View style={styles.progressSection}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  marginTop: spacing.xs,
                }}
              >
                <Trophy size={16} color='#FFD700' />
                <Text style={[styles.progressHint, { marginTop: 0 }]}>
                  Tous les badges débloqués !
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions expliquées */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Comment gagner des points ?</Text>
          {[
            {
              label: "Rejoindre une liste d'attente",
              pts: '+5 pts',
              icon: <UserPlus size={20} color={colors.textSecondary} />,
            },
            {
              label: 'Don confirmé',
              pts: '+50 pts',
              icon: <Droplets size={20} color={colors.primary} />,
            },
            {
              label: 'Don en urgence vitale',
              pts: '+75 pts bonus',
              icon: <Siren size={20} color={colors.error} />,
            },
            {
              label: 'Don O− (Donneur universel)',
              pts: '+100 pts bonus',
              icon: <Star size={20} color='#FFD700' />,
            },
          ].map((a) => (
            <View key={a.label} style={styles.actionRow}>
              <View style={styles.actionIconWrapper}>{a.icon}</View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionPts}>{a.pts}</Text>
            </View>
          ))}
        </View>

        {/* Grille badges */}
        <Text style={styles.sectionTitle}>Vos badges</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              unlocked={points >= badge.threshold}
              points={points}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

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
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroPoints: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 56,
    color: colors.white,
    lineHeight: 64,
  },
  heroLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  progressSection: { width: '100%', marginTop: spacing.lg, gap: spacing.xs },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 99,
  },
  progressHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIconWrapper: { width: 28, alignItems: 'center' },
  actionLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  actionPts: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.success,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
  },
});

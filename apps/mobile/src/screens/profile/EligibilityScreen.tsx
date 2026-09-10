import { useNavigation } from '@react-navigation/native';
import { CalendarPlus, ChevronLeft, Droplets, Heart, Info } from 'lucide-react-native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useGetEligibilityQuery, useGetMeQuery } from '../../store/api/usersApi';
import { exportToCalendarICS } from '../../utils/calendar';

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <View style={progressStyles.track}>
      <View style={[progressStyles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 12,
    backgroundColor: '#E8E6DF',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 99,
  },
});

export function EligibilityScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: userResp } = useGetMeQuery();
  const { data: eligResp, isLoading } = useGetEligibilityQuery();

  const user = userResp?.data;
  const eligibility = eligResp?.data;

  const isEligible = eligibility?.isEligible ?? true;
  const daysRemaining = eligibility?.daysRemaining ?? 0;
  const cooldownDays = user?.gender === 'feminin' ? 84 : 56;

  const daysElapsed = cooldownDays - daysRemaining;
  const progress = cooldownDays > 0 ? daysElapsed / cooldownDays : 1;

  const nextDateStr = eligibility?.nextEligibleDate
    ? new Date(eligibility.nextEligibleDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const lastDonationStr = user?.lastDonationDate
    ? new Date(user.lastDonationDate).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Éligibilité & Carence</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size='large' color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Status Card */}
            <View
              style={[
                styles.statusCard,
                isEligible ? styles.statusCardEligible : styles.statusCardCooldown,
              ]}
            >
              <View style={styles.statusIconWrapper}>
                {isEligible ? (
                  <Heart size={40} color={colors.white} fill={colors.white} />
                ) : (
                  <Droplets size={40} color={colors.white} />
                )}
              </View>
              <Text style={styles.statusTitle}>
                {isEligible ? 'Vous êtes éligible' : 'En période de carence'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isEligible
                  ? 'Vous pouvez répondre à un SOS et donner votre sang.'
                  : `Encore ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} avant de pouvoir donner.`}
              </Text>
            </View>

            {/* Timeline Card */}
            {!isEligible && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Progression de la carence</Text>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineLabel}>{daysElapsed} j écoulés</Text>
                  <Text style={styles.timelineLabel}>{daysRemaining} j restants</Text>
                </View>
                <ProgressBar
                  progress={progress}
                  color={daysRemaining <= 7 ? colors.success : colors.primary}
                />
                {nextDateStr && eligibility?.nextEligibleDate && (
                  <>
                    <Text style={styles.nextDateText}>
                      Prochain don possible le{' '}
                      <Text style={styles.nextDateBold}>{nextDateStr}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.calendarButton}
                      onPress={() => {
                        if (eligibility?.nextEligibleDate) {
                          exportToCalendarICS(
                            new Date(eligibility.nextEligibleDate),
                            'Prochain don de sang possible - SAUVI',
                            "Vous êtes à nouveau éligible pour donner votre sang aujourd'hui. Aidez à sauver des vies !",
                          );
                        }
                      }}
                    >
                      <CalendarPlus size={20} color={colors.primary} />
                      <Text style={styles.calendarButtonText}>Ajouter à mon agenda</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* Info Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations</Text>
              {lastDonationStr && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dernier don</Text>
                  <Text style={styles.infoValue}>{lastDonationStr}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Délai de carence</Text>
                <Text style={styles.infoValue}>
                  {user?.gender === 'feminin' ? 'Féminin — 84 jours' : 'Masculin — 56 jours'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type de don concerné</Text>
                <Text style={styles.infoValue}>Sang total uniquement</Text>
              </View>
            </View>

            <View style={styles.ruleCard}>
              <Info size={20} color={colors.info} style={{ marginTop: 2 }} />
              <Text style={styles.ruleText}>
                SAUVI gère uniquement les dons de sang total. Les délais de carence sont fixés par
                les recommandations médicales (56 j pour les hommes, 84 j pour les femmes).
              </Text>
            </View>
          </>
        )}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  statusCard: {
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusCardEligible: { backgroundColor: colors.success },
  statusCardCooldown: { backgroundColor: colors.primary },
  statusIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.white,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  timelineLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  nextDateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  nextDateBold: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  calendarButtonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  ruleCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ruleText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
});

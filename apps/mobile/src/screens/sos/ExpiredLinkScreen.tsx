import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatBloodType } from '@sauvi/shared';
import {
  Building2,
  CheckCircle2,
  Clock,
  Droplets,
  HeartPulse,
  Home,
  Search,
} from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAIN_TABS, ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation.types';

export function ExpiredLinkScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ExpiredLink'>>();
  const insets = useSafeAreaInsets();

  const params = route.params;
  const status = params?.status ?? 'fulfilled';
  const unitsNeeded = params?.unitsNeeded ?? 1;
  const collectedUnits = params?.collectedUnits ?? (status === 'fulfilled' ? unitsNeeded : 0);
  const bloodTypeNeeded = params?.bloodTypeNeeded
    ? formatBloodType(params.bloodTypeNeeded)
    : undefined;
  const hospitalName = params?.hospitalName;
  const city = params?.city;

  const isFulfilled = status === 'fulfilled';
  const isExpired = status === 'expired';

  // Définition des couleurs & icônes selon le statut
  const themeColor = isFulfilled
    ? colors.success
    : isExpired
      ? colors.warning
      : colors.textSecondary;
  const badgeBg = `${themeColor}15`;

  const getTitle = () => {
    if (isFulfilled) {
      return unitsNeeded > 1
        ? `Objectif atteint : ${unitsNeeded} poches collectées !`
        : 'Ce patient a été sauvé !';
    }
    if (isExpired) {
      return 'Alerte arrivée à échéance';
    }
    return 'Demande de don clôturée';
  };

  const getMessage = () => {
    if (isFulfilled) {
      if (unitsNeeded > 1) {
        return `Grâce à la formidable mobilisation de la communauté, les ${unitsNeeded} donneurs requis se sont présentés avec succès. Ce besoin vital est désormais entièrement couvert !`;
      }
      return 'Grâce à la communauté, cette alerte est clôturée avec succès. Cependant, d’autres personnes ont encore urgemment besoin de donneurs de sang aujourd’hui.';
    }
    if (isExpired) {
      if (collectedUnits > 0) {
        return `Cette alerte a atteint son délai limite. Grâce aux donneurs mobilisés, ${collectedUnits} poche${collectedUnits > 1 ? 's ont' : ' a'} pu être collectée${collectedUnits > 1 ? 's' : ''}. D'autres patients attendent encore votre aide.`;
      }
      return "Cette alerte a atteint son délai d'expiration et n'accepte plus de nouveaux donneurs. D'autres personnes ont encore urgemment besoin de soutien aujourd'hui.";
    }
    return "Cette alerte SOS a été clôturée par le demandeur ou l'établissement de santé. D'autres personnes comptent sur votre générosité.";
  };

  const getBadgeLabel = () => {
    if (isFulfilled) return 'OBJECTIF ATTEINT';
    if (isExpired) return 'DÉLAI DÉPASSÉ';
    return 'ALERTE CLÔTURÉE';
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.xl),
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        },
      ]}
    >
      {/* ICÔNE DE STATUT */}
      <View
        style={[styles.iconContainer, { backgroundColor: badgeBg, borderColor: `${themeColor}30` }]}
      >
        {isFulfilled ? (
          <CheckCircle2 size={56} color={themeColor} />
        ) : isExpired ? (
          <Clock size={56} color={themeColor} />
        ) : (
          <HeartPulse size={56} color={themeColor} />
        )}
      </View>

      {/* BADGE DE STATUT */}
      <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.statusBadgeText, { color: themeColor }]}>{getBadgeLabel()}</Text>
      </View>

      {/* TITRE & MESSAGE */}
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.message}>{getMessage()}</Text>

      {/* CARTE RÉCAPITULATIVE (MULTI-DONNEURS OU INFOS CONTEXTUELLES) */}
      {(unitsNeeded > 1 || collectedUnits > 0 || bloodTypeNeeded || hospitalName) && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Droplets size={16} color={colors.primary} />
              <Text style={styles.summaryLabel}>Mobilisation</Text>
              <Text style={styles.summaryValue}>
                {collectedUnits} / {unitsNeeded} poche{unitsNeeded > 1 ? 's' : ''}
              </Text>
            </View>

            {bloodTypeNeeded && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Groupe requis</Text>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodBadgeText}>{bloodTypeNeeded}</Text>
                </View>
              </View>
            )}
          </View>

          {hospitalName && (
            <View style={styles.hospitalRow}>
              <Building2 size={14} color={colors.textSecondary} />
              <Text style={styles.hospitalText} numberOfLines={1}>
                {hospitalName}
                {city ? ` • ${city}` : ''}
              </Text>
            </View>
          )}

          {/* BARRE DE PROGRESSION */}
          {unitsNeeded > 1 && (
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: themeColor,
                    width: `${Math.min(100, Math.round((collectedUnits / unitsNeeded) * 100))}%`,
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.EXPLORER } }],
            });
          }}
        >
          <Search size={18} color={colors.white} />
          <Text style={styles.primaryButtonText}>Voir les autres urgences</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.8}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: MAIN_TABS, params: { screen: ROUTES.MAIN.HOME } }],
            });
          }}
        >
          <Home size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  bloodBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.input,
  },
  bloodBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hospitalText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    maxWidth: '85%',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.pill,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.pill,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
});

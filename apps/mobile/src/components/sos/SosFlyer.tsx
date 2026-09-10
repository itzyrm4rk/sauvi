import { formatBloodType } from '@sauvi/shared';
import { AlertTriangle, Droplets, Heart, MapPin } from 'lucide-react-native';
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';

interface SosFlyerProps {
  bloodType: string;
  unitsNeeded: number;
  priority: 'preventif' | 'urgence_vitale';
  hospitalName: string;
  city: string;
}
export const SosFlyer = forwardRef<View, SosFlyerProps>(
  ({ bloodType, unitsNeeded, priority, hospitalName, city }, ref) => {
    const isUrgent = priority === 'urgence_vitale';

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {/* En-tête SAUVI */}
        <View style={styles.header}>
          <Heart size={28} color={colors.white} fill={colors.white} />
          <Text style={styles.logoText}>SAUVI</Text>
          <Text style={styles.subtitle}>Don de sang d'urgence</Text>
        </View>

        {/* Badge de priorité */}
        <View style={[styles.priorityBadge, isUrgent ? styles.urgentBadge : styles.preventifBadge]}>
          <AlertTriangle size={16} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.priorityText}>{isUrgent ? 'URGENCE VITALE' : 'PRÉVENTIF'}</Text>
        </View>

        {/* Groupe sanguin */}
        <View style={styles.bloodSection}>
          <Text style={styles.bloodLabel}>Groupe sanguin recherché</Text>
          <Text style={styles.bloodType}>{formatBloodType(bloodType)}</Text>
        </View>

        {/* Infos */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Droplets size={18} color={colors.primary} />
            <Text style={styles.infoText}>
              {unitsNeeded} unité{unitsNeeded > 1 ? 's' : ''} nécessaire{unitsNeeded > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.infoText}>{hospitalName}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.infoText}>{city}</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>Téléchargez l'application SAUVI</Text>
          <Text style={styles.ctaSubtext}>et aidez à sauver des vies</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chaque don compte</Text>
          <Heart size={16} color={colors.error} fill={colors.error} />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  logoText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    color: colors.white,
    marginTop: spacing.sm,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xs,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    borderRadius: 8,
  },
  urgentBadge: {
    backgroundColor: '#D32F2F',
  },
  preventifBadge: {
    backgroundColor: '#F9A825',
  },
  priorityText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 1,
  },
  bloodSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  bloodLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bloodType: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 64,
    color: colors.primary,
  },
  infoSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoText: {
    marginLeft: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    color: colors.textPrimary,
  },
  ctaSection: {
    backgroundColor: colors.background,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    color: colors.primary,
  },
  ctaSubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.white,
  },
});

import { StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'info' | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { background: string; text: string }> = {
  primary: { background: colors.primaryLight, text: colors.primaryDark },
  success: { background: '#E6F5EF', text: colors.success },
  warning: { background: '#FDF4E7', text: colors.warning },
  info: { background: '#E8F0FA', text: colors.info },
  neutral: { background: colors.background, text: colors.textSecondary },
};

export function Badge({ label, variant = 'neutral' }: BadgeProps): React.JSX.Element {
  const palette = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
});

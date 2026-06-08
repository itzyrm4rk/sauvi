import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function OnboardingScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ensemble, sauvons des vies</Text>
      <Text style={styles.description}>
        SAUVI connecte les familles en urgence médicale aux donneurs de sang bénévoles.
      </Text>
      <Button label='Commencer' fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
});

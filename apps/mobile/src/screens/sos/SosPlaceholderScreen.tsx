import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function SosPlaceholderScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS Urgence</Text>
      <Text style={styles.description}>Diffusser une alerte de don de sang.</Text>
      <Button label='Lancer un SOS' variant='primary' fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    color: colors.primary,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});

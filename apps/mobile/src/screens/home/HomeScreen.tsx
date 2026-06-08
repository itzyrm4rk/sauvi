import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Card } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function HomeScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.row}>
          <Avatar name='Utilisateur SAUVI' size='md' />
          <View style={styles.content}>
            <Text style={styles.title}>Bienvenue sur SAUVI</Text>
            <Badge label='Éligible au don' variant='success' />
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
});

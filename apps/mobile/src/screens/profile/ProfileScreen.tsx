import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Card } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function ProfileScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.row}>
          <Avatar name='Utilisateur SAUVI' size='lg' />
          <View>
            <Text style={styles.name}>Utilisateur SAUVI</Text>
            <Text style={styles.subtitle}>Profil unifié donneur / demandeur</Text>
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
    gap: spacing.lg,
  },
  name: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});

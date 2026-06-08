import { StyleSheet, Text, View } from 'react-native';

import { Skeleton } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function NotificationsScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Skeleton height={72} borderRadius={16} />
      <Skeleton height={72} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});

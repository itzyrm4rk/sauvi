import { useNavigation } from '@react-navigation/native';
import { AlertCircle, RefreshCcw } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../constants/theme';

interface ErrorScreenProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorScreen({ onRetry, message }: ErrorScreenProps): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={64} color={colors.error} />
      </View>

      <Text style={styles.title}>Oups ! Une erreur est survenue</Text>

      <Text style={styles.message}>
        {message ||
          "Nous n'avons pas pu charger ces données. Veuillez réessayer dans quelques instants."}
      </Text>

      {onRetry ? (
        <TouchableOpacity style={styles.primaryButton} onPress={onRetry}>
          <RefreshCcw size={20} color={colors.white} />
          <Text style={styles.primaryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </TouchableOpacity>
      )}
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 100,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.white,
  },
  secondaryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
});

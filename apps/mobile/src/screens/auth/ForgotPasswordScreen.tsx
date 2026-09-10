import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Info, KeyRound, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/toastConfig';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { useForgotPasswordMutation } from '../../store/api/authApi';
import type { AuthStackParamList } from '../../types/navigation.types';

export function ForgotPasswordScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Veuillez saisir une adresse email valide');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await forgotPassword({ email: trimmedEmail }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Code envoyé',
        text2: 'Vérifiez votre boîte de réception pour obtenir votre code de réinitialisation.',
      });

      navigation.navigate(ROUTES.AUTH.RESET_PASSWORD, { email: trimmedEmail });
    } catch (_err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Impossible d'envoyer le code. Veuillez réessayer.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mot de passe oublié</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <KeyRound size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Réinitialiser votre mot de passe</Text>
          <Text style={styles.subtitle}>
            Saisissez l'adresse email associée à votre compte SAUVI. Nous vous enverrons un code de
            confirmation à 6 chiffres.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label='Adresse email *'
            placeholder='exemple@email.com'
            keyboardType='email-address'
            autoCapitalize='none'
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(undefined);
            }}
            error={error}
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />

          <View style={styles.btnContainer}>
            <Button label='Envoyer le code' onPress={handleSubmit} loading={isLoading} fullWidth />
          </View>
        </View>

        {/* Note d'aide Spam / Courriers indésirables */}
        <View style={styles.ruleCard}>
          <Info size={18} color={colors.info} style={{ marginTop: 2 }} />
          <Text style={styles.ruleText}>
            Si vous ne recevez pas l'email dans votre boîte principale, pensez à consulter vos{' '}
            <Text style={styles.boldText}>Courriers indésirables (Spams)</Text> ou l'onglet{' '}
            <Text style={styles.boldText}>Promotions</Text>.
          </Text>
        </View>
      </ScrollView>

      {/* Footer ancré en bas */}
      <TouchableOpacity
        style={[
          styles.backToLogin,
          { paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg) },
        ]}
        onPress={() => navigation.navigate(ROUTES.AUTH.LOGIN)}
      >
        <Text style={styles.backToLoginText}>
          Vous vous souvenez de votre mot de passe ?{' '}
          <Text style={styles.backToLoginLink}>Se connecter</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  btnContainer: {
    marginTop: spacing.sm,
  },
  backToLogin: {
    alignItems: 'center',
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backToLoginText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  backToLoginLink: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  ruleCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ruleText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.info,
    lineHeight: 18,
  },
  boldText: {
    fontFamily: typography.fontFamily.bold,
  },
});

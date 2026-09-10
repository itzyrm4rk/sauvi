import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Eye, EyeOff, Info, Lock, ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Toast } from '../../components/ui/toastConfig';
import { ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../store/api/authApi';
import type { AuthStackParamList } from '../../types/navigation.types';

export function ResetPasswordScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.AUTH.RESET_PASSWORD>>();
  const insets = useSafeAreaInsets();
  const email = route.params?.email || '';

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const [forgotPassword, { isLoading: isResending }] = useForgotPasswordMutation();

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
    return undefined;
  }, [resendTimer]);

  const handleResend = async () => {
    if (!canResend || isResending) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await forgotPassword({ email }).unwrap();
      setResendTimer(60);
      setCanResend(false);

      Toast.show({
        type: 'success',
        text1: 'Nouveau code envoyé',
        text2: 'Vérifiez à nouveau votre boîte de réception.',
      });
    } catch (_err) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de renvoyer le code. Veuillez réessayer.',
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const cleanOtp = otp.replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      newErrors.otp = 'Veuillez saisir le code à 6 chiffres reçu par email';
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await resetPassword({
        email,
        otp: otp.replace(/\D/g, ''),
        password,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Mot de passe réinitialisé',
        text2: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      });

      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.AUTH.LOGIN }],
      });
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiError = err as { status?: number; data?: { message?: string } };
      const message = apiError?.data?.message || 'Code invalide ou expiré. Veuillez réessayer.';

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: message,
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
        <Text style={styles.headerTitle}>Nouveau mot de passe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xxl) },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Vérification du code</Text>
          <Text style={styles.subtitle}>
            Saisissez le code à 6 chiffres envoyé à{' '}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        </View>

        {/* Saisie Code OTP */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Code de vérification (6 chiffres) *</Text>
          <View
            style={[styles.otpInputContainer, Boolean(errors.otp) && styles.otpInputContainerError]}
          >
            <TextInput
              style={styles.otpInput}
              placeholder='000000'
              placeholderTextColor={colors.textSecondary}
              keyboardType='number-pad'
              maxLength={6}
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                clearError('otp');
              }}
            />
          </View>
          {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
        </View>

        {/* Nouveau mot de passe */}
        <View style={styles.fieldGroup}>
          <Input
            label='Nouveau mot de passe *'
            placeholder='••••••••'
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError('password');
            }}
            error={errors.password}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            }
          />
          {password.length > 0 && <PasswordStrength password={password} />}
        </View>

        {/* Confirmer nouveau mot de passe */}
        <View style={styles.fieldGroup}>
          <Input
            label='Confirmer le nouveau mot de passe *'
            placeholder='••••••••'
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            error={errors.confirmPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            }
          />
        </View>

        <View style={styles.btnContainer}>
          <Button
            label='Réinitialiser le mot de passe'
            onPress={handleSubmit}
            loading={isResetting}
            fullWidth
          />
        </View>

        {/* Renvoyer le code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Vous n'avez pas reçu le code ? </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend || isResending}>
            <Text
              style={[styles.resendLink, (!canResend || isResending) && styles.resendLinkDisabled]}
            >
              {canResend ? 'Renvoyer' : `Renvoyer (${resendTimer}s)`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note d'aide Spam / Courriers indésirables */}
        <View style={styles.ruleCard}>
          <Info size={18} color={colors.info} style={{ marginTop: 2 }} />
          <Text style={styles.ruleText}>
            Pensez à vérifier votre dossier{' '}
            <Text style={styles.boldText}>Courriers indésirables (Spams)</Text> ou l'onglet{' '}
            <Text style={styles.boldText}>Promotions</Text> si l'email contenant votre code tarde à
            apparaître.
          </Text>
        </View>
      </ScrollView>
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
    gap: spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  fieldGroup: {
    position: 'relative',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  otpInputContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputContainerError: {
    borderColor: colors.error,
  },
  otpInput: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    letterSpacing: 8,
    color: colors.primary,
    textAlign: 'center',
    width: '100%',
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: 4,
  },
  btnContainer: {
    marginTop: spacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  resendText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  resendLinkDisabled: {
    color: colors.textSecondary,
    opacity: 0.6,
  },
  ruleCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
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

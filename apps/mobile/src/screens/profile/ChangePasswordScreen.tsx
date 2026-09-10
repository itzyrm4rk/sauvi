import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react-native';
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
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Toast } from '../../components/ui/toastConfig';
import { colors, spacing, typography } from '../../constants/theme';
import { useChangePasswordMutation } from '../../store/api/usersApi';

export function ChangePasswordScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Veuillez saisir votre mot de passe actuel';
    }

    if (!newPassword || newPassword.length < 8) {
      newErrors.newPassword = 'Le nouveau mot de passe doit contenir au moins 8 caractères';
    }

    if (newPassword && currentPassword && newPassword === currentPassword) {
      newErrors.newPassword = "Le nouveau mot de passe doit être différent de l'actuel";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre nouveau mot de passe';
    } else if (newPassword !== confirmPassword) {
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

      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Mot de passe modifié',
        text2: 'Votre mot de passe a été mis à jour avec succès.',
      });

      navigation.goBack();
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiError = err as { status?: number; data?: { message?: string } };
      const message = apiError?.data?.message || 'Impossible de modifier le mot de passe.';

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
        <Text style={styles.headerTitle}>Mot de passe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xxl) },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.iconHero}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color={colors.primary} />
          </View>
          <Text style={styles.title}>Modifier votre mot de passe</Text>
          <Text style={styles.subtitle}>
            Choisissez un mot de passe fort d'au moins 8 caractères avec des lettres et des chiffres
            pour sécuriser votre compte.
          </Text>
        </View>

        {/* Mot de passe actuel */}
        <View style={styles.fieldGroup}>
          <Input
            label='Mot de passe actuel *'
            placeholder='••••••••'
            secureTextEntry={!showCurrent}
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              clearError('currentPassword');
            }}
            error={errors.currentPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            }
          />
        </View>

        {/* Nouveau mot de passe */}
        <View style={styles.fieldGroup}>
          <Input
            label='Nouveau mot de passe *'
            placeholder='••••••••'
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              clearError('newPassword');
            }}
            error={errors.newPassword}
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                {showNew ? (
                  <EyeOff size={18} color={colors.textSecondary} />
                ) : (
                  <Eye size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            }
          />
          {newPassword.length > 0 && <PasswordStrength password={newPassword} />}
        </View>

        {/* Confirmation nouveau mot de passe */}
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
            label='Mettre à jour le mot de passe'
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
          />
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
  iconHero: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  fieldGroup: {
    marginBottom: spacing.xs,
  },
  btnContainer: {
    marginTop: spacing.md,
  },
});

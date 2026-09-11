import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { CheckSquare, Lock, Mail, Square, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { Toast } from '../../components/ui/toastConfig';

import { Button, Input, PasswordStrength } from '../../components/ui';
import { env } from '../../config/env';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { useRegisterStep1Mutation } from '../../store/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../types/navigation.types';

const registerStep1Schema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email("Le format de l'email est invalide"),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/,
      'Le mot de passe doit contenir au moins une lettre majuscule, une lettre miniscule, un caractère et un chiffre',
    ),
  termsAccepted: z.boolean().refine((val) => val === true, 'Vous devez accepter les conditions'),
});

type FormValues = z.infer<typeof registerStep1Schema>;

type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.AUTH.REGISTER_STEP1>;

export function RegisterStep1Screen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registerStep1, { isLoading }] = useRegisterStep1Mutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(registerStep1Schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await registerStep1({
        name: data.name,
        email: data.email,
        password: data.password,
      }).unwrap();

      if (response.data.tokens?.accessToken && response.data.tokens?.refreshToken) {
        navigation.navigate(ROUTES.AUTH.REGISTER_STEP2, {
          email: data.email,
          accessToken: response.data.tokens.accessToken,
          refreshToken: response.data.tokens.refreshToken,
        });
      }
    } catch (error) {
      console.error('RegisterStep1 full error:', JSON.stringify(error, null, 2));
      const apiError = error as {
        status?: number | string;
        data?: { error?: { message?: string; details?: unknown[] } };
      };
      const details = apiError?.data?.error?.details;
      const errObj = error as { error?: string; message?: string; status?: number | string };

      let msg = 'Erreur réseau (serveur injoignable)';
      if (apiError?.data?.error?.message) {
        msg = apiError.data.error.message;
      } else if (errObj?.status === 'PARSING_ERROR') {
        msg = 'Réponse inattendue du serveur.';
      } else if (errObj?.status === 'FETCH_ERROR') {
        msg = 'Impossible de contacter le serveur.';
      } else if (errObj?.message) {
        msg = errObj.message;
      }

      const detailMsg =
        Array.isArray(details) && details.length > 0
          ? `\n${details
              .map((d: unknown) => {
                const detail = d as { message?: string };
                return detail?.message ?? JSON.stringify(d);
              })
              .join('\n')}`
          : '';
      Toast.show({
        type: 'error',
        text1: 'Erreur inscription',
        text2: `${msg}${detailMsg}`,
      });
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const returnUrl = Linking.createURL('/auth/callback');
      const result = await WebBrowser.openAuthSessionAsync(
        `${env.EXPO_PUBLIC_API_URL}/auth/google?redirect_uri=${encodeURIComponent(returnUrl)}`,
        returnUrl,
      );

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);

        if (queryParams?.accessToken && queryParams?.refreshToken) {
          if (queryParams.profileComplete === 'true') {
            dispatch(
              setCredentials({
                accessToken: queryParams.accessToken as string,
                refreshToken: queryParams.refreshToken as string,
              }),
            );
          } else {
            navigation.navigate(ROUTES.AUTH.REGISTER_STEP2, {
              email: (queryParams.email as string) || '',
              accessToken: queryParams.accessToken as string,
              refreshToken: queryParams.refreshToken as string,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de se connecter avec Google',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + spacing.md, spacing.xxl),
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl),
          },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez la communauté SAUVI</Text>

        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>Étape 1/2</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '50%' }]} />
          </View>
        </View>

        <Button
          label='Continuer avec Google'
          onPress={handleGoogleAuth}
          variant='outline'
          loading={isGoogleLoading}
          fullWidth
          leftIcon={
            <Image
              source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
              style={{ width: 20, height: 20 }}
              contentFit='contain'
            />
          }
        />

        <View style={styles.separatorContainer}>
          <View style={styles.separator} />
          <Text style={styles.separatorText}>ou s'inscrire avec un e-mail</Text>
          <View style={styles.separator} />
        </View>

        <Controller
          control={control}
          name='name'
          render={({ field: { onChange, value } }) => (
            <Input
              label='Nom complet'
              placeholder='Entrez votre nom & prénom'
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
              leftIcon={<User size={20} color={colors.textSecondary} />}
            />
          )}
        />

        <Controller
          control={control}
          name='email'
          render={({ field: { onChange, value } }) => (
            <Input
              label='Adresse e-mail'
              placeholder='email@exemple.com'
              keyboardType='email-address'
              autoCapitalize='none'
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
              leftIcon={<Mail size={20} color={colors.textSecondary} />}
            />
          )}
        />

        <Controller
          control={control}
          name='password'
          render={({ field: { onChange, value } }) => (
            <View>
              <Input
                label='Mot de passe'
                placeholder='••••••••'
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
                leftIcon={<Lock size={20} color={colors.textSecondary} />}
              />
              <Text style={styles.passwordHint}>
                Il doit contenir au moins 1 lettre majuscule, 1 lettre minuscule, 1 caractère et 1
                chiffre.
              </Text>
              <PasswordStrength password={value} />
            </View>
          )}
        />

        <Controller
          control={control}
          name='termsAccepted'
          render={({ field: { onChange, value } }) => (
            <View style={styles.checkboxContainer}>
              <TouchableOpacity onPress={() => onChange(!value)} style={styles.checkboxTouch}>
                {value ? (
                  <CheckSquare size={20} color={colors.primary} />
                ) : (
                  <Square size={20} color={colors.border} />
                )}
                <Text style={styles.checkboxText}>
                  J'accepte les conditions d'utilisation et la politique de confidentialité
                </Text>
              </TouchableOpacity>
              {errors.termsAccepted && (
                <Text style={styles.errorText}>{errors.termsAccepted.message}</Text>
              )}
            </View>
          )}
        />

        <View style={{ flex: 1 }} />

        <Button
          label='Continuer'
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          fullWidth
          disabled={!isValid}
        />

        <TouchableOpacity onPress={goToLogin} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Déjà un compte ? <Text style={styles.loginTextBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxxl,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  separator: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    marginHorizontal: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  checkboxContainer: {
    marginTop: spacing.sm,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkboxText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.md,
  },
  errorText: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginLeft: 28,
  },
  passwordHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  loginTextBold: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
});

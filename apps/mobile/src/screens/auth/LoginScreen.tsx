import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
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

import { Button, Input } from '../../components/ui';
import { Toast } from '../../components/ui/toastConfig';
import { env } from '../../config/env';
import { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { setCredentials } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../types/navigation.types';

const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type FormValues = z.infer<typeof loginSchema>;
type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.AUTH.LOGIN>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { login, isLoginLoading } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login({ email: data.email, password: data.password });
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number | string;
        data?: { error?: { message?: string } };
      };
      let message = 'Identifiants incorrects ou problème réseau.';
      if (apiErr?.status === 401 || apiErr?.data?.error?.message) {
        message = apiErr.data?.error?.message ?? 'Email ou mot de passe incorrect.';
      } else if (apiErr?.status === 'FETCH_ERROR') {
        message = 'Impossible de joindre le serveur. Vérifiez votre connexion Wi-Fi.';
      } else if (apiErr?.status === 'PARSING_ERROR') {
        message = 'Réponse inattendue du serveur. Vérifiez que votre téléphone est sur le même Wi-Fi.';
      }
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: message,
      });
    }
  };

  const handleGoogleAuth = async () => {
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
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate(ROUTES.AUTH.FORGOT_PASSWORD);
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
            paddingTop: Math.max(insets.top + spacing.lg, spacing.xl),
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.lg),
          },
        ]}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec Logo centré au-dessus de Connexion */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              contentFit='contain'
            />
          </View>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Ravi de vous revoir !</Text>
        </View>

        {/* Formulaire central */}
        <View style={styles.formContainer}>
          <Controller
            control={control}
            name='email'
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label='Email'
                placeholder='email@exemple.com'
                keyboardType='email-address'
                autoCapitalize='none'
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message || undefined}
              />
            )}
          />

          <Controller
            control={control}
            name='password'
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label='Mot de passe'
                placeholder='••••••••'
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message || undefined}
              />
            )}
          />

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton}>
            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <Button
            label='Se connecter'
            fullWidth
            onPress={handleSubmit(onSubmit)}
            loading={isLoginLoading}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label='Continuer avec Google'
            variant='outline'
            fullWidth
            onPress={handleGoogleAuth}
            leftIcon={
              <Image
                source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
                style={styles.googleIcon}
                contentFit='contain'
              />
            }
          />
        </View>

        {/* Footer ancré en bas */}
        <View style={styles.footerSection}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.AUTH.REGISTER_STEP1)}>
              <Text style={styles.footerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.brandTagline}>SAUVI • Chaque don sauve une vie 🩸</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 54,
    height: 54,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.info,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  footerSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  footerLink: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
  },
  brandTagline: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
});

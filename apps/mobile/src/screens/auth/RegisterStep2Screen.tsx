import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, Camera, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { useDispatch } from 'react-redux';
import { z } from 'zod';
import { Toast } from '../../components/ui/toastConfig';

import { CAMEROON_CITIES } from '@sauvi/shared';
import { Button, Input } from '../../components/ui';
import type { ROUTES } from '../../constants/routes';
import { colors, spacing, typography } from '../../constants/theme';
import { useRegisterStep2Mutation } from '../../store/api/authApi';
import { useUploadAvatarMutation } from '../../store/api/usersApi';
import { setCredentials } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../types/navigation.types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Masculin', 'Féminin'];

const registerStep2Schema = z.object({
  bloodType: z.string().min(1, 'Le groupe sanguin est requis'),
  gender: z.string().min(1, 'Le genre est requis'),
  birthDate: z
    .date({
      required_error: 'La date de naissance est requise',
      invalid_type_error: 'Date invalide',
    })
    .refine((date) => {
      const ageDiffMs = Date.now() - date.getTime();
      const ageDate = new Date(ageDiffMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970) >= 18;
    }, 'Vous devez avoir 18 ans minimum'),
  city: z.string().min(1, 'La ville est requise'),
  phone: z.string().min(9, 'Le numéro doit contenir au moins 9 chiffres'),
  avatarUri: z.string().optional(),
});

type FormValues = z.infer<typeof registerStep2Schema>;
type Props = NativeStackScreenProps<AuthStackParamList, typeof ROUTES.AUTH.REGISTER_STEP2>;

export function RegisterStep2Screen({ route }: Props): React.JSX.Element {
  const { accessToken, refreshToken } = route.params;
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerStep2] = useRegisterStep2Mutation();
  const [uploadAvatar] = useUploadAvatarMutation();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(registerStep2Schema),
    mode: 'onChange',
    defaultValues: {
      bloodType: '',
      gender: '',
      city: '',
      phone: '',
    },
  });

  const cityValue = watch('city');
  const avatarUri = watch('avatarUri');

  const filteredCities = CAMEROON_CITIES.filter((c) =>
    c.toLowerCase().includes((cityValue || '').toLowerCase()),
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setValue('avatarUri', result.assets[0].uri);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Upload de l'avatar si l'utilisateur en a choisi un
      if (data.avatarUri) {
        const formData = new FormData();
        const filename = data.avatarUri.split('/').pop() ?? 'avatar.jpg';
        const match = /\.([^.]+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('file', { uri: data.avatarUri, name: filename, type } as unknown as Blob);
        await uploadAvatar({ formData, token: accessToken }).unwrap();
      }

      // 2. Enregistrement du profil médical
      const normalizedGender = data.gender.toLowerCase().replace('é', 'e') as
        | 'masculin'
        | 'feminin';
      await registerStep2({
        bloodType: data.bloodType,
        gender: normalizedGender,
        birthDate: data.birthDate.toISOString(),
        city: data.city,
        phone: data.phone,
        token: accessToken,
      }).unwrap();

      // 3. Sauvegarde des tokens
      dispatch(setCredentials({ accessToken, refreshToken }));
    } catch (error) {
      console.error('RegisterStep2 error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Une erreur est survenue lors de l'inscription. Réessayez.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
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
        <Text style={styles.title}>Finalisez votre profil</Text>
        <Text style={styles.subtitle}>
          Ces informations nous aident à vous trouver des donneurs compatibles.
        </Text>
        <Text style={styles.mandatoryInfo}>* Tous les champs sont obligatoires à remplir</Text>

        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>Étape 2/2</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
        </View>

        {/* Avatar Picker */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarTouch} onPress={pickImage}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit='cover' />
            ) : (
              <View style={styles.avatarPlaceholder}>
                {/* @ts-ignore */}
                <User size={40} color={colors.textSecondary} />
                <View style={styles.avatarBadge}>
                  {/* @ts-ignore */}
                  <Camera size={14} color={colors.background} />
                </View>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.avatarText}>Optionnel: Ajoutez un photo de profil</Text>
        </View>

        {/* Gender Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Genre *</Text>
          <Controller
            control={control}
            name='gender'
            render={({ field: { onChange, value } }) => (
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderButton, value === g && styles.genderButtonActive]}
                    onPress={() => onChange(g)}
                  >
                    <Text style={[styles.genderText, value === g && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}
        </View>

        {/* Blood Type Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Groupe sanguin *</Text>
          <Controller
            control={control}
            name='bloodType'
            render={({ field: { onChange, value } }) => (
              <View style={styles.bloodGrid}>
                {BLOOD_TYPES.map((bt) => (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.bloodButton, value === bt && styles.bloodButtonActive]}
                    onPress={() => onChange(bt)}
                  >
                    <Text style={[styles.bloodText, value === bt && styles.bloodTextActive]}>
                      {bt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.bloodType && <Text style={styles.errorText}>{errors.bloodType.message}</Text>}
        </View>

        {/* Birth Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date de naissance *</Text>
          <Controller
            control={control}
            name='birthDate'
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={styles.datePickerTouch}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, !value && styles.dateTextPlaceholder]}>
                    {value ? value.toLocaleDateString('fr-FR') : 'JJ/MM/AAAA'}
                  </Text>
                  {/* @ts-ignore */}
                  <Calendar size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={value || new Date(2000, 0, 1)}
                    mode='date'
                    display='default'
                    maximumDate={new Date()}
                    onChange={(_event, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) onChange(date);
                    }}
                  />
                )}
              </>
            )}
          />
          {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate.message}</Text>}
        </View>

        {/* City Autocomplete */}
        <View style={styles.section}>
          <Controller
            control={control}
            name='city'
            render={({ field: { onChange, value } }) => (
              <View style={{ zIndex: 1000, elevation: 1000 }}>
                <Input
                  label='Ville *'
                  placeholder='Entrez votre ville'
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    setShowCityDropdown(true);
                  }}
                  onFocus={() => setShowCityDropdown(true)}
                  error={errors.city?.message}
                />
                {showCityDropdown && filteredCities.length > 0 && (
                  <View style={styles.dropdown}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps='handled'>
                      {filteredCities.map((city) => (
                        <TouchableOpacity
                          key={city}
                          style={styles.dropdownItem}
                          onPress={() => {
                            onChange(city);
                            setShowCityDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownText}>{city}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          />
        </View>

        {/* Phone */}
        <View style={styles.section}>
          <Controller
            control={control}
            name='phone'
            render={({ field: { onChange, value } }) => (
              <View>
                <Text style={styles.label}>Téléphone *</Text>
                <View style={[styles.phoneContainer, errors.phone && styles.phoneContainerError]}>
                  <View style={styles.flagContainer}>
                    <Text style={styles.flagText}>🇨🇲 +237</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder='6XX XXX XXX'
                    keyboardType='phone-pad'
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
              </View>
            )}
          />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.footer}>
          <Button
            label='Créer mon compte'
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            disabled={!isValid}
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.md,
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
  mandatoryInfo: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.error,
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
  section: {},
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarTouch: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  genderText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.primary,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  bloodButton: {
    width: '22%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bloodButtonActive: {
    borderColor: '#E63946',
    backgroundColor: '#E6394615',
  },
  bloodText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  bloodTextActive: {
    color: '#E63946',
  },
  datePickerTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dateText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  dateTextPlaceholder: {
    color: colors.textSecondary,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  phoneContainerError: {
    borderColor: colors.error,
  },
  phoneInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    height: '100%',
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: spacing.sm,
    marginRight: spacing.sm,
  },
  flagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  errorText: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
  },
});

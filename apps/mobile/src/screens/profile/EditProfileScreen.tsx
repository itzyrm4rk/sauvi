import { useNavigation } from '@react-navigation/native';
import { CAMEROON_CITIES } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Info, Mail, MapPin, Phone, User } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Toast } from '../../components/ui/toastConfig';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useGetMeQuery, useUpdateProfileMutation } from '../../store/api/usersApi';

export function EditProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { data: userResp, isLoading: isLoadingUser } = useGetMeQuery();
  const user = userResp?.data;
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      const cleanPhone = (user.phone || '').replace(/^\+237/, '').trim();
      setPhone(cleanPhone);
      setCity(user.city || '');
    }
  }, [user]);

  const filteredCities = useMemo(() => {
    if (!city) return CAMEROON_CITIES;
    return CAMEROON_CITIES.filter((c) => c.toLowerCase().includes(city.toLowerCase()));
  }, [city]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = 'Veuillez saisir une adresse email valide';
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 9) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    if (!city.trim() || city.trim().length < 2) {
      newErrors.city = 'Veuillez sélectionner ou saisir votre ville';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const phoneDigits = phone.replace(/\D/g, '');
      const formattedPhone = phoneDigits.startsWith('237')
        ? `+${phoneDigits}`
        : `+237${phoneDigits}`;

      await updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        city: city.trim(),
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Profil mis à jour',
        text2: 'Vos informations ont été enregistrées avec succès.',
      });

      navigation.goBack();
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const apiError = err as { status?: number; data?: { message?: string } };
      const message = apiError?.data?.message || 'Impossible de mettre à jour le profil.';

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: message,
      });
    }
  };

  if (isLoadingUser && !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Modifier mon profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.xxl) },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <Text style={styles.sectionDesc}>
          Modifiez vos informations personnelles. Votre ville et votre groupe sanguin permettent de
          vous notifier pour les alertes SOS compatibles.
        </Text>

        {/* Nom */}
        <View style={styles.fieldGroup}>
          <Input
            label='Nom complet *'
            placeholder='Entrez votre nouveau nom'
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            error={errors.name}
            leftIcon={<User size={18} color={colors.textSecondary} />}
          />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Input
            label='Adresse email *'
            placeholder='nouveau@email.com'
            keyboardType='email-address'
            autoCapitalize='none'
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError('email');
            }}
            error={errors.email}
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
          />
        </View>

        {/* Téléphone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Numéro de téléphone *</Text>
          <View
            style={[
              styles.phoneInputContainer,
              Boolean(errors.phone) && styles.phoneInputContainerError,
            ]}
          >
            <View style={styles.flagBadge}>
              <Text style={styles.flagText}>🇨🇲 +237</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder='6XX XXX XXX'
              placeholderTextColor={colors.textSecondary}
              keyboardType='phone-pad'
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                clearError('phone');
              }}
            />
            <Phone size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        {/* Ville */}
        <View style={[styles.fieldGroup, { zIndex: 1000 }]}>
          <Input
            label='Ville de résidence *'
            placeholder='Douala, Yaoundé...'
            value={city}
            onChangeText={(text) => {
              setCity(text);
              setShowCityDropdown(true);
              clearError('city');
            }}
            onFocus={() => setShowCityDropdown(true)}
            error={errors.city}
            leftIcon={<MapPin size={18} color={colors.textSecondary} />}
          />
          {showCityDropdown && filteredCities.length > 0 && (
            <View style={styles.dropdown}>
              <ScrollView
                nestedScrollEnabled
                keyboardShouldPersistTaps='handled'
                style={{ maxHeight: 180 }}
              >
                {filteredCities.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCity(c);
                      setShowCityDropdown(false);
                      clearError('city');
                    }}
                  >
                    <Text style={styles.dropdownText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Note informative */}
        <View style={styles.ruleCard}>
          <Info size={20} color={colors.info} style={{ marginTop: 2 }} />
          <Text style={styles.ruleText}>
            Le groupe sanguin et le genre ne peuvent pas être modifiés directement depuis
            l'application pour des raisons de traçabilité médicale.
          </Text>
        </View>

        <View style={styles.btnContainer}>
          <Button
            label='Enregistrer les modifications'
            onPress={handleSave}
            loading={isUpdating}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  phoneInputContainerError: {
    borderColor: colors.error,
  },
  flagBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.card,
    marginRight: spacing.sm,
  },
  flagText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  ruleCard: {
    backgroundColor: '#EAF3FF',
    borderRadius: borderRadius.card,
    padding: spacing.lg,
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
    fontSize: typography.fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
  btnContainer: {
    marginTop: spacing.md,
  },
});

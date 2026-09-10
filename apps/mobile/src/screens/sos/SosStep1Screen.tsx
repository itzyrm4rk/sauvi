import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatBloodType } from '@sauvi/shared';
import { AlertTriangle, Droplets, Minus, Plus, RotateCcw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BloodTypeGrid } from '../../components/sos/BloodTypeGrid';
import { Button, Card } from '../../components/ui';
import { ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import type { SosPriority, SosStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<SosStackParamList, typeof ROUTES.SOS.STEP1>;
type BloodType = SosStackParamList[typeof ROUTES.SOS.STEP2]['bloodTypeNeeded'];

const VALID_BLOOD_TYPES: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

function normalizeBloodType(raw?: string | null): BloodType | null {
  if (!raw) return null;
  const formatted = formatBloodType(raw);
  return VALID_BLOOD_TYPES.includes(formatted as BloodType) ? (formatted as BloodType) : null;
}

const PRIORITY_OPTIONS: {
  value: SosPriority;
  label: string;
  description: string;
  color: string;
  backgroundColor: string;
}[] = [
  {
    value: 'preventif',
    label: 'Préventif',
    description: 'Besoin planifié, mobilisation douce. Expiration automatique après 10 jours.',
    color: colors.warning,
    backgroundColor: '#FFF4E2',
  },
  {
    value: 'urgence_vitale',
    label: 'Urgence vitale',
    description: 'Alerte prioritaire immédiate. Expiration automatique après 72h (3 jours).',
    color: colors.primary,
    backgroundColor: colors.primaryLight,
  },
];

export function SosStep1Screen({ navigation, route }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const initialData = route.params?.initialData;

  const [bloodTypeNeeded, setBloodTypeNeeded] = useState<BloodType | null>(
    normalizeBloodType(initialData?.bloodTypeNeeded),
  );
  const [unitsNeeded, setUnitsNeeded] = useState(initialData?.unitsNeeded || 1);
  const [priority, setPriority] = useState<SosPriority>(initialData?.priority || 'preventif');

  // Met à jour l'état même si l'écran était déjà monté en mémoire dans la pile d'onglets
  useEffect(() => {
    if (route.params?.initialData) {
      const data = route.params.initialData;
      if (data.bloodTypeNeeded) {
        setBloodTypeNeeded(normalizeBloodType(data.bloodTypeNeeded));
      }
      if (data.unitsNeeded) {
        setUnitsNeeded(data.unitsNeeded);
      }
      if (data.priority) {
        setPriority(data.priority);
      }
    }
  }, [route.params?.initialData]);

  const selectedPriority = PRIORITY_OPTIONS.find((option) => option.value === priority);

  const goNext = (): void => {
    if (!bloodTypeNeeded) return;

    navigation.navigate(ROUTES.SOS.STEP2, {
      bloodTypeNeeded,
      unitsNeeded,
      priority,
      ...(initialData?.hospitalName ? { initialHospitalName: initialData.hospitalName } : {}),
      ...(initialData?.hospitalAddress
        ? { initialHospitalAddress: initialData.hospitalAddress }
        : {}),
      ...(initialData?.latitude !== undefined ? { initialLatitude: initialData.latitude } : {}),
      ...(initialData?.longitude !== undefined ? { initialLongitude: initialData.longitude } : {}),
      ...(initialData?.city ? { initialCity: initialData.city } : {}),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top + spacing.sm, spacing.xxl) },
      ]}
    >
      {initialData && (
        <View style={styles.relaunchBanner}>
          <RotateCcw size={16} color={colors.primary} />
          <Text style={styles.relaunchBannerText}>
            Formulaire pré-rempli depuis votre alerte précédente. Modifiez les champs si nécessaire.
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Quel sang recherchez-vous ?</Text>
        <Text style={styles.subtitle}>
          Indiquez le groupe sanguin et le nombre d'unités nécessaires.
        </Text>
        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>Étape 1/3</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '33%' }]} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Groupe sanguin</Text>
        <BloodTypeGrid selectedBloodType={bloodTypeNeeded} onSelect={setBloodTypeNeeded} />
      </View>

      <Card style={styles.stepperCard}>
        <View style={styles.stepperHeader}>
          <View>
            <Text style={styles.sectionTitle}>Nombre d'unité</Text>
            <Text style={styles.muted}>Minimum 1, maximum 20</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setUnitsNeeded((value) => Math.max(1, value - 1))}
              style={styles.stepperButton}
            >
              <Minus color={colors.textPrimary} size={18} />
            </Pressable>
            <Text style={styles.units}>{unitsNeeded}</Text>
            <Pressable
              onPress={() => setUnitsNeeded((value) => Math.min(20, value + 1))}
              style={styles.stepperButton}
            >
              <Plus color={colors.textPrimary} size={18} />
            </Pressable>
          </View>
        </View>

        {/* Info médicale dynamique */}
        <View style={styles.medicalInfoBox}>
          <Droplets size={16} color={colors.primary} />
          <Text style={styles.medicalInfoText}>
            {unitsNeeded === 1
              ? "1 unité = 1 poche (~450 ml) issue d'un seul donneur."
              : `${unitsNeeded} unités = ${unitsNeeded} poches (~${(unitsNeeded * 0.45).toFixed(2)} L). Il faudra mobiliser ${unitsNeeded} donneurs distincts (1 poche max par donneur).`}
          </Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Priorité</Text>
        <View style={styles.priorityToggle}>
          {PRIORITY_OPTIONS.map((option) => {
            const selected = option.value === priority;
            return (
              <Pressable
                key={option.value}
                onPress={() => setPriority(option.value)}
                style={[
                  styles.priorityButton,
                  selected
                    ? { backgroundColor: option.backgroundColor, borderColor: option.color }
                    : undefined,
                ]}
              >
                <Text
                  style={[styles.priorityLabel, selected ? { color: option.color } : undefined]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          style={[
            styles.priorityInfo,
            {
              borderColor: selectedPriority?.color ?? colors.border,
              backgroundColor: selectedPriority?.backgroundColor ?? colors.card,
            },
          ]}
        >
          <AlertTriangle color={selectedPriority?.color ?? colors.warning} size={18} />
          <Text style={styles.priorityDescription}>{selectedPriority?.description}</Text>
        </View>
      </View>

      <Button
        label='Suivant'
        fullWidth
        disabled={!bloodTypeNeeded}
        onPress={goNext}
        style={styles.cta}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
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
  stepText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.primary,
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
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  stepperCard: {
    padding: spacing.lg,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  muted: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  units: {
    minWidth: 32,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary,
  },
  priorityToggle: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: borderRadius.button,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  priorityButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.transparent,
  },
  priorityLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  priorityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.input,
    borderWidth: 1,
  },
  priorityDescription: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: colors.textPrimary,
  },
  cta: {
    marginTop: spacing.sm,
  },
  relaunchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.2)',
  },
  relaunchBannerText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    lineHeight: typography.lineHeight.xs,
  },
  medicalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEECEC',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.input,
    marginTop: spacing.sm,
  },
  medicalInfoText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    lineHeight: 16,
  },
});

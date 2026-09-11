import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Hospital,
  MapPin,
  Pencil,
} from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card } from '../../components/ui';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/toastConfig';
import type { ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useCreateSosMutation, useEstimateDonorsQuery } from '../../store/api/sosApi';
import type { SosStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<SosStackParamList, typeof ROUTES.SOS.CONFIRM>;

export function SosConfirmScreen({ navigation, route }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [createSos, { isLoading }] = useCreateSosMutation();
  const [activeAction, setActiveAction] = useState<'direct' | 'flyer' | null>(null);
  const isSubmittingRef = useRef(false);

  const { data: estimateData, isLoading: isLoadingEstimate } = useEstimateDonorsQuery({
    bloodTypeNeeded: route.params.bloodTypeNeeded,
    city: route.params.city,
  });

  const donorEstimate = estimateData?.data?.estimatedDonors ?? 0;
  const isUrgent = route.params.priority === 'urgence_vitale';

  const launchSos = async (generateFlyer: boolean) => {
    if (isSubmittingRef.current || isLoading) return;
    isSubmittingRef.current = true;
    setActiveAction(generateFlyer ? 'flyer' : 'direct');

    try {
      const result = await createSos(route.params).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: 'success',
        text1: 'Alerte SOS diffusée !',
        text2: 'Les donneurs compatibles aux alentours ont été notifiés.',
      });

      if (generateFlyer) {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'SosDashboard', params: { sosId: result.data.id } },
            { name: 'SosFlyer', params: { sosId: result.data.id } },
          ],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SosDashboard', params: { sosId: result.data.id } }],
        });
      }
    } catch (error: unknown) {
      isSubmittingRef.current = false;
      setActiveAction(null);
      const msg =
        (error as { data?: { message?: string } })?.data?.message ||
        "Impossible de lancer le SOS pour l'instant.";

      if (msg.toLowerCase().includes('actif existe')) {
        Toast.show({
          type: 'info',
          text1: 'Alerte déjà active',
          text2: 'Vous avez déjà un SOS en cours. Redirection vers votre tableau de bord.',
        });
        navigation.reset({
          index: 0,
          routes: [{ name: 'SosIndex' }],
        });
        return;
      }

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: msg,
      });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top + spacing.sm, spacing.xxl) },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Vérifiez les détails avant de diffuser l'alerte!</Text>
        <Text style={styles.subtitle}>
          Veuillez confirmer les informations avant de diffuser le SOS.
        </Text>
        <View style={styles.progressContainer}>
          <Text style={styles.stepText}>Étape 3/3</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '100%' }]} />
          </View>
        </View>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Droplet color={colors.primary} size={22} />
          <View style={styles.summaryText}>
            <Text style={styles.label}>Groupe sanguin requis</Text>
            <Text style={styles.value}>{route.params.bloodTypeNeeded}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <AlertCircle color={colors.primary} size={22} />
          <View style={styles.summaryText}>
            <Text style={styles.label}>Priorité</Text>
            <Text style={styles.value}>
              {isUrgent ? 'Urgence vitale' : 'Préventif'} · {route.params.unitsNeeded} poche(s)
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Hospital color={colors.primary} size={22} />
          <View style={styles.summaryText}>
            <Text style={styles.label}>Hôpital</Text>
            <Text style={styles.value}>{route.params.hospitalName}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <MapPin color={colors.primary} size={22} />
          <View style={styles.summaryText}>
            <Text style={styles.label}>Ville</Text>
            <Text style={styles.value}>{route.params.city}</Text>
          </View>
        </View>
      </Card>

      {/* SECTION ESTIMATION SOUS FORMAT RULECARD */}
      {isLoadingEstimate ? (
        <View style={[styles.ruleCard, styles.ruleCardLoading]}>
          <Skeleton width={20} height={20} borderRadius={10} />
          <Skeleton width='80%' height={18} />
        </View>
      ) : donorEstimate > 0 ? (
        <View style={[styles.ruleCard, styles.ruleCardSuccess]}>
          <CheckCircle2 color={colors.success} size={20} style={{ marginTop: 2 }} />
          <View style={styles.ruleCardContent}>
            <Text style={styles.ruleCardTitleSuccess}>Donneurs disponibles</Text>
            <Text style={styles.ruleCardTextSuccess}>
              ~{donorEstimate} donneur{donorEstimate > 1 ? 's' : ''} compatible
              {donorEstimate > 1 ? 's' : ''} estimé{donorEstimate > 1 ? 's' : ''} dans cette zone.{' '}
              Tous les donneurs compatibles et éligibles de la zone seront notifiés.
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.ruleCard, styles.ruleCardWarning]}>
          <AlertTriangle color={colors.warning} size={20} style={{ marginTop: 2 }} />
          <View style={styles.ruleCardContent}>
            <Text style={styles.ruleCardTitleWarning}>Aucun donneur estimé à proximité</Text>
            <Text style={styles.ruleCardTextWarning}>
              Aucun donneur compatible n'est actuellement inscrit dans cette zone. Vous pouvez
              diffuser le SOS et générer un flyer pour le partager sur vos réseaux (WhatsApp, etc.).
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {!isLoadingEstimate && donorEstimate === 0 ? (
          <>
            <Button
              label='Diffuser le SOS maintenant'
              fullWidth
              loading={isLoading && activeAction === 'direct'}
              disabled={isLoading}
              onPress={() => launchSos(false)}
              style={styles.launchButton}
            />
            <Button
              label='Diffuser et générer le flyer'
              variant='outline'
              fullWidth
              loading={isLoading && activeAction === 'flyer'}
              disabled={isLoading}
              onPress={() => launchSos(true)}
              style={styles.launchButton}
            />
          </>
        ) : (
          <Button
            label='Diffuser le SOS maintenant'
            fullWidth
            loading={isLoading && activeAction === 'direct'}
            disabled={isLoading}
            onPress={() => launchSos(false)}
            style={styles.launchButton}
          />
        )}
        <Button
          label='Modifier le SOS'
          variant='ghost'
          fullWidth
          disabled={isLoading}
          onPress={() => navigation.goBack()}
          leftIcon={<Pencil color={colors.primary} size={18} />}
        />
      </View>
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
  summaryCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryText: {
    flex: 1,
  },
  label: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  ruleCard: {
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  ruleCardLoading: {
    backgroundColor: colors.white,
    borderLeftColor: colors.border,
    alignItems: 'center',
  },
  ruleCardSuccess: {
    backgroundColor: '#EAF7F0',
    borderLeftColor: colors.success,
  },
  ruleCardWarning: {
    backgroundColor: '#FFF7E6',
    borderLeftColor: colors.warning,
  },
  ruleCardContent: {
    flex: 1,
  },
  ruleCardTitleSuccess: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginBottom: 2,
  },
  ruleCardTextSuccess: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ruleCardTitleWarning: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    marginBottom: 2,
  },
  ruleCardTextWarning: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.md,
  },
  launchButton: {
    borderRadius: borderRadius.button,
  },
});

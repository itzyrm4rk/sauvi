import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Link as LinkIcon, Share2 } from 'lucide-react-native';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { SosFlyer } from '../../components/sos/SosFlyer';
import { colors, spacing, typography } from '../../constants/theme';
import { useFlyer } from '../../hooks/useFlyer';
import { useGetSosByIdQuery } from '../../store/api/sosApi';
import type { SosStackParamList } from '../../types/navigation.types';

export function SosFlyerScreen() {
  const route = useRoute<RouteProp<SosStackParamList, 'SosFlyer'>>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { sosId } = route.params;

  const { data: response, isLoading } = useGetSosByIdQuery({ sosId });
  const sosData = response?.data;

  const { viewShotRef, shareFlyer, isCapturing } = useFlyer();

  if (isLoading || !sosData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flyer SOS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Aperçu du flyer</Text>
        <Text style={styles.sectionDesc}>
          Partagez ce flyer pour toucher un maximum de donneurs potentiels
        </Text>

        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <SosFlyer
            bloodType={sosData.bloodTypeNeeded}
            unitsNeeded={sosData.unitsNeeded}
            priority={sosData.priority as 'preventif' | 'urgence_vitale'}
            hospitalName={sosData.hospitalName}
            city={sosData.city}
          />
        </ViewShot>
      </ScrollView>

      {/* Actions de partage */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={() => shareFlyer()}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Share2 size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
              <Text style={styles.shareText}>Partager le flyer (Image)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.linkButton]}
          onPress={async () => {
            const shareUrl = `https://sauvi-landing.vercel.app/sos/${sosId}`;
            await Share.share({
              title: `Urgence Don de sang ${sosData.bloodTypeNeeded}`,
              message: `🚨 URGENCE VITALE SAUVI : Besoin urgent de ${sosData.unitsNeeded} unité(s) de sang ${sosData.bloodTypeNeeded} à ${sosData.hospitalName} (${sosData.city}).\n\nAidez-nous ou partagez : ${shareUrl}`,
              url: shareUrl,
            });
          }}
        >
          <LinkIcon size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <Text style={styles.linkText}>Partager le lien avec message</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: spacing.md,
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
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  actionsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  shareButton: {
    backgroundColor: colors.primary,
  },
  shareText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
  },
  linkButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 0,
  },
  linkText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
  },
});

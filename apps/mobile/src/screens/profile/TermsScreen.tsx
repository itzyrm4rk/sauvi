import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export function TermsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions Générales</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Rôle de l'application</Text>
          <Text style={styles.text}>
            SAUVI est une plateforme de mise en relation. Nous{' '}
            <Text style={styles.bold}>ne sommes pas</Text> un prestataire médical. Les actes de
            prélèvement et de transfusion sont sous l'entière responsabilité des établissements
            hospitaliers et des professionnels de santé qualifiés.
          </Text>

          <Text style={styles.sectionTitle}>2. Responsabilités du donneur</Text>
          <Text style={styles.text}>
            En rejoignant une liste d'attente pour un SOS, vous vous engagez à :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Être honnête sur votre identité et votre groupe sanguin.
            </Text>
            <Text style={styles.bulletItem}>
              • Vous rendre à l'hôpital indiqué si vous êtes sélectionné par le demandeur.
            </Text>
            <Text style={styles.bulletItem}>
              • Annuler votre participation dans l'application si vous avez un empêchement.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>3. Comportement et abus</Text>
          <Text style={styles.text}>
            La création de fausses alertes SOS (spam, plaisanterie) est{' '}
            <Text style={styles.bold}>strictement interdite</Text>. Le don de sang est un sujet
            critique. Tout abus entraînera un bannissement définitif et immédiat de notre
            plateforme.
          </Text>

          <Text style={styles.sectionTitle}>4. Contact d'urgence</Text>
          <Text style={styles.text}>
            L'application facilite la communication avec les concernés, mais ne remplace pas les
            numéros d'urgence nationaux. En cas d'urgence médicale grave, appelez immédiatement les
            services compétents.
          </Text>
        </View>

        <Text style={styles.lastUpdated}>Dernière mise à jour : 30 Juillet 2026</Text>
      </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  bulletList: {
    paddingLeft: spacing.sm,
    gap: spacing.xs,
  },
  bulletItem: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  lastUpdated: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});

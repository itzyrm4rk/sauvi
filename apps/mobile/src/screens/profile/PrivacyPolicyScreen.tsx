import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleEmailPress = () => {
    Linking.openURL(
      'mailto:sauvi.notifications@gmail.com?subject=Demande%20de%20suppression%20de%20compte%20SAUVI',
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Données collectées</Text>
          <Text style={styles.text}>
            Pour fonctionner, SAUVI collecte les informations suivantes : votre nom, adresse email,
            numéro de téléphone, groupe sanguin, date de naissance, et votre ville de résidence. Ces
            données sont nécessaires pour vous mettre en relation avec des demandeurs ou donneurs.
          </Text>

          <Text style={styles.sectionTitle}>2. Utilisation de vos données</Text>
          <Text style={styles.text}>
            Vos données sont utilisées exclusivement dans le cadre du don de sang :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Vous envoyer des notifications (FCM) pour des SOS pertinents.
            </Text>
            <Text style={styles.bulletItem}>
              • Calculer votre éligibilité (période de carence).
            </Text>
            <Text style={styles.bulletItem}>
              • Permettre le contact (téléphone, chat) avec le demandeur si vous participez à un
              don.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>3. Partage des données</Text>
          <Text style={styles.text}>
            Nous ne revendons <Text style={styles.bold}>jamais</Text> vos données à des tiers. Vos
            informations de contact (téléphone, nom) ne sont partagées avec un demandeur de sang
            <Text style={styles.bold}> que si</Text> vous décidez de rejoindre sa liste d'attente
            pour l'aider.
          </Text>

          <Text style={styles.sectionTitle}>4. Vos droits et suppression des données</Text>
          <Text style={styles.text}>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données
            personnelles. Pour demander la suppression définitive de votre compte et de l'ensemble
            de vos données, il vous suffit d'adresser une demande à notre support à{' '}
            <Text style={styles.link} onPress={handleEmailPress}>
              sauvi.notifications@gmail.com
            </Text>{' '}
            ou via la section Aide & Support. Votre demande sera traitée dans un délai maximum de 48
            heures.
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
    paddingTop: spacing.xxl,
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
  link: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
    textDecorationLine: 'underline',
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

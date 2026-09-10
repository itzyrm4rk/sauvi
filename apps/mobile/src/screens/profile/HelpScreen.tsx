import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

const FAQS = [
  {
    question: 'Comment fonctionne SAUVI ?',
    answer:
      "SAUVI met en relation les personnes ayant un besoin urgent de sang (les demandeurs) avec des donneurs compatibles et éligibles situés à proximité. Lorsqu'un SOS est créé, les donneurs reçoivent une notification et peuvent s'inscrire sur la file d'attente.",
  },
  {
    question: 'Puis-je annuler ma participation ?',
    answer:
      "Oui, vous pouvez annuler votre participation à tout moment avant que le don ne soit confirmé par le demandeur. Il suffit de vous rendre sur le détail du SOS et d'annuler votre inscription.",
  },
  {
    question: 'Comment mon don de sang est-il validé et comptabilisé ?',
    answer:
      "Une fois votre don effectué au service de transfusion de l'hôpital, le demandeur valide votre passage depuis son tableau de bord. Vos points de réputation et vos badges sont immédiatement crédités sur votre profil, et votre période de repos s'enclenche.",
  },
  {
    question: 'Le don de sang est-il rémunéré sur SAUVI ?',
    answer:
      'Non, SAUVI est une plateforme solidaire et bénévole. Le don de sang est un acte civique et gratuit. Chaque don vous permet de sauver des vies et de gravir les échelons de réputation au sein de la communauté.',
  },
  {
    question: 'Quand serai-je de nouveau éligible au don ?',
    answer:
      "La période de carence médicale est de 56 jours pour les hommes et de 84 jours pour les femmes. L'application calcule automatiquement votre prochaine date d'éligibilité et vous notifiera lorsqu'elle sera atteinte.",
  },
];

export function HelpScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleContactEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      'mailto:sauvi.notifications@gmail.com?subject=Support%20SAUVI%20-%20Assistance',
    );
  };

  const handleContactWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(
      'https://wa.me/237697200343?text=Bonjour%20l%27%C3%A9quipe%20SAUVI%2C%20j%27ai%20besoin%20d%27assistance',
    );
  };

  const handleCallEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL('tel:+237697200343');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête informatif */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Headphones size={28} color={colors.primary} />
          </View>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text>
            <Text style={styles.heroSubtitle}>
              Retrouvez les réponses aux questions courantes ou contactez directement notre équipe
              d'assistance.
            </Text>
          </View>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>
        <View style={styles.faqContainer}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <View key={faq.question} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => toggleAccordion(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  {isExpanded ? (
                    <ChevronUp size={20} color={colors.primary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Section Canaux de contact améliorée */}
        <Text style={styles.sectionTitle}>Contacter notre équipe</Text>
        <View style={styles.contactList}>
          {/* WhatsApp Support */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleContactWhatsApp}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: '#25D36615' }]}>
              <MessageCircle size={22} color='#25D366' />
            </View>
            <View style={styles.contactInfo}>
              <View style={styles.contactHeaderRow}>
                <Text style={styles.contactTitle}>WhatsApp Support</Text>
                <View style={styles.badgeRapid}>
                  <Text style={styles.badgeRapidText}>Recommandé</Text>
                </View>
              </View>
              <Text style={styles.contactSub}>Discussion instantanée avec un conseiller</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Email Support */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleContactEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: `${colors.primary}15` }]}>
              <Mail size={22} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email d'assistance</Text>
              <Text style={styles.contactSub}>Réponse sous 24h</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Appel d'assistance */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleCallEmergency}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconCircle, { backgroundColor: '#3B82F615' }]}>
              <Phone size={22} color='#3B82F6' />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Ligne directe SAUVI</Text>
              <Text style={styles.contactSub}>Du lundi au samedi (10h - 18h)</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Note de sécurité */}
        <View style={styles.securityNote}>
          <ShieldCheck size={18} color={colors.textSecondary} />
          <Text style={styles.securityNoteText}>
            En cas d'urgence médicale vitale immédiate, contactez directement les services d'urgence
            ou l'hôpital le plus proche.
          </Text>
        </View>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  faqContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    paddingRight: spacing.sm,
    lineHeight: 20,
  },
  faqAnswerContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: `${colors.card}40`,
  },
  faqAnswer: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  contactList: {
    gap: spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  contactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contactTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  badgeRapid: {
    backgroundColor: '#25D36615',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeRapidText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 10,
    color: '#128C7E',
  },
  contactSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.card}60`,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  securityNoteText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});

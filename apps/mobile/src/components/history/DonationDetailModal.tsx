import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import {
  Award,
  Building2,
  Calendar,
  Clock,
  Droplets,
  MapPin,
  MessageSquare,
  ShieldCheck,
  User,
  X,
} from 'lucide-react-native';
import { memo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import type { DonationHistoryItem } from '../../store/api/usersApi';

export interface DonationDetailModalProps {
  visible: boolean;
  donation: DonationHistoryItem | null;
  onClose: () => void;
  onOpenChat?: (params: {
    sosId: string;
    contactId: string;
    contactName: string;
    contactPhone?: string | undefined;
  }) => void;
}

function formatDateFull(dateStr: string | null): string {
  if (!dateStr) return 'Date non spécifiée';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DonationDetailModal = memo(function DonationDetailModal({
  visible,
  donation,
  onClose,
  onOpenChat,
}: DonationDetailModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  if (!donation) {
    return <></>;
  }

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const donTime = formatTime(donation.date);

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={handleClose} />

        <View
          style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          {/* DRAG HANDLE */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* HEADER AVEC BOUTON FERMER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badgeIconHeader}>
                <Droplets size={18} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Attestation de don</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* CARTE POINTS DE RÉPUTATION GAGNÉS */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardIconWrapper}>
                <Award size={28} color='#16A34A' />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle}>+{donation.pointsEarned} points SAUVI</Text>
                <Text style={styles.rewardSubtitle}>
                  Points de solidarité crédités sur votre profil
                </Text>
              </View>
            </View>

            {/* DÉTAILS DU DON */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Informations du don</Text>

              {/* DATE + HEURE */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Date du don</Text>
                  <Text style={styles.infoValue}>{formatDateFull(donation.date)}</Text>
                  {donTime ? (
                    <View style={styles.timeRow}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={styles.timeText}>{donTime}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              {/* HÔPITAL */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Building2 size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hôpital ou Centre médical</Text>
                  <Text style={styles.infoValue}>{donation.hospitalName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* VILLE */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MapPin size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ville</Text>
                  <Text style={styles.infoValue}>{donation.city}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* GROUPE SANGUIN */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Droplets size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Groupe sanguin donné</Text>
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>
                      {formatBloodType(donation.bloodTypeNeeded)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CARTE DEMANDEUR (si disponible) */}
            {donation.requesterName || donation.sosCreatedAt ? (
              <View style={styles.requesterCard}>
                <Text style={[styles.sectionTitle, { color: '#7C3AED' }]}>
                  Informations du demandeur
                </Text>

                {donation.requesterName ? (
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                      <User size={18} color='#7C3AED' />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Nom du demandeur</Text>
                      <Text style={styles.infoValue}>{donation.requesterName}</Text>
                    </View>
                  </View>
                ) : null}

                {donation.bloodTypeNeeded ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                        <Droplets size={18} color='#7C3AED' />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Groupe sanguin demandé</Text>
                        <View style={[styles.bloodBadge, { backgroundColor: '#EDE9FE' }]}>
                          <Text style={[styles.bloodBadgeText, { color: '#7C3AED' }]}>
                            {formatBloodType(donation.bloodTypeNeeded)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : null}

                {donation.sosCreatedAt ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                        <Calendar size={18} color='#7C3AED' />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Date de création du SOS</Text>
                        <Text style={styles.infoValue}>
                          {formatDateFull(donation.sosCreatedAt)}
                        </Text>
                        <View style={styles.timeRow}>
                          <Clock size={12} color={colors.textSecondary} />
                          <Text style={styles.timeText}>{formatTime(donation.sosCreatedAt)}</Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : null}

                {donation.requesterId ? (
                  <>
                    <View style={styles.divider} />
                    <TouchableOpacity
                      style={styles.chatArchiveBtn}
                      onPress={() => {
                        const requesterId = donation.requesterId;
                        if (!requesterId) return;
                        handleClose();
                        onOpenChat?.({
                          sosId: donation.sosId,
                          contactId: requesterId,
                          contactName: donation.requesterName || 'Demandeur',
                          ...(donation.requesterPhone
                            ? { contactPhone: donation.requesterPhone }
                            : {}),
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={16} color='#7C3AED' />
                      <Text style={styles.chatArchiveBtnText}>
                        Consulter la discussion archivée
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            ) : null}

            {/* VALIDATION OFFICIELLE */}
            <View style={styles.validCard}>
              <ShieldCheck size={20} color={colors.success} style={{ marginTop: 2 }} />
              <View style={styles.validContent}>
                <Text style={styles.validTitle}>Don certifié conforme</Text>
                <Text style={styles.validText}>
                  Ce don a été validé à l'hôpital par l'équipe soignante et confirmé par le
                  demandeur. Merci pour votre engagement vital.
                </Text>
              </View>
            </View>

            {/* BOUTON FERMER */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeIconHeader: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  rewardIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    color: '#15803D',
  },
  rewardSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: '#166534',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  requesterCard: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  bloodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEECEC',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  bloodBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  validCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: borderRadius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  validContent: {
    flex: 1,
  },
  validTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    color: '#1D4ED8',
  },
  validText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 2,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  closeButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  chatArchiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.input,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chatArchiveBtnText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
    color: '#7C3AED',
  },
});

import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Droplets,
  MapPin,
  MessageSquare,
  Radio,
  Siren,
  User,
  Users,
  X,
} from 'lucide-react-native';
import { memo, useMemo } from 'react';
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
import type { SosHistoryItem } from '../../store/api/usersApi';

export interface SosHistoryModalProps {
  visible: boolean;
  sos: SosHistoryItem | null;
  onClose: () => void;
  onNavigateToDashboard: (sosId: string) => void;
  onOpenChat?: (params: {
    sosId: string;
    contactId: string;
    contactName: string;
    contactPhone?: string | undefined;
  }) => void;
}

function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Date non spécifiée';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SosHistoryModal = memo(function SosHistoryModal({
  visible,
  sos,
  onClose,
  onNavigateToDashboard,
  onOpenChat,
}: SosHistoryModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // Derived values — computed with safe fallbacks so hooks run unconditionally
  const isActive = sos?.status === 'active';
  const unitsNeeded = sos?.unitsNeeded || 1;
  const isFulfilled =
    sos?.status === 'fulfilled' ||
    (sos?.status === 'closed' && (sos?.donationsCount ?? 0) >= unitsNeeded);
  const isClosedEarly = sos?.status === 'closed' && (sos?.donationsCount ?? 0) < unitsNeeded;
  const isExpired = sos?.status === 'expired';

  const statusInfo = useMemo(() => {
    if (isActive) {
      return {
        label: 'Alerte en cours',
        subtitle: 'Des donneurs peuvent encore rejoindre la liste',
        color: '#15803D',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        Icon: Radio,
      };
    }
    if (isFulfilled) {
      return {
        label: 'Objectif atteint',
        subtitle: `${sos.donationsCount} poche${sos.donationsCount > 1 ? 's' : ''} sur ${unitsNeeded} collectée${sos.donationsCount > 1 ? 's' : ''}`,
        color: '#15803D',
        bg: '#F0FDF4',
        border: '#BBF7D0',
        Icon: CheckCircle2,
      };
    }
    if (isClosedEarly) {
      return {
        label: 'Clôturé par le demandeur',
        subtitle:
          sos.donationsCount > 0
            ? `Clôture anticipée (${sos.donationsCount}/${unitsNeeded} poche collectée)`
            : 'Alerte fermée manuellement avant validation d’un don',
        color: '#4B5563',
        bg: '#F3F4F6',
        border: '#E5E7EB',
        Icon: CheckCircle2,
      };
    }
    if (isExpired) {
      return {
        label: 'Délai expiré',
        subtitle: 'Le délai de 48h a expiré sans complétion',
        color: '#B45309',
        bg: '#FFFBEB',
        border: '#FDE68A',
        Icon: Clock,
      };
    }
    return {
      label: 'Alerte clôturée',
      subtitle: 'Cette alerte est archivée',
      color: '#6B7280',
      bg: '#F3F4F6',
      border: '#E5E7EB',
      Icon: CheckCircle2,
    };
  }, [isActive, isFulfilled, isClosedEarly, isExpired, sos?.donationsCount, unitsNeeded]);

  // ── Early return AFTER all hooks ──────────────────────────────────────────
  if (!sos) {
    return <></>;
  }

  const StatusIcon = statusInfo.Icon;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleDashboard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onNavigateToDashboard(sos.id);
  };

  const createdTime = formatTime(sos.createdAt);
  const closedTime = sos.closedAt ? formatTime(sos.closedAt) : null;

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
                <Siren size={18} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Fiche du SOS</Text>
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
            {/* CARTE STATUT DU SOS */}
            <View
              style={[
                styles.statusCard,
                { backgroundColor: statusInfo.bg, borderColor: statusInfo.border },
              ]}
            >
              <View style={[styles.statusIconWrapper, { backgroundColor: statusInfo.bg }]}>
                <StatusIcon size={24} color={statusInfo.color} />
              </View>
              <View style={styles.statusContent}>
                <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
                <Text style={[styles.statusSubtitle, { color: statusInfo.color }]}>
                  {isActive
                    ? 'Des donneurs peuvent encore rejoindre la liste'
                    : 'Cette alerte est archivée'}
                </Text>
              </View>
            </View>

            {/* DÉTAILS DU SOS */}
            <View style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Détails de l'alerte</Text>

              {/* GROUPE SANGUIN */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Droplets size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Groupe sanguin recherché</Text>
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>
                      {formatBloodType(sos.bloodTypeNeeded)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* HÔPITAL */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Building2 size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Hôpital / Établissement de soins</Text>
                  <Text style={styles.infoValue}>{sos.hospitalName}</Text>
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
                  <Text style={styles.infoValue}>{sos.city}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* DATE DE CRÉATION + HEURE */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Calendar size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Publié le</Text>
                  <Text style={styles.infoValue}>{formatDateFull(sos.createdAt)}</Text>
                  {createdTime ? (
                    <View style={styles.timeRow}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={styles.timeText}>{createdTime}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* DATE DE CLÔTURE si disponible */}
              {sos.closedAt ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                      <CheckCircle2 size={18} color='#6B7280' />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Clôturé le</Text>
                      <Text style={styles.infoValue}>{formatDateFull(sos.closedAt)}</Text>
                      {closedTime ? (
                        <View style={styles.timeRow}>
                          <Clock size={12} color={colors.textSecondary} />
                          <Text style={styles.timeText}>{closedTime}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </>
              ) : null}

              <View style={styles.divider} />

              {/* MOBILISATION */}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Users size={18} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mobilisation enregistrée</Text>
                  <Text style={styles.infoValue}>
                    {sos.donationsCount > 0
                      ? `${sos.donationsCount} / ${unitsNeeded} poche${unitsNeeded > 1 ? 's' : ''} collectée${sos.donationsCount > 1 ? 's' : ''}${sos.donationsCount >= unitsNeeded ? ' (100%)' : ''}`
                      : `0 / ${unitsNeeded} poche collectée`}
                  </Text>
                  {isClosedEarly && (
                    <Text style={[styles.waitlistText, { color: '#6B7280', marginTop: 2 }]}>
                      Clôture manuelle avant complétion des {unitsNeeded} poches
                    </Text>
                  )}
                  {/* Nombre d'inscrits en liste d'attente avec accord grammatical correct */}
                  {sos.waitlistCount !== undefined && sos.waitlistCount > 0 ? (
                    <Text style={styles.waitlistText}>
                      {sos.waitlistCount} personne{sos.waitlistCount > 1 ? 's ont' : ' a'} rejoint
                      la liste d'attente
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* SECTION DONNEURS MOBILISÉS (si SOS clôturé avec un ou plusieurs dons) */}
            {!isActive && ((sos.donors && sos.donors.length > 0) || sos.firstDonorName) ? (
              <View style={styles.donorCard}>
                <Text style={[styles.sectionTitle, { color: '#7C3AED' }]}>
                  {isClosedEarly && sos.donationsCount > 0
                    ? `Dons confirmés avant clôture (${sos.donationsCount})`
                    : sos.donors && sos.donors.length > 1
                      ? `Donneurs mobilisés (${sos.donors.length})`
                      : 'Donneur ayant répondu'}
                </Text>

                {(sos.donors && sos.donors.length > 0
                  ? sos.donors
                  : [
                      {
                        id: sos.firstDonorId || '',
                        name: sos.firstDonorName || 'Donneur',
                        phone: sos.firstDonorPhone,
                        bloodType: sos.firstDonorBloodType,
                      },
                    ]
                ).map((donor, idx) => (
                  <View key={donor.id || String(idx)}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.infoRow}>
                      <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                        <User size={18} color='#7C3AED' />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Nom du donneur</Text>
                        <Text style={styles.infoValue}>{donor.name}</Text>
                      </View>
                    </View>

                    {donor.bloodType ? (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                          <View style={[styles.infoIcon, { backgroundColor: '#EDE9FE' }]}>
                            <Droplets size={18} color='#7C3AED' />
                          </View>
                          <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Groupe sanguin donné</Text>
                            <View style={[styles.bloodBadge, { backgroundColor: '#EDE9FE' }]}>
                              <Text style={[styles.bloodBadgeText, { color: '#7C3AED' }]}>
                                {formatBloodType(donor.bloodType)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {donor.id ? (
                      <>
                        <View style={styles.divider} />
                        <TouchableOpacity
                          style={styles.chatArchiveBtn}
                          onPress={() => {
                            handleClose();
                            onOpenChat?.({
                              sosId: sos.id,
                              contactId: donor.id,
                              contactName: donor.name || 'Donneur',
                              ...(donor.phone ? { contactPhone: donor.phone } : {}),
                            });
                          }}
                          activeOpacity={0.8}
                        >
                          <MessageSquare size={16} color='#7C3AED' />
                          <Text style={styles.chatArchiveBtnText}>
                            Consulter la discussion avec {donor.name}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {!isActive && sos.donationsCount === 0 && (sos.waitlistCount ?? 0) > 0 ? (
              <View
                style={[styles.donorCard, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}
              >
                <Text style={[styles.sectionTitle, { color: '#4B5563' }]}>
                  Volontaires inscrits
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18, marginTop: 4 }}>
                  {sos.waitlistCount} volontaire
                  {(sos.waitlistCount ?? 0) > 1 ? 's s’étaient inscrit(s)' : ' s’était inscrit'} sur
                  la liste d’attente. L’alerte ayant été clôturée par l’auteur sans don validé, ces
                  donneurs ont été libérés.
                </Text>
              </View>
            ) : null}

            {/* BOUTON D'ACTION SELON LE STATUT */}
            {/* Active → bouton tableau de bord */}
            {isActive ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleDashboard}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Gérer le tableau de bord en direct</Text>
                <ArrowRight size={18} color={colors.white} />
              </TouchableOpacity>
            ) : null}

            {/* Inactif mais avec mobilisation enregistrée → consultation en lecture seule */}
            {!isActive &&
            ((sos.waitlistCount && sos.waitlistCount > 0) || sos.donationsCount > 0) ? (
              <TouchableOpacity
                style={styles.archiveDashboardButton}
                onPress={handleDashboard}
                activeOpacity={0.8}
              >
                <Users size={18} color={colors.primary} />
                <Text style={styles.archiveDashboardButtonText}>
                  Voir tous les donneurs mobilisés ({sos.waitlistCount || sos.donationsCount})
                </Text>
              </TouchableOpacity>
            ) : null}

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
    maxHeight: '88%',
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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  statusIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
  },
  statusSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.card,
    padding: spacing.md,
  },
  donorCard: {
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
  waitlistText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
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
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    color: colors.white,
  },
  closeButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
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
  archiveDashboardButton: {
    backgroundColor: '#FEECEC',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  archiveDashboardButtonText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
    color: colors.primary,
  },
});

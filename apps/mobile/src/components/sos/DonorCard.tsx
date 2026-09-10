import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { CheckCircle2, Clock, MapPin, MessageSquare, Phone } from 'lucide-react-native';
import { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../constants/theme';
import { useNativeCall } from '../../hooks/useNativeCall';
import type { DonorWaitlistItem } from '../../store/api/sosApi';
import type { SosStackParamList } from '../../types/navigation.types';
import { PublicProfileModal } from '../profile/PublicProfileModal';

interface DonorCardProps {
  item: DonorWaitlistItem;
  onValidate?: ((donorId: string) => void | Promise<void>) | undefined;
  onConfirmDonation?: ((donorId: string) => void | Promise<void>) | undefined;
  isFamilyDashboard?: boolean;
  sosStatus?: string | undefined;
}

export const DonorCard = memo(function DonorCard({
  item,
  onValidate,
  onConfirmDonation,
  isFamilyDashboard = false,
  sosStatus,
}: DonorCardProps) {
  const { call } = useNativeCall();
  const navigation = useNavigation<NativeStackNavigationProp<SosStackParamList>>();
  const [showProfile, setShowProfile] = useState(false);
  const { donor, status, distanceKm } = item;

  const isSosClosed =
    sosStatus === 'closed' || sosStatus === 'fulfilled' || sosStatus === 'expired';

  const handleCall = () => {
    if (donor.phone) {
      call(donor.phone);
    }
  };

  const handleChat = () => {
    navigation.navigate('Chat', {
      sosId: item.sosId,
      contactId: donor.id,
      contactName: donor.name,
      contactPhone: donor.phone,
      isClosed: isSosClosed,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileClickableArea}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowProfile(true);
          }}
        >
          <View style={styles.avatarContainer}>
            {donor.avatarUrl ? (
              <Image source={{ uri: donor.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{donor.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.bloodTypeBadge}>
              <Text style={styles.bloodTypeText}>{formatBloodType(donor.bloodType)}</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{donor.name}</Text>
            <Text style={styles.userCity}>{donor.city}</Text>
            {isFamilyDashboard && distanceKm != null && (
              <View style={styles.distanceTag}>
                <MapPin size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.distanceText}>À {distanceKm} km</Text>
              </View>
            )}
            {donor.isEligible && (
              <View style={styles.eligibleTag}>
                <CheckCircle2 size={12} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={styles.eligibleText}>Éligible</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {status === 'waiting' && onValidate && (
          <TouchableOpacity style={styles.validateButton} onPress={() => onValidate(donor.id)}>
            <Text style={styles.validateButtonText}>Valider</Text>
          </TouchableOpacity>
        )}
      </View>

      {status === 'validated' && isFamilyDashboard && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryAction,
              isSosClosed && styles.disabledAction,
            ]}
            disabled={isSosClosed}
            onPress={() => !isSosClosed && handleCall()}
          >
            <Phone
              size={18}
              color={isSosClosed ? colors.textSecondary : colors.primary}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={[styles.secondaryActionText, isSosClosed && styles.disabledActionText]}>
              Appeler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={handleChat}
          >
            <MessageSquare size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
            <Text style={styles.secondaryActionText}>
              {isSosClosed ? 'Chat (archivé)' : 'Chat'}
            </Text>
          </TouchableOpacity>

          {onConfirmDonation && !isSosClosed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={() => onConfirmDonation(donor.id)}
            >
              <Text style={styles.primaryActionText}>Confirmer don</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {status === 'donated' && (
        <View style={styles.donatedBanner}>
          <CheckCircle2 size={16} color={colors.white} style={{ marginRight: spacing.xs }} />
          <Text style={styles.donatedText}>Don effectué avec succès</Text>
        </View>
      )}

      {isSosClosed && status !== 'donated' && (
        <View style={styles.releasedBanner}>
          <Clock size={13} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.releasedText}>
            {sosStatus === 'expired'
              ? 'Délai d’urgence expiré • Don non requis'
              : 'Alerte clôturée par le demandeur • Don non requis'}
          </Text>
        </View>
      )}

      {/* MODAL PROFIL PUBLIC */}
      <PublicProfileModal
        visible={showProfile}
        userId={donor.id}
        onClose={() => setShowProfile(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileClickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    color: colors.textSecondary,
  },
  bloodTypeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: colors.white,
  },
  bloodTypeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  userCity: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  eligibleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#E8F5E9', // Light green
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  eligibleText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.success,
  },
  distanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
    color: colors.primary,
  },
  validateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  validateButtonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryAction: {
    backgroundColor: colors.success,
  },
  primaryActionText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryActionText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  donatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  donatedText: {
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
  },
  disabledAction: {
    opacity: 0.45,
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  disabledActionText: {
    color: colors.textSecondary,
  },
  releasedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: spacing.sm,
  },
  releasedText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
});

import { formatBloodType } from '@sauvi/shared';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Droplet, MapPin, Share2 } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import type { SosResponse } from '../../store/api/sosApi';
import { Badge, Card } from '../ui';

interface SosAlertCardProps {
  alert: SosResponse['data'];
  onPress?: () => void;
  onShare?: () => void;
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SosAlertCard = memo(function SosAlertCard({
  alert,
  onPress,
  onShare,
}: SosAlertCardProps): React.JSX.Element {
  const isUrgent = alert.priority === 'urgence_vitale';
  const displayBloodType = formatBloodType(alert.bloodTypeNeeded);
  const timeStr = formatTime(alert.createdAt);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Animated.View
            // @ts-expect-error sharedTransitionTag is valid in Reanimated but types might be outdated
            sharedTransitionTag={`bloodType-${alert.id}`}
            style={styles.bloodTypeBadge}
          >
            <Droplet color={colors.white} size={16} />
            <Text style={styles.bloodTypeText}>{displayBloodType}</Text>
          </Animated.View>
          <Badge
            label={isUrgent ? 'Urgence vitale' : 'Préventif'}
            variant={isUrgent ? 'error' : 'warning'}
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.hospitalName} numberOfLines={1}>
            {alert.hospitalName}
          </Text>
          <View style={styles.locationRow}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text style={styles.locationText}>
              {alert.city} • {alert.unitsNeeded} poche{alert.unitsNeeded > 1 ? 's' : ''} requise
              {alert.unitsNeeded > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.timeWrapper}>
            <Clock size={12} color={colors.textSecondary} />
            <Text style={styles.timeText}>
              {timeStr ? `${timeStr} • ` : ''}Il y a{' '}
              {formatDistanceToNow(new Date(alert.createdAt), { locale: fr })}
            </Text>
          </View>
          {onShare && (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={onShare}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Share2 size={13} color={colors.primary} />
              <Text style={styles.shareBtnText}>Partager</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bloodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    gap: spacing.xs,
  },
  bloodTypeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
    color: colors.white,
  },
  content: {
    gap: spacing.xs,
  },
  hospitalName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shareBtnText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
});

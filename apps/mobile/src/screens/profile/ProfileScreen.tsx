import { formatBloodType } from '@sauvi/shared';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  Award,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Droplets,
  Pencil,
  Settings,
} from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import type React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../app/ProfileNavigator';
import { Avatar, Card } from '../../components/ui';
import { ErrorScreen } from '../../components/ui/ErrorScreen';
import { Skeleton } from '../../components/ui/Skeleton';
import { Toast } from '../../components/ui/toastConfig';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import {
  useGetDonationHistoryQuery,
  useGetMeQuery,
  useGetSosHistoryQuery,
  useUploadAvatarMutation,
} from '../../store/api/usersApi';

type NavProp = NativeStackNavigationProp<ProfileStackParamList>;

interface QuickLinkProps {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  accentColor: string;
  onPress: () => void;
}

function QuickLink({ icon, label, subtitle, accentColor, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity style={linkStyles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[linkStyles.iconBox, { backgroundColor: `${accentColor}1A` }]}>{icon}</View>
      <View style={linkStyles.textBox}>
        <Text style={linkStyles.label}>{label}</Text>
        <Text style={linkStyles.subtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

const linkStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBox: { flex: 1 },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const {
    data: userResponse,
    isLoading: isLoadingUser,
    isError,
    refetch: refetchUser,
  } = useGetMeQuery();
  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const { data: donationsResp, refetch: refetchDons } = useGetDonationHistoryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: sosResp, refetch: refetchSos } = useGetSosHistoryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchUser(), refetchDons(), refetchSos()]);
    setRefreshing(false);
  }, [refetchUser, refetchDons, refetchSos]);

  const user = userResponse?.data;
  const donationsCount = donationsResp?.data?.length ?? 0;
  const sosCount = sosResp?.data?.length ?? 0;

  const historySubtitle = useMemo(() => {
    const donsText = `${donationsCount} don${donationsCount > 1 ? 's' : ''}`;
    const sosText = `${sosCount} SOS`;
    const total = donationsCount + sosCount;
    const plural = total > 1 ? 's' : '';
    return `${donsText} · ${sosText} enregistré${plural}`;
  }, [donationsCount, sosCount]);

  const handleAvatarPress = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permission requise',
        text2: "La permission d'accéder à la galerie est requise pour modifier votre avatar.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (!asset) return;
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type } as unknown as Blob);
      try {
        await uploadAvatar({ formData }).unwrap();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: 'success',
          text1: 'Photo de profil mise à jour',
          text2: 'Votre avatar a été modifié avec succès.',
        });
      } catch (_error) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: "Erreur lors de la mise à jour de l'avatar.",
        });
      }
    }
  };

  if (isError) {
    return <ErrorScreen onRetry={onRefresh} />;
  }

  if (isLoadingUser) {
    return (
      <View style={[styles.container, styles.contentContainer]}>
        <View style={styles.header}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <View style={{ marginLeft: spacing.lg, flex: 1, gap: 8, justifyContent: 'center' }}>
            <Skeleton width='60%' height={24} />
            <Skeleton width='80%' height={16} />
            <Skeleton width='40%' height={20} borderRadius={100} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl }}>
          <Skeleton width='48%' height={100} borderRadius={12} />
          <Skeleton width='48%' height={100} borderRadius={12} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top + spacing.sm, spacing.xxl) },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* HEADER: Avatar & Info */}
      <View style={styles.header}>
        <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
          <Avatar name={user?.name || 'Utilisateur'} size='lg' imageUrl={user?.avatarUrl || null} />
          <View style={styles.cameraIconContainer}>
            {isUploading ? (
              <ActivityIndicator size='small' color={colors.white} />
            ) : (
              <Camera color={colors.white} size={16} />
            )}
          </View>
        </Pressable>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.name || 'Utilisateur SAUVI'}
            </Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Pencil size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            {user?.bloodType
              ? `Groupe ${formatBloodType(user.bloodType)} · ${user.city || ''}`
              : 'Profil donneur / demandeur'}
          </Text>
          <View
            style={[
              styles.eligibilityBadge,
              {
                backgroundColor: user?.isEligible ? '#E7F8F1' : '#FEECEC',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              },
            ]}
          >
            {user?.isEligible ? (
              <Check size={14} color={colors.success} />
            ) : (
              <Clock size={14} color={colors.primary} />
            )}
            <Text
              style={[
                styles.eligibilityText,
                { color: user?.isEligible ? colors.success : colors.primary },
              ]}
            >
              {user?.isEligible ? 'Éligible au don' : 'En carence'}
            </Text>
          </View>
        </View>
      </View>

      {/* STATS */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{donationsCount}</Text>
            <Text style={styles.statLabel}>Dons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.reputationPoints ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sosCount}</Text>
            <Text style={styles.statLabel}>SOS</Text>
          </View>
        </View>
      </Card>

      {/* QUICK LINKS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon espace</Text>
        <View style={styles.linksGroup}>
          <QuickLink
            icon={<Droplets size={22} color={colors.primary} />}
            label='Éligibilité & Carence'
            subtitle={user?.isEligible ? 'Vous êtes éligible' : 'En période de carence'}
            accentColor={colors.primary}
            onPress={() => navigation.navigate('Eligibility')}
          />
          <View style={styles.separator} />
          <QuickLink
            icon={<Award size={22} color='#B8860B' />}
            label='Badges & Réputation'
            subtitle={`${user?.reputationPoints ?? 0} points SAUVI`}
            accentColor='#B8860B'
            onPress={() => navigation.navigate('Badges')}
          />
          <View style={styles.separator} />
          <QuickLink
            icon={<Clock size={22} color={colors.info} />}
            label='Historique'
            subtitle={historySubtitle}
            accentColor={colors.info}
            onPress={() => navigation.navigate('History')}
          />
          <View style={styles.separator} />
          <QuickLink
            icon={<Settings size={22} color={colors.textSecondary} />}
            label='Paramètres'
            subtitle='Préférences, compte & sécurité'
            accentColor={colors.textSecondary}
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarContainer: { position: 'relative' },
  avatarPlaceholder: {
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  headerInfo: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
  },
  name: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    flex: 1,
  },
  editBtn: {
    backgroundColor: `${colors.primary}15`,
    padding: spacing.xs,
    borderRadius: 12,
    marginLeft: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  eligibilityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 99,
  },
  eligibilityText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
  statsCard: { padding: spacing.md },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.primary,
  },
  statLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: { width: 1, height: 40, backgroundColor: colors.border },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xs,
  },
  linksGroup: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 44 + spacing.md,
  },
});

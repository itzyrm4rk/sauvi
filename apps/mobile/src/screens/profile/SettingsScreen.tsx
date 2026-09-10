import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import {
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Droplet,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Share2,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui';
import { Toast } from '../../components/ui/toastConfig';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useLogoutMutation } from '../../store/api/authApi';
import {
  useDisableNotificationsMutation,
  useGetMeQuery,
  useUpdateFcmTokenMutation,
} from '../../store/api/usersApi';
import type { RootStackParamList } from '../../types/navigation.types';
import {
  getPushNotificationsEnabled,
  setPushNotificationsEnabled,
} from '../../utils/notificationPreferences';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const { data: userResp } = useGetMeQuery();
  const user = userResp?.data;

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [disableNotifications] = useDisableNotificationsMutation();
  const [updateFcmToken] = useUpdateFcmTokenMutation();

  const [notifEnabled, setNotifEnabled] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadNotificationPreference() {
      const pref = await getPushNotificationsEnabled(user?.id);
      const perm = await Notifications.getPermissionsAsync();
      if (active) {
        // Actif si activé dans nos préférences locales ET autorisé par l'OS
        setNotifEnabled(pref && perm.granted);
      }
    }
    loadNotificationPreference();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleToggleNotifications = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifEnabled(value);

    if (!value) {
      try {
        // Enregistrement persistant immédiat dans SecureStore
        await setPushNotificationsEnabled(false, user?.id);
        await disableNotifications().unwrap();
        Toast.show({
          type: 'success',
          text1: 'Notifications désactivées',
          text2: 'Vous ne recevrez plus de notifications push sur cet appareil.',
        });
      } catch (_e) {
        // Même en cas d'erreur réseau, la préférence locale reste désactivée
        await setPushNotificationsEnabled(false, user?.id);
        Toast.show({
          type: 'success',
          text1: 'Notifications désactivées',
          text2: 'Vos notifications push sont coupées sur cet appareil.',
        });
      }
    } else {
      try {
        const existingPermission = await Notifications.getPermissionsAsync();
        const finalPermission = existingPermission.granted
          ? existingPermission
          : await Notifications.requestPermissionsAsync();

        if (!finalPermission.granted) {
          setNotifEnabled(false);
          await setPushNotificationsEnabled(false, user?.id);
          Toast.show({
            type: 'error',
            text1: 'Permission requise',
            text2: 'Activez les notifications dans les paramètres de votre téléphone.',
          });
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('sauvi-sos-channel', {
            name: 'Alertes SOS Urgentes',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500, 200, 1000],
            lightColor: '#E24B4A',
            enableVibrate: true,
            sound: 'default',
          });
          await Notifications.setNotificationChannelAsync('sauvi-chat-channel', {
            name: 'Discussions & Messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 150, 100, 150],
            lightColor: '#7C3AED',
            enableVibrate: true,
            sound: 'default',
          });
          await Notifications.setNotificationChannelAsync('sauvi-system-channel', {
            name: 'Compte & Récompenses',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 100],
            lightColor: '#F59E0B',
            enableVibrate: true,
            sound: 'default',
          });
        }

        const token = await Notifications.getDevicePushTokenAsync();
        const fcmToken = String(token.data);

        if (fcmToken.length > 0) {
          await updateFcmToken({ fcmToken }).unwrap();
          await setPushNotificationsEnabled(true, user?.id);
          setNotifEnabled(true);
          Toast.show({
            type: 'success',
            text1: 'Notifications activées',
            text2: 'Vous recevrez à nouveau les alertes SOS et mises à jour.',
          });
        }
      } catch (_e) {
        setNotifEnabled(false);
        await setPushNotificationsEnabled(false, user?.id);
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de réactiver les notifications push.',
        });
      }
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            try {
              await disableNotifications().unwrap();
            } catch {
              // Ignorer si déjà désactivé ou réseau indisponible
            }
            await logout().unwrap();
          } catch (_e) {
            // Navigation will handle this via auth state
          }
        },
      },
    ]);
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        title: 'SAUVI - Don de sang d’urgence au Cameroun',
        message:
          'Rejoignez la communauté SAUVI pour donner ou recevoir du sang en cas d’urgence vitale au Cameroun. Ensemble, sauvons des vies ! https://sauvi.app',
      });
    } catch (_e) {
      // Ignorer si annulé
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profil summary avec Avatar dynamique */}
        <View style={styles.profileCard}>
          <Avatar
            name={user?.name || 'Utilisateur SAUVI'}
            size='md'
            imageUrl={user?.avatarUrl || null}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || 'Utilisateur SAUVI'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        {/* Section Compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          <View style={styles.group}>
            <NavigableRow
              icon={<User size={18} color={colors.primary} />}
              label='Modifier mon profil'
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <NavigableRow
              icon={<Lock size={18} color={colors.primary} />}
              label='Modifier mon mot de passe'
              onPress={() => navigation.navigate('ChangePassword')}
            />
          </View>
        </View>

        {/* Section Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.group}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                {notifEnabled ? (
                  <Bell size={18} color={colors.primary} />
                ) : (
                  <BellOff size={18} color={colors.textSecondary} />
                )}
                <View>
                  <Text style={styles.toggleLabel}>Notifications push</Text>
                  <Text style={styles.toggleDesc}>
                    {notifEnabled
                      ? 'Recevez les alertes SOS et mises à jour'
                      : 'Ne recevez plus aucune notification SAUVI'}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Section Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.group}>
            <NavigableRow
              icon={<Droplet size={18} color={colors.primary} />}
              label='Compatibilité sanguine'
              onPress={() => navigation.navigate('BloodCompatibility')}
            />
            <View style={styles.divider} />
            <NavigableRow
              icon={<HelpCircle size={18} color={colors.primary} />}
              label='Aide & Support'
              onPress={() => navigation.navigate('Help')}
            />
          </View>
        </View>

        {/* Section Communauté */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communauté</Text>
          <View style={styles.group}>
            <NavigableRow
              icon={<Share2 size={18} color={colors.primary} />}
              label="Partager l'application"
              onPress={handleShareApp}
            />
          </View>
        </View>

        {/* Section Légal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <View style={styles.group}>
            <NavigableRow
              icon={<Lock size={18} color={colors.primary} />}
              label='Politique de confidentialité'
              onPress={() => navigation.navigate('Privacy')}
            />
            <View style={styles.divider} />
            <NavigableRow
              icon={<FileText size={18} color={colors.primary} />}
              label='Conditions générales'
              onPress={() => navigation.navigate('Terms')}
            />
          </View>
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} disabled={isLoggingOut}>
            <LogOut size={18} color={colors.error} />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version & Copyright */}
        <View style={styles.footer}>
          <Text style={styles.version}>SAUVI · Version 1.0.0</Text>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} Marc ATANGANA. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function NavigableRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={rowStyles.left}>
        {icon}
        <Text style={rowStyles.label}>{label}</Text>
      </View>
      <View style={rowStyles.right}>
        <ChevronRight size={16} color={colors.border} />
      </View>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  value: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    maxWidth: 160,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  backBtn: { padding: spacing.xs },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.white,
  },
  profileName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xs,
  },
  group: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  toggleLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  toggleDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    maxWidth: 220,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  logoutText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  version: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  copyright: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
  },
});

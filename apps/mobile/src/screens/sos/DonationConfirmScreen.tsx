import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Award, CheckCircle } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/theme';
import type { RootStackParamList, SosStackParamList } from '../../types/navigation.types';

export function DonationConfirmScreen() {
  const route = useRoute<RouteProp<SosStackParamList, 'DonationConfirm'>>();
  const { pointsEarned } = route.params;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const checkScale = useSharedValue(0);
  const pointsTranslateY = useSharedValue(50);
  const pointsOpacity = useSharedValue(0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    checkScale.value = withSpring(1, { damping: 12, stiffness: 90 });

    pointsTranslateY.value = withDelay(800, withSpring(0, { damping: 15, stiffness: 100 }));
    pointsOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
  }, [checkScale, pointsTranslateY, pointsOpacity]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const pointsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pointsTranslateY.value }],
    opacity: pointsOpacity.value,
  }));

  const handleReturnHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.xl),
          paddingBottom: Math.max(insets.bottom + spacing.md, spacing.xl),
        },
      ]}
    >
      <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fadeOut autoStartDelay={200} />

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, checkAnimatedStyle]}>
          <CheckCircle size={80} color={colors.success} />
        </Animated.View>

        <Text style={styles.title}>Don confirmé !</Text>
        <Text style={styles.description}>
          Merci d'avoir répondu à ce SOS. Votre don a sauvé une vie aujourd'hui.
        </Text>

        <Animated.View style={[styles.pointsContainer, pointsAnimatedStyle]}>
          <Award size={32} color={colors.warning} />
          <Text style={styles.pointsValue}>+{pointsEarned} pts</Text>
          <Text style={styles.pointsLabel}>Réputation SAUVI</Text>
        </Animated.View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleReturnHome}>
        <Text style={styles.buttonText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  pointsContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: spacing.xl,
    borderRadius: 16,
  },
  pointsValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 36,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  pointsLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 16,
  },
});

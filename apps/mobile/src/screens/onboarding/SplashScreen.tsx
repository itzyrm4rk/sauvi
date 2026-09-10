import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing, typography } from '../../constants/theme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps): React.JSX.Element {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    // Animation d'apparition
    opacity.value = withTiming(1, { duration: 800 });
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });

    // Redirection après 2s
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [opacity, scale, onFinish]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    alignItems: 'center',
    justifyContent: 'center',
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={styles.logo}
        contentFit='contain'
      />
      <Text style={styles.title}>SAUVI</Text>
      <Text style={styles.subtitle}>Chaque seconde compte.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xxl,
    color: colors.primary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});

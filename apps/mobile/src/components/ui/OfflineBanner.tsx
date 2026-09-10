import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export function OfflineBanner(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useSharedValue(-150);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isConnected can be null initially, we consider offline only if strictly false
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOffline) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
    } else {
      translateY.value = withTiming(-150, { duration: 300 });
    }
  }, [isOffline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      pointerEvents={isOffline ? 'auto' : 'none'}
      style={[styles.container, { top: Math.max(insets.top, spacing.md) }, animatedStyle]}
    >
      <WifiOff size={18} color={colors.white} />
      <Text style={styles.text}>Vous êtes hors ligne. Vérifiez votre connexion.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#1E1E1E',
    borderRadius: borderRadius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  text: {
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
});

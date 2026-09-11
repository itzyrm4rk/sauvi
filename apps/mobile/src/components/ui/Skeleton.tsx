import { LinearGradient } from 'expo-linear-gradient';
import type React from 'react';
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { borderRadius, colors } from '../../constants/theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: radius = borderRadius.input,
  style,
}: SkeletonProps): React.JSX.Element {
  const animatedValue = useSharedValue(-400);

  useEffect(() => {
    animatedValue.value = withRepeat(withTiming(400, { duration: 1200 }), -1, false);
  }, [animatedValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: animatedValue.value }],
    };
  });

  return (
    <View style={[styles.container, { width, height, borderRadius: radius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { width: 800 }, animatedStyle]}>
        <LinearGradient
          colors={[colors.border, colors.surface, colors.border]}
          locations={[0.2, 0.5, 0.8]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
});

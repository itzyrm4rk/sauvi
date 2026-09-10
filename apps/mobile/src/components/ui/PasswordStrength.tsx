import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { colors, spacing } from '../../constants/theme';

export interface PasswordStrengthProps {
  password?: string;
}

const getStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const getStrengthColor = (score: number) => {
  switch (score) {
    case 0:
      return colors.border;
    case 1:
      return colors.error;
    case 2:
      return colors.warning;
    case 3:
      return '#8CEE80';
    case 4:
      return colors.success;
    default:
      return colors.border;
  }
};

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const score = getStrength(password);
  const color = getStrengthColor(score);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((segment) => {
        const isActive = score >= segment;
        const segmentColor = isActive ? color : colors.border;

        const animatedStyle = useAnimatedStyle(() => ({
          backgroundColor: withTiming(segmentColor, { duration: 300 }),
        }));

        return <Animated.View key={segment} style={[styles.segment, animatedStyle]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    height: 6,
    width: '100%',
    marginVertical: spacing.xs,
  },
  segment: {
    flex: 1,
    borderRadius: 3,
  },
});

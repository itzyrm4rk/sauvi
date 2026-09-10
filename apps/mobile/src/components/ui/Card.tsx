import { memo } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { borderRadius, colors, spacing } from '../../constants/theme';

export interface CardProps extends ViewProps {
  padded?: boolean;
}

export const Card = memo(function Card({
  children,
  padded = true,
  style,
  ...viewProps
}: CardProps): React.JSX.Element {
  return (
    <View style={[styles.card, padded ? styles.padded : undefined, style]} {...viewProps}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: {
    padding: spacing.lg,
  },
});

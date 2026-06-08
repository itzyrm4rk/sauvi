import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.white },
  },
  secondary: {
    container: { backgroundColor: colors.primaryLight },
    text: { color: colors.primaryDark },
  },
  outline: {
    container: { backgroundColor: colors.transparent, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.textPrimary },
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    text: { color: colors.primary },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
    text: { fontSize: typography.fontSize.sm },
  },
  md: {
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
    text: { fontSize: typography.fontSize.md },
  },
  lg: {
    container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
    text: { fontSize: typography.fontSize.lg },
  },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...pressableProps
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled === true || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      accessibilityRole='button'
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        variant === 'primary' ? styles.primaryRadius : styles.defaultRadius,
        fullWidth ? styles.fullWidth : undefined,
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color as string} />
      ) : (
        <Text style={[styles.label, variantStyle.text, sizeStyle.text]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryRadius: {
    borderRadius: borderRadius.button,
  },
  defaultRadius: {
    borderRadius: borderRadius.input,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

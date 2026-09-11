import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | undefined;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  style,
  containerStyle,
  leftIcon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  ...textInputProps
}: InputProps): React.JSX.Element {
  const hasError = error !== undefined && error.length > 0;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecure = secureTextEntry && !isPasswordVisible;

  const renderRightIcon = () => {
    if (rightIcon) {
      return (
        <TouchableOpacity
          onPress={onRightIconPress}
          disabled={!onRightIconPress}
          style={styles.rightIconContainer}
        >
          {rightIcon}
        </TouchableOpacity>
      );
    }

    if (secureTextEntry) {
      return (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.rightIconContainer}
        >
          {isPasswordVisible ? (
            <EyeOff size={20} color={colors.textSecondary} />
          ) : (
            <Eye size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label !== undefined && label.length > 0 ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputContainer, hasError ? styles.inputError : undefined, style]}>
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon || secureTextEntry ? styles.inputWithRightIcon : undefined,
          ]}
          secureTextEntry={isSecure}
          {...textInputProps}
        />
        {renderRightIcon()}
      </View>
      {hasError ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.input,
  },
  inputError: {
    borderColor: colors.primary,
  },
  leftIconContainer: {
    paddingLeft: spacing.lg,
  },
  rightIconContainer: {
    paddingRight: spacing.lg,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: spacing.sm,
  },
  error: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
});

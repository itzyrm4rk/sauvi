import * as Haptics from 'expo-haptics';
import { AlertCircle, Award, CheckCircle, Info, MessageSquare, X } from 'lucide-react-native';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

export type ToastType = 'success' | 'error' | 'info' | 'chat' | 'badge';

export interface ToastMessage {
  type: ToastType;
  text1: string;
  text2?: string;
  duration?: number;
  onPress?: () => void;
}

// Singleton pour appeler Toast.show() depuis n'importe quel composant
let globalShowToast: ((msg: ToastMessage) => void) | null = null;

export const Toast = {
  show: (msg: ToastMessage) => {
    if (globalShowToast) {
      globalShowToast(msg);
    }
  },
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.info,
  chat: '#7C3AED',
  badge: '#F59E0B',
};

function ToastIcon({ type }: { type: ToastType }): React.JSX.Element {
  const color = TOAST_COLORS[type];
  switch (type) {
    case 'success':
      return <CheckCircle size={22} color={color} />;
    case 'error':
      return <AlertCircle size={22} color={color} />;
    case 'info':
      return <Info size={22} color={color} />;
    case 'chat':
      return <MessageSquare size={22} color={color} />;
    case 'badge':
      return <Award size={22} color={color} />;
  }
}

export function ToastProvider(): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setMessage(null);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (msg: ToastMessage) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Haptic feedback subtil et adapté au type de notification
      try {
        if (msg.type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (msg.type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (_e) {
        // Ignorer si non supporté
      }

      setMessage(msg);
      setVisible(true);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Durée calibrée : 3.8s pour les erreurs, 3s pour les succès
      const duration = msg.duration ?? (msg.type === 'error' ? 3800 : 3000);
      timerRef.current = setTimeout(() => {
        hide();
      }, duration);
    },
    [translateY, opacity, hide],
  );

  useEffect(() => {
    globalShowToast = show;
    return () => {
      globalShowToast = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [show]);

  if (!visible || !message) return null;

  const handlePress = () => {
    if (message.onPress) {
      hide();
      message.onPress();
    }
  };

  const accentColor = TOAST_COLORS[message.type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: Math.max(insets.top + spacing.xs, 48), borderLeftColor: accentColor },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        style={styles.touchableContent}
        activeOpacity={message.onPress ? 0.7 : 1}
        onPress={handlePress}
        disabled={!message.onPress}
      >
        <View style={styles.iconContainer}>
          <ToastIcon type={message.type} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.text1, { color: accentColor }]} numberOfLines={1}>
            {message.text1}
          </Text>
          {message.text2 ? (
            <Text style={styles.text2} numberOfLines={2}>
              {message.text2}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={hide}
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    paddingRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    zIndex: 9999,
  },
  touchableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    marginBottom: 2,
  },
  text2: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

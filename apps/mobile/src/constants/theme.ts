export const colors = {
  primary: '#E24B4A',
  primaryDark: '#A32D2D',
  primaryLight: '#FCEBEB',
  success: '#1D9E75',
  warning: '#BA7517',
  info: '#185FA5',
  background: '#F1EFE8',
  card: '#FFFFFF',
  textPrimary: '#2C2C2A',
  textSecondary: '#888780',
  border: '#D3D1C7',
  white: '#FFFFFF',
  error: '#D32F2F',
  surface: '#FFFFFF',
  transparent: 'transparent',
} as const;

export const typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 26,
    xl: 30,
    xxl: 36,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  input: 10,
  card: 16,
  button: 24,
  pill: 999,
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
} as const;

export type Theme = typeof theme;

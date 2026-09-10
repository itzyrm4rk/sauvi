import {
  borderRadius,
  colors as rawColors,
  typography as rawTypography,
  spacing,
} from './constants/theme';

export { spacing, borderRadius };

export const colors = {
  ...rawColors,
  text: {
    primary: rawColors.textPrimary,
    secondary: rawColors.textSecondary,
  },
  priority: {
    high: '#D32F2F',
    medium: '#F9A825',
  },
};

export const typography = {
  ...rawTypography,
  fontFamilies: {
    regular: rawTypography.fontFamily.regular,
    medium: rawTypography.fontFamily.medium,
    semiBold: rawTypography.fontFamily.semibold,
    bold: rawTypography.fontFamily.bold,
  },
};

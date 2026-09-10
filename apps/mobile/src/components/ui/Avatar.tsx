import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, typography } from '../../constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase() ?? '?';
  }
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

export const Avatar = memo(function Avatar({
  name,
  imageUrl,
  size = 'md',
}: AvatarProps): React.JSX.Element {
  const dimension = sizeMap[size];
  const hasImage = imageUrl !== undefined && imageUrl !== null && imageUrl.length > 0;

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {hasImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
          contentFit='cover'
        />
      ) : (
        <Text style={[styles.initials, { fontSize: dimension * 0.35 }]}>{getInitials(name)}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primaryLight,
    overflow: 'hidden',
  },
  image: {
    borderRadius: borderRadius.pill,
  },
  initials: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primaryDark,
  },
});

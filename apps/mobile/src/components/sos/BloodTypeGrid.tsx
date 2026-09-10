import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ROUTES } from '../../constants/routes';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import type { SosStackParamList } from '../../types/navigation.types';

type BloodType = SosStackParamList[typeof ROUTES.SOS.STEP2]['bloodTypeNeeded'];

const BLOOD_TYPES: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

interface BloodTypeGridProps {
  selectedBloodType: BloodType | null;
  onSelect: (bloodType: BloodType) => void;
}

export const BloodTypeGrid = memo(function BloodTypeGrid({
  selectedBloodType,
  onSelect,
}: BloodTypeGridProps): React.JSX.Element {
  return (
    <View style={styles.bloodGrid}>
      {BLOOD_TYPES.map((bloodType) => {
        const selected = selectedBloodType === bloodType;
        return (
          <Pressable
            key={bloodType}
            onPress={() => onSelect(bloodType)}
            style={[styles.bloodTile, selected ? styles.bloodTileSelected : undefined]}
          >
            <Text style={[styles.bloodText, selected ? styles.bloodTextSelected : undefined]}>
              {bloodType}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bloodTile: {
    width: '22%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bloodTileSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  bloodText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  bloodTextSelected: {
    color: colors.white,
  },
});

import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';

type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

const BLOOD_TYPES: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

export function BloodCompatibilityScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + spacing.xs, spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compatibilité sanguine</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Ce tableau indique quels groupes sanguins peuvent être transfusés à qui. Les colonnes sont
          les <Text style={styles.bold}>receveurs</Text>, les lignes sont les{' '}
          <Text style={styles.bold}>donneurs</Text>.
        </Text>

        {/* Tableau */}
        <View style={styles.tableWrapper}>
          {/* En-tête */}
          <View style={styles.row}>
            <View style={[styles.cell, styles.cornerCell]}>
              <Text style={styles.cornerText}>Don →{'\n'}Reçoit ↓</Text>
            </View>
            {BLOOD_TYPES.map((bt) => (
              <View key={bt} style={[styles.cell, styles.headerCell]}>
                <Text style={styles.headerCellText}>{bt}</Text>
              </View>
            ))}
          </View>

          {/* Lignes */}
          {BLOOD_TYPES.map((donor) => (
            <View key={donor} style={styles.row}>
              <View style={[styles.cell, styles.headerCell]}>
                <Text style={styles.headerCellText}>{donor}</Text>
              </View>
              {BLOOD_TYPES.map((recipient) => {
                const compatible = COMPATIBILITY[donor].includes(recipient);
                return (
                  <View
                    key={recipient}
                    style={[
                      styles.cell,
                      compatible ? styles.compatibleCell : styles.incompatibleCell,
                    ]}
                  >
                    <Text style={compatible ? styles.compatibleText : styles.incompatibleText}>
                      {compatible ? '✓' : '✗'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Compatible</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={styles.legendText}>Incompatible</Text>
          </View>
        </View>

        {/* Points clés */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>À retenir</Text>
          <View style={styles.noteRow}>
            <View style={[styles.noteTag, { backgroundColor: '#fef9c3' }]}>
              <Text style={[styles.noteTagText, { color: '#854d0e' }]}>O-</Text>
            </View>
            <Text style={styles.noteText}>Donneur universel — compatible avec tous</Text>
          </View>
          <View style={styles.noteRow}>
            <View style={[styles.noteTag, { backgroundColor: '#fce7f3' }]}>
              <Text style={[styles.noteTagText, { color: '#9d174d' }]}>AB+</Text>
            </View>
            <Text style={styles.noteText}>Receveur universel — peut recevoir tous les groupes</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          Ces informations sont générales pour le sang total. Consultez toujours un médecin ou un
          professionnel de santé avant tout acte de transfusion.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  intro: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  tableWrapper: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  cornerCell: {
    backgroundColor: colors.card,
  },
  cornerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 6,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  headerCell: {
    backgroundColor: colors.primary,
  },
  headerCellText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 8,
    color: colors.white,
  },
  compatibleCell: {
    backgroundColor: '#dcfce7',
  },
  incompatibleCell: {
    backgroundColor: '#fee2e2',
  },
  compatibleText: {
    fontSize: 10,
    color: colors.success,
    fontFamily: typography.fontFamily.bold,
  },
  incompatibleText: {
    fontSize: 10,
    color: colors.error,
    fontFamily: typography.fontFamily.bold,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noteTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.input,
  },
  noteTagText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
  },
  noteText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  disclaimer: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: spacing.xl,
  },
});

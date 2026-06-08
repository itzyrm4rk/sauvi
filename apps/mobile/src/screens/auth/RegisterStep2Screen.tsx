import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function RegisterStep2Screen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription — Étape 2</Text>
      <Input label='Ville' placeholder='Douala' />
      <Input label='Groupe sanguin' placeholder='O+' />
      <Input label='Téléphone' placeholder='+237 6XX XXX XXX' keyboardType='phone-pad' />
      <Button label='Créer mon compte' fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});

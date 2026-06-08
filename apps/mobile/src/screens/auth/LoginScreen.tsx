import { StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '../../components/ui';
import { colors, spacing, typography } from '../../constants/theme';

export function LoginScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <Input label='Email' placeholder='email@exemple.com' keyboardType='email-address' />
      <Input label='Mot de passe' placeholder='••••••••' secureTextEntry />
      <Button label='Se connecter' fullWidth />
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

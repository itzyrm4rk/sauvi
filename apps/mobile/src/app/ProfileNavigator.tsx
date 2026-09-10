import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Eligibility: undefined;
  Badges: undefined;
  History: undefined;
  Settings: undefined;
  BloodCompatibility: undefined;
  Help: undefined;
  Privacy: undefined;
  Terms: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='ProfileHome' component={ProfileScreen} />
      <Stack.Screen
        name='EditProfile'
        component={require('../screens/profile/EditProfileScreen').EditProfileScreen}
      />
      <Stack.Screen
        name='ChangePassword'
        component={require('../screens/profile/ChangePasswordScreen').ChangePasswordScreen}
      />
      <Stack.Screen
        name='Eligibility'
        component={require('../screens/profile/EligibilityScreen').EligibilityScreen}
      />
      <Stack.Screen
        name='Badges'
        component={require('../screens/profile/BadgesScreen').BadgesScreen}
      />
      <Stack.Screen
        name='History'
        component={require('../screens/profile/HistoryScreen').HistoryScreen}
      />
      <Stack.Screen
        name='Settings'
        component={require('../screens/profile/SettingsScreen').SettingsScreen}
      />
      <Stack.Screen
        name='BloodCompatibility'
        component={require('../screens/profile/BloodCompatibilityScreen').BloodCompatibilityScreen}
      />
      <Stack.Screen name='Help' component={require('../screens/profile/HelpScreen').HelpScreen} />
      <Stack.Screen
        name='Privacy'
        component={require('../screens/profile/PrivacyPolicyScreen').PrivacyPolicyScreen}
      />
      <Stack.Screen
        name='Terms'
        component={require('../screens/profile/TermsScreen').TermsScreen}
      />
    </Stack.Navigator>
  );
}

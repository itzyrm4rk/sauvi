import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';

import { ROUTES } from '../constants/routes';
import { colors, typography } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SosPlaceholderScreen } from '../screens/sos/SosPlaceholderScreen';
import type { MainTabParamList } from '../types/navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabLabel({ label, focused }: { label: string; focused: boolean }): React.JSX.Element {
  return (
    <Text style={[styles.tabLabel, focused ? styles.tabLabelFocused : undefined]}>{label}</Text>
  );
}

export function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen
        name={ROUTES.MAIN.HOME}
        component={HomeScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label='Accueil' focused={focused} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.SOS}
        component={SosPlaceholderScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label='SOS' focused={focused} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.NOTIFICATIONS}
        component={NotificationsScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label='Alertes' focused={focused} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.PROFILE}
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label='Profil' focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
  },
  tabLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  tabLabelFocused: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
});

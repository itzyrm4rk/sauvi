import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { HeartPulse, Home, Search, User } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { ROUTES } from '../constants/routes';
import { colors, typography } from '../constants/theme';
import { ExplorerScreen } from '../screens/home/ExplorerScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { SosNavigator } from '../screens/sos/SosNavigator';
import type { MainTabParamList } from '../types/navigation.types';
import { ProfileNavigator } from './ProfileNavigator';

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
        lazy: true,
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
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.SOS}
        component={SosNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route);
          const hideTabBarRoutes = [
            'Chat',
            'DonorWaitlist',
            'HospitalNavigation',
            'SosFlyer',
            'DonationConfirm',
          ];
          const shouldHide = routeName && hideTabBarRoutes.includes(routeName);
          return {
            tabBarLabel: ({ focused }) => <TabLabel label='SOS' focused={focused} />,
            tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} />,
            tabBarStyle: shouldHide ? { display: 'none' } : styles.tabBar,
          };
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.EXPLORER}
        component={ExplorerScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label='Explorer' focused={focused} />,
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name={ROUTES.MAIN.PROFILE}
        component={ProfileNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label='Profil' focused={focused} />,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
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

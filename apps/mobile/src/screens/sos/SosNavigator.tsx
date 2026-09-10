import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../../constants/theme';
import type { SosStackParamList } from '../../types/navigation.types';
import { SosIndexScreen } from './SosIndexScreen';

const Stack = createNativeStackNavigator<SosStackParamList>();

export function SosNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName='SosIndex'
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name='SosIndex' component={SosIndexScreen} />
      <Stack.Screen name='SosStep1' component={require('./SosStep1Screen').SosStep1Screen} />
      <Stack.Screen name='SosStep2' component={require('./SosStep2Screen').SosStep2Screen} />
      <Stack.Screen name='SosConfirm' component={require('./SosConfirmScreen').SosConfirmScreen} />
      <Stack.Screen name='SosDetail' component={require('./SosDetailScreen').SosDetailScreen} />
      <Stack.Screen
        name='DonorWaitlist'
        component={require('./DonorWaitlistScreen').DonorWaitlistScreen}
      />
      <Stack.Screen
        name='HospitalNavigation'
        component={require('./HospitalNavigationScreen').HospitalNavigationScreen}
      />
      <Stack.Screen
        name='DonationConfirm'
        component={require('./DonationConfirmScreen').DonationConfirmScreen}
      />
      <Stack.Screen
        name='SosDashboard'
        component={require('./SosDashboardScreen').SosDashboardScreen}
      />
      <Stack.Screen name='SosFlyer' component={require('./SosFlyerScreen').SosFlyerScreen} />
      <Stack.Screen name='Chat' component={require('../chat/ChatScreen').ChatScreen} />
    </Stack.Navigator>
  );
}

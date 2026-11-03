import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { FlightResultsScreen } from '../screens/FlightResultsScreen';
import { BookingWizardScreen } from '../screens/BookingWizardScreen';
import { BookingSuccessScreen } from '../screens/BookingSuccessScreen';
import { BoardingPassScreen } from '../screens/BoardingPassScreen';
import { COLORS } from '../constants/theme';

export type RootStackParamList = {
  MainTabs: undefined;
  FlightResults: {
    origin: string;
    destination: string;
    departureDate: string;
    passengers: number;
    cabinClass: 'ECONOMY' | 'BUSINESS';
  };
  BookingWizard: {
    flight: any;
    cabinClass: 'ECONOMY' | 'BUSINESS';
    passengers: number;
  };
  BookingSuccess: {
    booking: any;
  };
  BoardingPass: {
    booking: any;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FlightResults"
          component={FlightResultsScreen}
          options={{
            title: 'Chọn chuyến bay',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="BookingWizard"
          component={BookingWizardScreen}
          options={{
            title: 'Thông tin hành khách & ghế',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="BookingSuccess"
          component={BookingSuccessScreen}
          options={{
            title: 'Đặt vé thành công',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="BoardingPass"
          component={BoardingPassScreen}
          options={{
            title: 'Thẻ lên máy bay điện tử',
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

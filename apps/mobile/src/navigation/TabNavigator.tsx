import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FlightSearchScreen } from '../screens/FlightSearchScreen';
import { ManageBookingScreen } from '../screens/ManageBookingScreen';
import { LotusClubScreen } from '../screens/LotusClubScreen';
import { StaffPortalScreen } from '../screens/StaffPortalScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { isStaff, isManager, isAdmin } = useAuth();
  const showStaffTab = isStaff || isManager || isAdmin;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any = 'airplane-outline';
          if (route.name === 'FlightSearchTab') {
            iconName = focused ? 'airplane' : 'airplane-outline';
          } else if (route.name === 'ManageBookingTab') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'LotusClubTab') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'StaffPortalTab') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="FlightSearchTab"
        component={FlightSearchScreen}
        options={{ tabBarLabel: 'Đặt vé' }}
      />
      <Tab.Screen
        name="ManageBookingTab"
        component={ManageBookingScreen}
        options={{ tabBarLabel: 'Quản lý vé' }}
      />
      <Tab.Screen
        name="LotusClubTab"
        component={LotusClubScreen}
        options={{ tabBarLabel: 'Lotus Club' }}
      />
      <Tab.Screen
        name="StaffPortalTab"
        component={StaffPortalScreen}
        options={{
          tabBarLabel: 'Điều hành',
          tabBarBadge: showStaffTab ? undefined : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={LoginScreen}
        options={{ tabBarLabel: 'Tài khoản' }}
      />
    </Tab.Navigator>
  );
};


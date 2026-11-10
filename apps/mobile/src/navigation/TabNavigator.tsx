import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlightSearchScreen } from '../screens/FlightSearchScreen';
import { ManageBookingScreen } from '../screens/ManageBookingScreen';
import { LotusClubScreen } from '../screens/LotusClubScreen';
import { StaffPortalScreen } from '../screens/StaffPortalScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const role = user?.role || 'GUEST';

  // Prevent bottom tab bar from being overlapped (lẹm) by Android/iOS navigation gesture bar
  const bottomPadding = Math.max(insets.bottom, 24);
  const tabHeight = 62 + bottomPadding;

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: '#94a3b8',
    tabBarStyle: {
      backgroundColor: '#ffffff',
      borderTopColor: '#e2e8f0',
      borderTopWidth: 1,
      height: tabHeight,
      paddingBottom: bottomPadding,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontSize: 10.5,
      fontWeight: '700' as const,
      marginTop: 2,
      marginBottom: 3,
    },
  };

  // 1. STAFF (Nhân viên tác nghiệp mặt đất & chuyến bay)
  if (role === 'STAFF') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="StaffPortalTab"
          component={StaffPortalScreen}
          options={{
            tabBarLabel: 'Tác nghiệp bay',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'airplane' : 'airplane-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ManageBookingTab"
          component={ManageBookingScreen}
          options={{
            tabBarLabel: 'Soát vé & Thẻ bay',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={LoginScreen}
          options={{
            tabBarLabel: 'Tài khoản NV',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // 2. STAFF_MANAGER (Quản lý điều hành & Tài chính)
  if (role === 'STAFF_MANAGER') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="StaffPortalTab"
          component={StaffPortalScreen}
          options={{
            tabBarLabel: 'Điều hành & KPI',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ManageBookingTab"
          component={ManageBookingScreen}
          options={{
            tabBarLabel: 'Tra cứu vé',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={LoginScreen}
          options={{
            tabBarLabel: 'Tài khoản Quản lý',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // 3. ADMIN (Quản trị viên toàn hệ thống)
  if (role === 'ADMIN') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="StaffPortalTab"
          component={StaffPortalScreen}
          options={{
            tabBarLabel: 'Hệ thống Quản trị',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ManageBookingTab"
          component={ManageBookingScreen}
          options={{
            tabBarLabel: 'Tra cứu vé',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={LoginScreen}
          options={{
            tabBarLabel: 'Tài khoản Admin',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  // 4. CUSTOMER / GUEST (Khách hàng & Khách vãng lai)
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="FlightSearchTab"
        component={FlightSearchScreen}
        options={{
          tabBarLabel: 'Đặt vé',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'airplane' : 'airplane-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManageBookingTab"
        component={ManageBookingScreen}
        options={{
          tabBarLabel: 'Quản lý vé',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LotusClubTab"
        component={LotusClubScreen}
        options={{
          tabBarLabel: 'Lotus Club',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'star' : 'star-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={LoginScreen}
        options={{
          tabBarLabel: user ? 'Hội viên' : 'Đăng nhập',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

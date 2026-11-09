import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

// Placeholder screen for staff portal when user doesn't have access
const StaffAccessDeniedScreen = ({ navigation }: any) => (
  <View style={accessStyles.container}>
    <View style={accessStyles.iconCircle}>
      <Ionicons name="lock-closed" size={36} color={COLORS.gold} />
    </View>
    <Text style={accessStyles.title}>Khu vực Điều hành</Text>
    <Text style={accessStyles.desc}>
      Chỉ dành cho nhân viên và quản lý{'\n'}Hạt Gạo Sky Airlines
    </Text>
    <TouchableOpacity
      style={accessStyles.loginBtn}
      onPress={() => navigation.navigate('ProfileTab')}
      activeOpacity={0.85}
    >
      <Ionicons name="person-circle-outline" size={18} color={COLORS.navy} />
      <Text style={accessStyles.loginBtnText}>Đăng nhập tài khoản nhân viên</Text>
    </TouchableOpacity>
  </View>
);

const accessStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    color: COLORS.slate500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
});

export const TabNavigator = () => {
  const { isStaff, isManager, isAdmin } = useAuth();
  const hasStaffAccess = isStaff || isManager || isAdmin;

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
        component={hasStaffAccess ? StaffPortalScreen : StaffAccessDeniedScreen}
        options={{
          tabBarLabel: 'Điều hành',
          tabBarBadge: hasStaffAccess ? undefined : undefined,
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


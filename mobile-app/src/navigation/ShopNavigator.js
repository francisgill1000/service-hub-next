import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

import DashboardScreen from '../screens/shop/DashboardScreen';
import CatalogsScreen from '../screens/shop/CatalogsScreen';
import CatalogEditScreen from '../screens/shop/CatalogEditScreen';
import ShopBookingsScreen from '../screens/shop/ShopBookingsScreen';
import BookingActionScreen from '../screens/shop/BookingActionScreen';
import WorkingHoursScreen from '../screens/shop/WorkingHoursScreen';
import ProfileScreen from '../screens/shop/ProfileScreen';
import ScanLoginScreen from '../screens/shop/ScanLoginScreen';
import StaffScreen from '../screens/shop/StaffScreen';
import RemindersScreen from '../screens/shop/RemindersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ShopTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.slateGray,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Dashboard') {
            return <MaterialIcons name="dashboard" size={22} color={color} />;
          } else if (route.name === 'ShopBookings') {
            return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />;
          } else if (route.name === 'Reminders') {
            return <MaterialIcons name="notifications-active" size={22} color={color} />;
          } else if (route.name === 'Services') {
            return <MaterialIcons name="category" size={22} color={color} />;
          } else if (route.name === 'Profile') {
            return <MaterialIcons name="storefront" size={22} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ShopBookings" component={ShopBookingsScreen} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ tabBarLabel: 'Reminders' }} />
      <Tab.Screen name="Services" component={CatalogsScreen} options={{ tabBarLabel: 'Services' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function ShopNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopTabs" component={ShopTabs} />
      <Stack.Screen name="CatalogEdit" component={CatalogEditScreen} />
      <Stack.Screen name="BookingAction" component={BookingActionScreen} />
      <Stack.Screen name="ScanLogin" component={ScanLoginScreen} />
      <Stack.Screen name="Staff" component={StaffScreen} />
      <Stack.Screen name="Hours" component={WorkingHoursScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.cardDark,
    borderTopColor: Colors.borderDark,
    borderTopWidth: 1,
    height: 110,
    paddingBottom: 46,
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
});

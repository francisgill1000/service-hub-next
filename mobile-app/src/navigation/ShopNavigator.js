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
          } else if (route.name === 'Services') {
            return <MaterialIcons name="category" size={22} color={color} />;
          } else if (route.name === 'ShopBookings') {
            return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />;
          } else if (route.name === 'Hours') {
            return <MaterialIcons name="schedule" size={22} color={color} />;
          } else if (route.name === 'Profile') {
            return <MaterialIcons name="storefront" size={22} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Services" component={CatalogsScreen} options={{ tabBarLabel: 'Services' }} />
      <Tab.Screen name="ShopBookings" component={ShopBookingsScreen} options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="Hours" component={WorkingHoursScreen} options={{ tabBarLabel: 'Hours' }} />
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

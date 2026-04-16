import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useCustomer } from '../context/CustomerContext';

import HomeScreen from '../screens/guest/HomeScreen';
import ExploreScreen from '../screens/guest/ExploreScreen';
import NearMeScreen from '../screens/guest/NearMeScreen';
import FavouritesScreen from '../screens/guest/FavouritesScreen';
import BookingsScreen from '../screens/guest/BookingsScreen';
import ShopDetailScreen from '../screens/guest/ShopDetailScreen';
import BookingViewScreen from '../screens/guest/BookingViewScreen';
import CustomerLoginScreen from '../screens/customer/CustomerLoginScreen';
import CustomerRegisterScreen from '../screens/customer/CustomerRegisterScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Shown in the Account tab — login prompt if guest, profile if logged in
function AccountTabScreen({ navigation }) {
  const { customer } = useCustomer();

  if (customer) return <CustomerProfileScreen />;

  return (
    <View style={styles.guestPrompt}>
      <MaterialIcons name="person-outline" size={64} color={Colors.slateGray} />
      <Text style={styles.guestTitle}>Sign In</Text>
      <Text style={styles.guestSubtitle}>
        Log in to track your bookings and save favourites to your account.
      </Text>
      <TouchableOpacity
        style={styles.signInBtn}
        onPress={() => navigation.navigate('CustomerLogin')}
      >
        <Text style={styles.signInBtnText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.registerBtn}
        onPress={() => navigation.navigate('CustomerRegister')}
      >
        <Text style={styles.registerBtnText}>Create Account</Text>
      </TouchableOpacity>

      <View style={styles.shopDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Are you a business owner?</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.shopLoginBtn}
        onPress={() => navigation.navigate('Login')}
      >
        <MaterialIcons name="storefront" size={20} color={Colors.primary} />
        <Text style={styles.shopLoginBtnText}>Business Login</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeTabs() {
  const { customer } = useCustomer();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.slateGray,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Home')
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />;
          if (route.name === 'Explore')
            return <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />;
          if (route.name === 'NearMe')
            return <Ionicons name={focused ? 'location' : 'location-outline'} size={22} color={color} />;
          if (route.name === 'Favourites')
            return <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />;
          if (route.name === 'Bookings')
            return <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />;
          if (route.name === 'Account')
            return customer
              ? <MaterialIcons name="account-circle" size={24} color={color} />
              : <MaterialIcons name="person-outline" size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Bookings"  component={BookingsScreen}  options={{ tabBarLabel: 'Bookings' }} />
      <Tab.Screen name="Favourites" component={FavouritesScreen} options={{ tabBarLabel: 'Favourites' }} />
      <Tab.Screen name="NearMe"    component={NearMeScreen}    options={{ tabBarLabel: 'Near Me' }} />
      <Tab.Screen name="Account"   component={AccountTabScreen} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
  );
}

export default function GuestNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuestTabs"        component={HomeTabs} />
      <Stack.Screen name="ShopDetail"       component={ShopDetailScreen} />
      <Stack.Screen name="BookingView"      component={BookingViewScreen} />
      <Stack.Screen name="CustomerLogin"    component={CustomerLoginScreen} />
      <Stack.Screen name="CustomerRegister" component={CustomerRegisterScreen} />
      <Stack.Screen name="Login"            component={LoginScreen} />
      <Stack.Screen name="Register"         component={RegisterScreen} />
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
  guestPrompt: {
    flex: 1,
    backgroundColor: Colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  guestTitle: { fontSize: 26, fontWeight: '800', color: Colors.white },
  guestSubtitle: {
    fontSize: 14, color: Colors.mutedText,
    textAlign: 'center', lineHeight: 20, marginBottom: 8,
  },
  signInBtn: {
    width: '100%', height: 56, backgroundColor: Colors.primary,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  signInBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  registerBtn: {
    width: '100%', height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  registerBtnText: { color: Colors.mutedText, fontSize: 16, fontWeight: '600' },
  shopDivider: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    marginTop: 24, marginBottom: 16, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: Colors.mutedText, fontSize: 12, fontWeight: '600' },
  shopLoginBtn: {
    width: '100%', height: 50, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(0,122,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,122,255,0.2)',
  },
  shopLoginBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
});

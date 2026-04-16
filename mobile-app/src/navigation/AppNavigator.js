import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useShop } from '../context/ShopContext';
import { Colors } from '../theme/colors';

import GuestNavigator from './GuestNavigator';
import ShopNavigator from './ShopNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { shop, loading } = useShop();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.brandDark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {shop ? (
        <Stack.Screen name="Shop" component={ShopNavigator} />
      ) : (
        <Stack.Screen name="Guest" component={GuestNavigator} />
      )}
    </Stack.Navigator>
  );
}

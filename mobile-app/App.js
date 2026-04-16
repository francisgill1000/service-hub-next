import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider } from './src/context/ShopContext';
import { CustomerProvider } from './src/context/CustomerContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ShopProvider>
          <CustomerProvider>
            <NavigationContainer>
              <StatusBar style="light" backgroundColor="#0B121B" />
              <AppNavigator />
            </NavigationContainer>
          </CustomerProvider>
      </ShopProvider>
    </SafeAreaProvider>
  );
}

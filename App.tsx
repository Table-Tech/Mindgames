import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { EntitlementsProvider } from '@/iap/EntitlementsProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EntitlementsProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </EntitlementsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

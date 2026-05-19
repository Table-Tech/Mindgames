import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PreferencesProvider } from '@/prefs/PreferencesProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { EntitlementsProvider } from '@/iap/EntitlementsProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <ThemeProvider>
          <EntitlementsProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </EntitlementsProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

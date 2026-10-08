import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PreferencesProvider } from '@/prefs/PreferencesProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { EntitlementsProvider } from '@/iap/EntitlementsProvider';
import { RootNavigator } from '@/navigation/RootNavigator';

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Fall back to system fonts if loading fails rather than blocking the app.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <ThemeProvider>
          <EntitlementsProvider>
            <ThemedStatusBar />
            <RootNavigator />
          </EntitlementsProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

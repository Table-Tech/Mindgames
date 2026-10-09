import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { PreferencesProvider } from '@/prefs/PreferencesProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { EntitlementsProvider } from '@/iap/EntitlementsProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { startAds } from '@/ads/admob';
import { preloadInterstitial } from '@/ads/interstitial';
import { cloudPreferencesSource, startCloudSync } from '@/cloud';

// Keep the native splash up until fonts are ready, so there's no blank frame.
SplashScreen.preventAutoHideAsync().catch(() => {});

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

  useEffect(() => startCloudSync(), []);

  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    // After the UI is visible: consent form (if needed) → ATT → AdMob.
    startAds().then(preloadInterstitial);
  }, [ready]);

  // Fall back to system fonts if loading fails rather than blocking the app.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <PreferencesProvider remote={cloudPreferencesSource}>
        <ThemeProvider>
          <EntitlementsProvider>
            <ThemedStatusBar />
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
          </EntitlementsProvider>
        </ThemeProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

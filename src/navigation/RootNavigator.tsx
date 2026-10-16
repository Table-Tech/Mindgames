import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { HomeScreen } from '@/screens/HomeScreen';
import { SudokuScreen } from '@/screens/SudokuScreen';
import { WordleScreen } from '@/screens/WordleScreen';
import { MahjongScreen } from '@/screens/MahjongScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { trackScreen } from '@/analytics/analytics';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isDark, colors } = useTheme();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const lastScreen = React.useRef<string | undefined>(undefined);
  const onScreenChange = () => {
    const screen = navigationRef.getCurrentRoute()?.name;
    if (!screen || screen === lastScreen.current) return;
    lastScreen.current = screen;
    trackScreen(screen);
  };
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={onScreenChange}
      onStateChange={onScreenChange}
    >
      {/* Every screen draws its own chunky header, so the native one is hidden. */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Sudoku">
          {({ route }) => <SudokuScreen mode={route.params.mode} />}
        </Stack.Screen>
        <Stack.Screen name="Wordle">
          {({ route }) => <WordleScreen mode={route.params.mode} />}
        </Stack.Screen>
        <Stack.Screen name="Mahjong">
          {({ route }) => <MahjongScreen mode={route.params.mode} />}
        </Stack.Screen>
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        {/* Tab-bar destinations swap in place instead of sliding. */}
        <Stack.Screen name="Stats" component={StatsScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

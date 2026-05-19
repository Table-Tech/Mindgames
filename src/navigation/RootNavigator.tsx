import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { HomeScreen } from '@/screens/HomeScreen';
import { SudokuScreen } from '@/screens/SudokuScreen';
import { WordleScreen } from '@/screens/WordleScreen';
import { MahjongScreen } from '@/screens/MahjongScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isDark, colors } = useTheme();
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
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Sudoku"
          options={{ title: 'Sudoku' }}
        >
          {({ route }) => <SudokuScreen mode={route.params.mode} />}
        </Stack.Screen>
        <Stack.Screen
          name="Wordle"
          options={{ title: 'Wordle' }}
        >
          {({ route }) => <WordleScreen mode={route.params.mode} />}
        </Stack.Screen>
        <Stack.Screen
          name="Mahjong"
          options={{ title: 'Mahjong' }}
        >
          {({ route }) => <MahjongScreen mode={route.params.mode} />}
        </Stack.Screen>
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Leaderboard' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistics' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

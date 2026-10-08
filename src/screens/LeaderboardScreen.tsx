import React from 'react';
import { useEffect } from 'react';
import { useNavigation, StackActions } from '@react-navigation/native';

// The leaderboard now lives as a tab inside the Stats screen. This route is
// kept so existing deep links / navigate('Leaderboard') calls still land there.
export function LeaderboardScreen() {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.dispatch(StackActions.replace('Stats'));
  }, [navigation]);
  return null;
}

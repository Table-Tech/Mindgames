import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

// Lightweight celebration: ~60 colored squares fall + spin without any
// external libraries. Mounting plays once; unmount when you're done.

interface Props {
  count?: number;
  duration?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3478f6', '#4caf6f', '#d9a93a', '#d64545', '#9c5dd1'];

export function Confetti({
  count = 60,
  duration = 2400,
  colors = DEFAULT_COLORS,
}: Props) {
  const { width, height } = Dimensions.get('window');

  // Generate once; identity (positions, delays, etc.) stays stable across re-renders.
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        x: Math.random() * width,
        delay: Math.random() * (duration * 0.4),
        rotateDir: Math.random() < 0.5 ? -1 : 1,
        rotateTurns: 1 + Math.random() * 3,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: (Math.random() - 0.5) * 120,
      })),
    [count, duration, width, colors],
  );

  const fall = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fall, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(duration * 0.75),
        Animated.timing(fade, {
          toValue: 0,
          duration: duration * 0.25,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fall, fade, duration]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map(p => {
        const translateY = fall.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, height + 60],
        });
        const translateX = fall.interpolate({
          inputRange: [0, 1],
          outputRange: [p.x, p.x + p.drift],
        });
        const rotate = fall.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${360 * p.rotateTurns * p.rotateDir}deg`],
        });
        return (
          <Animated.View
            key={p.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              opacity: fade,
              transform: [{ translateX }, { translateY }, { rotate }],
              borderRadius: 1,
            }}
          />
        );
      })}
    </View>
  );
}

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, StackActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/fonts';
import type { RootStackParamList } from '@/navigation/types';

export type IconName = keyof typeof Ionicons.glyphMap;

export const OUTLINE = 2;

// ---------- Text ----------

export function Display({ style, ...rest }: TextProps & { style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return <Text {...rest} style={[{ fontFamily: fonts.display, color: colors.text }, style]} />;
}

export function Body({ style, ...rest }: TextProps & { style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return <Text {...rest} style={[{ fontFamily: fonts.body, color: colors.text }, style]} />;
}

export function Eyebrow({ style, ...rest }: TextProps & { style?: StyleProp<TextStyle> }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts.bodyHeavy,
          fontSize: 12,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.textMuted,
        },
        style,
      ]}
    />
  );
}

// ---------- Surfaces ----------

interface ChunkyProps {
  onPress?: () => void;
  disabled?: boolean;
  color?: string;
  depth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
  selected?: boolean;
  hitSlop?: number;
}

// A button with a thick outline and a hard drop shadow that "presses down".
export function Chunky({
  onPress,
  disabled,
  color,
  depth = 4,
  radius = 16,
  style,
  contentStyle,
  children,
  accessibilityLabel,
  selected,
  hitSlop,
}: ChunkyProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled, selected }}
      style={[{ paddingBottom: depth, opacity: disabled ? 0.4 : 1 }, style]}
    >
      {({ pressed }) => (
        <>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { top: depth, backgroundColor: colors.ink, borderRadius: radius },
            ]}
          />
          <View
            style={[
              {
                flexGrow: 1,
                backgroundColor: color ?? colors.surface,
                borderColor: colors.ink,
                borderWidth: OUTLINE,
                borderRadius: radius,
                transform: [{ translateY: pressed && !disabled ? depth - 1 : 0 }],
              },
              contentStyle,
            ]}
          >
            {children}
          </View>
        </>
      )}
    </Pressable>
  );
}

// Static version of Chunky for cards that aren't tappable.
export function Card({
  color,
  depth = 4,
  radius = 20,
  style,
  children,
}: {
  color?: string;
  depth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: color ?? colors.surface,
          borderColor: colors.ink,
          borderWidth: OUTLINE,
          borderRadius: radius,
          // A thick bottom border reads as a hard drop shadow on both platforms.
          borderBottomWidth: OUTLINE + depth,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
  iconColor,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  iconColor?: string;
}) {
  const { colors } = useTheme();
  return (
    <Chunky
      onPress={onPress}
      accessibilityLabel={label}
      depth={3}
      radius={14}
      color={color}
      style={{ width: 44 }}
      contentStyle={styles.iconBtn}
      hitSlop={6}
    >
      <Ionicons name={icon} size={22} color={iconColor ?? colors.text} />
    </Chunky>
  );
}

export function Pill({
  label,
  color,
  textColor,
  icon,
  style,
}: {
  label: string;
  color: string;
  textColor?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const fg = textColor ?? '#1D1A33';
  return (
    <View style={[styles.pill, { backgroundColor: color, borderColor: colors.ink }, style]}>
      {icon && <Ionicons name={icon} size={13} color={fg} />}
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

// Small counter bubble pinned to the top-right corner of a button.
export function Badge({ label, color }: { label: string | number; color?: string }) {
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[styles.badge, { backgroundColor: color ?? colors.pink, borderColor: colors.ink }]}
    >
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 10, color: '#1D1A33' }}>{label}</Text>
    </View>
  );
}

// Tool button used under the game boards (Undo / Hint / ...).
export function ToolButton({
  icon,
  label,
  onPress,
  disabled,
  active,
  badge,
  badgeColor,
  color,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: string | number;
  badgeColor?: string;
  color?: string;
}) {
  const { colors } = useTheme();
  const fg = active ? colors.onInk : color ? '#1D1A33' : colors.text;
  return (
    <Chunky
      onPress={onPress}
      disabled={disabled}
      selected={active}
      accessibilityLabel={label}
      depth={3}
      radius={14}
      color={active ? colors.ink : color}
      style={{ flex: 1 }}
      contentStyle={styles.tool}
    >
      <Ionicons name={icon} size={22} color={fg} />
      <Text style={{ fontFamily: fonts.bodyHeavy, fontSize: 12, color: fg }}>{label}</Text>
      {badge != null && <Badge label={badge} color={badgeColor} />}
    </Chunky>
  );
}

// ---------- Layout ----------

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <IconButton icon="chevron-back" label="Back" onPress={() => navigation.goBack()} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Display style={{ fontSize: 22 }} numberOfLines={1}>
          {title}
        </Display>
        {subtitle ? (
          <Eyebrow style={{ marginTop: 2, letterSpacing: 0.4 }}>{subtitle}</Eyebrow>
        ) : null}
      </View>
      {right ?? <View style={{ width: 44 }} />}
    </View>
  );
}

type TabRoute = 'Home' | 'Stats' | 'Settings';
const TABS: { route: TabRoute; label: string; icon: IconName; iconActive: IconName }[] = [
  { route: 'Home', label: 'Play', icon: 'play-outline', iconActive: 'play' },
  { route: 'Stats', label: 'Stats', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { route: 'Settings', label: 'Settings', icon: 'options-outline', iconActive: 'options' },
];

export function TabBar({ active }: { active: TabRoute }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const go = (route: TabRoute) => {
    if (route === active) return;
    if (route === 'Home') navigation.popTo('Home');
    else if (active === 'Home') navigation.navigate(route);
    else navigation.dispatch(StackActions.replace(route));
  };

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.ink,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {TABS.map(t => {
        const on = t.route === active;
        return (
          <Pressable
            key={t.route}
            onPress={() => go(t.route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, on && { backgroundColor: colors.ink }]}
          >
            <Ionicons
              name={on ? t.iconActive : t.icon}
              size={22}
              color={on ? colors.onInk : colors.text}
            />
            <Text
              style={{
                fontFamily: fonts.bodyHeavy,
                fontSize: 12,
                color: on ? colors.onInk : colors.text,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Segmented control (e.g. "My stats / Leaderboard", theme picker).
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.ink }]}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.segment, on && { backgroundColor: colors.ink }]}
          >
            <Text
              style={{
                fontFamily: fonts.bodyHeavy,
                fontSize: 15,
                color: on ? colors.onInk : colors.text,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Chunky on/off switch matching the rest of the UI.
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={[
        styles.toggle,
        { backgroundColor: value ? colors.mahjong : colors.surfaceAlt, borderColor: colors.ink },
      ]}
    >
      <View
        style={[
          styles.knob,
          { borderColor: colors.ink, transform: [{ translateX: value ? 24 : 0 }] },
        ]}
      />
    </Pressable>
  );
}

export function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  iconBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: OUTLINE,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -6,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: OUTLINE,
    alignItems: 'center',
  },
  tool: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: OUTLINE,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    borderRadius: 16,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 16,
    borderWidth: OUTLINE,
  },
  segment: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: {
    width: 58,
    height: 34,
    borderRadius: 999,
    borderWidth: OUTLINE,
    padding: 2,
    justifyContent: 'center',
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: OUTLINE,
  },
});

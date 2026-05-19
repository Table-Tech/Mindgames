import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

// Cross-platform replacement for Alert.prompt (which is iOS only).

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  onSubmit: (name: string) => void;
  onDismiss?: () => void;
}

export function NameInputModal({
  visible,
  title,
  message,
  defaultValue = '',
  placeholder = 'Your name',
  onSubmit,
  onDismiss,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (visible) setValue(defaultValue);
  }, [visible, defaultValue]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message && <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
            ]}
            maxLength={16}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => onSubmit(value.trim())}
          />
          <View style={styles.row}>
            {onDismiss && (
              <Pressable onPress={onDismiss} style={[styles.btn, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => onSubmit(value.trim())}
              style={[styles.btn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 13 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

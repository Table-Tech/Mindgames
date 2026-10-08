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
import { fonts } from '@/theme/fonts';
import { Body, Card, Chunky, Display, OUTLINE } from '@/ui/kit';

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
        <Card radius={24} depth={6} style={styles.card}>
          <Display style={{ fontSize: 24 }}>{title}</Display>
          {message && <Body style={{ fontSize: 14, color: colors.textMuted }}>{message}</Body>}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={placeholder}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.ink,
                backgroundColor: colors.surfaceAlt,
              },
            ]}
            maxLength={16}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => onSubmit(value.trim())}
          />
          <View style={styles.row}>
            {onDismiss && (
              <Pressable onPress={onDismiss} style={styles.cancel} accessibilityRole="button">
                <Text style={[styles.cancelText, { color: colors.text }]}>Skip</Text>
              </Pressable>
            )}
            <Chunky
              onPress={() => onSubmit(value.trim())}
              color={colors.sudoku}
              style={{ flex: 1 }}
              contentStyle={styles.save}
            >
              <Text style={styles.saveText}>Save</Text>
            </Chunky>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(29,26,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 360, padding: 22, gap: 12 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: OUTLINE,
    fontSize: 18,
    fontFamily: fonts.body,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancel: { paddingHorizontal: 12, paddingVertical: 12 },
  cancelText: { fontFamily: fonts.bodyHeavy, fontSize: 15, textDecorationLine: 'underline' },
  save: { height: 50, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: fonts.displaySemi, fontSize: 18, color: '#FFFFFF' },
});

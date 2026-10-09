import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '@/theme/fonts';

interface Props {
  children: React.ReactNode;
  /** Hook for crash reporting (e.g. Crashlytics) once it is added. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

// Last-resort safety net: instead of a white screen, show a friendly message
// with a retry. Uses fixed colors so it works even if the theme itself broke.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Oops, something broke</Text>
        <Text style={styles.body}>Your progress is saved. Tap below to get back to playing.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#F3F0FF',
  },
  title: { fontFamily: fonts.display, fontSize: 26, color: '#1D1A33', textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 15, color: '#5B5677', textAlign: 'center' },
  btn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: '#1D1A33',
    backgroundColor: '#3D5AF1',
  },
  btnText: { fontFamily: fonts.displaySemi, fontSize: 18, color: '#FFFFFF' },
});

import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {CrashEntry, clearCrashes, loadCrashes, logCrash} from '../services/crashLog';

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string;
  showDetails: boolean;
  recent: CrashEntry[];
  cleared: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    componentStack: '',
    showDetails: false,
    recent: [],
    cleared: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({componentStack: info.componentStack ?? ''});
    logCrash('render', error, info.componentStack ?? undefined);
  }

  private retry = () => {
    this.setState({
      error: null,
      componentStack: '',
      showDetails: false,
      recent: [],
      cleared: false,
    });
  };

  private toggleDetails = async () => {
    if (this.state.showDetails) {
      this.setState({showDetails: false});
      return;
    }
    const recent = await loadCrashes();
    this.setState({showDetails: true, recent});
  };

  private clear = async () => {
    await clearCrashes();
    this.setState({recent: [], cleared: true});
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }
    const message = this.state.error.message || 'Unknown render error';
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.mark}>
            <View style={styles.markBar} />
            <View style={[styles.markBar, styles.markShort]} />
            <View style={styles.markBar} />
          </View>
          <Text style={styles.title}>PitchLab stopped unexpectedly</Text>
          <Text style={styles.body}>
            The tuner could not draw this screen. A diagnostic entry was stored locally so the
            problem can be investigated. No audio was recorded or uploaded.
          </Text>

          <View style={styles.errorBox}>
            <Text style={styles.errorLabel}>ERROR</Text>
            <Text style={styles.errorText}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={this.retry}
              style={({pressed}) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryLabel}>Try again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={this.toggleDetails}
              style={({pressed}) => [styles.button, pressed && styles.pressed]}>
              <Text style={styles.buttonLabel}>
                {this.state.showDetails ? 'Hide diagnostics' : 'Show diagnostics'}
              </Text>
            </Pressable>
          </View>

          {this.state.showDetails ? (
            <View style={styles.details}>
              <View style={styles.detailsHeader}>
                <Text style={styles.detailsTitle}>LOCAL CRASH LOG</Text>
                <Pressable accessibilityRole="button" onPress={this.clear} hitSlop={8}>
                  <Text style={styles.clearLabel}>Clear</Text>
                </Pressable>
              </View>
              {this.state.cleared ? (
                <Text style={styles.logText}>The local crash log was cleared.</Text>
              ) : null}
              {this.state.recent.length === 0 && !this.state.cleared ? (
                <Text style={styles.logText}>No stored entries were readable.</Text>
              ) : null}
              {this.state.recent.map((entry, index) => (
                <View key={`${entry.timestamp}-${index}`} style={styles.logEntry}>
                  <Text style={styles.logMeta}>
                    {new Date(entry.timestamp).toLocaleString()} · {entry.kind} · v
                    {entry.appVersion}
                  </Text>
                  <Text style={styles.logText}>{entry.message}</Text>
                  {entry.stack ? (
                    <Text style={styles.logStack} numberOfLines={8}>
                      {entry.stack}
                    </Text>
                  ) : null}
                </View>
              ))}
              {this.state.componentStack ? (
                <View style={styles.logEntry}>
                  <Text style={styles.logMeta}>CURRENT COMPONENT STACK</Text>
                  <Text style={styles.logStack}>{this.state.componentStack}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.footer}>
            Try again first. If the problem repeats, include the diagnostic entry when contacting
            pitchlabapp@gmail.com.
          </Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  mark: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    justifyContent: 'center',
    gap: 5,
    marginBottom: spacing.xs,
  },
  markBar: {
    height: 4,
    width: 34,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  markShort: {
    width: 22,
    backgroundColor: colors.flat,
  },
  title: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: 540,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.45)',
    borderRadius: 6,
    backgroundColor: 'rgba(255,100,100,0.08)',
    padding: spacing.sm,
    gap: 3,
    alignSelf: 'stretch',
  },
  errorLabel: {
    color: colors.danger,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  errorText: {
    color: colors.text,
    fontFamily: type.mono,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignSelf: 'stretch',
  },
  primaryButton: {
    flex: 1,
    minWidth: 160,
    minHeight: 46,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: '#03100C',
    fontFamily: type.body,
    fontSize: 15,
    fontWeight: '700',
  },
  button: {
    flex: 1,
    minWidth: 160,
    minHeight: 46,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
  details: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    padding: spacing.sm,
    gap: spacing.xs,
    alignSelf: 'stretch',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsTitle: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  clearLabel: {
    color: colors.danger,
    fontFamily: type.body,
    fontSize: 11,
    fontWeight: '700',
  },
  logEntry: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 5,
    gap: 2,
  },
  logMeta: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
  },
  logText: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 10,
    lineHeight: 15,
  },
  logStack: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    lineHeight: 12,
  },
  footer: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
});

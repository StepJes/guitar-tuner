import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, radii, spacing, type} from '../constants/theme';
import {IconButton} from './IconButton';

interface DialogModalProps {
  visible: boolean;
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  dismissable?: boolean;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
}

export function DialogModal({
  visible,
  title,
  onClose,
  children,
  footer,
  scroll = true,
  dismissable = true,
  style,
  subtitle,
}: DialogModalProps) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth = Math.min(width - spacing.lg * 2, 620);
  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.nonScroll}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {
        if (dismissable) {
          onClose?.();
        }
      }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          style={styles.backdrop}
          onPress={() => {
            if (dismissable) {
              onClose?.();
            }
          }}
        />
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              width: cardWidth,
              maxHeight: Math.max(320, height - insets.top - insets.bottom - spacing.xl * 2),
            },
            style,
          ]}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View style={styles.headerSpacer}>
              {onClose ? <IconButton icon="close" label="Close" onPress={onClose} size={18} /> : null}
            </View>
          </View>
          <View style={styles.body}>{content}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dialogScrim,
  },
  card: {
    backgroundColor: colors.dialogSurface,
    borderRadius: radii.dialog,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dialogHeader,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  headerSpacer: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  title: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 12,
    textAlign: 'center',
  },
  body: {
    flexShrink: 1,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  nonScroll: {
    padding: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
});

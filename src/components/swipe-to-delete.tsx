import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

export default function SwipeToDelete({
  children,
  label,
  onDelete,
}: {
  children: React.ReactNode;
  label: string;
  onDelete: () => Promise<void>;
}) {
  const swipeable = useRef<Swipeable>(null);
  const [deleting, setDeleting] = useState(false);

  function vibrateOpen() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    try {
      await onDelete();
    } catch {
      swipeable.current?.close();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Swipeable
      ref={swipeable}
      friction={2}
      rightThreshold={42}
      overshootRight={false}
      containerStyle={styles.container}
      onSwipeableWillOpen={vibrateOpen}
      renderRightActions={() => (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={label}
          activeOpacity={0.82}
          disabled={deleting}
          style={styles.action}
          onPress={() => void remove()}
        >
          {deleting
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Ionicons name="trash-outline" size={22} color="#FFFFFF" />}
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      )}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 9,
    overflow: 'hidden',
    borderRadius: 16,
  },
  action: {
    width: 112,
    paddingHorizontal: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
});

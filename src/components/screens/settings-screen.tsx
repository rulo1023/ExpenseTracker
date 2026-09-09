import Ionicons from '@expo/vector-icons/Ionicons';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Ajustes
      </Text>

      <Text style={styles.subtitle}>
        Personaliza ExpenseTracker.
      </Text>

      <View style={styles.placeholder}>
        <View style={styles.icon}>
          <Ionicons
            name="settings-outline"
            size={30}
            color="#6366F1"
          />
        </View>

        <Text style={styles.placeholderTitle}>
          Próximamente
        </Text>

        <Text style={styles.placeholderText}>
          Aquí añadiremos moneda, apariencia,
          preferencias, IA local y otras opciones.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#F6F7F9',
  },

  title: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#6B7280',
  },

  placeholder: {
    marginTop: 30,
    padding: 28,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },

  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  placeholderText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});

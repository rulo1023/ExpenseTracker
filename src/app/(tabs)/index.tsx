import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ExpenseTracker</Text>
        <Text style={styles.subtitle}>Tus finanzas, entendidas en lenguaje natural</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Este mes</Text>

        <Text style={styles.amount}>0,00 €</Text>

        <Text style={styles.empty}>
          Todavía no has registrado ningún gasto.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>＋ Añadir gasto</Text>
      </TouchableOpacity>

      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>✨ Añadir con IA</Text>
        <Text style={styles.aiText}>
          "Ayer cené fuera y gasté 24 euros"
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    paddingHorizontal: 20,
  },

  header: {
    marginTop: 12,
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },

  cardLabel: {
    fontSize: 15,
    color: '#6B7280',
  },

  amount: {
    marginTop: 8,
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
  },

  empty: {
    marginTop: 20,
    fontSize: 15,
    color: '#9CA3AF',
  },

  primaryButton: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  aiCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
  },

  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3730A3',
  },

  aiText: {
    marginTop: 8,
    fontSize: 15,
    color: '#4B5563',
    fontStyle: 'italic',
  },
});
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/auth-context';
import { useExpenses } from '../../context/expenses-context';

type HomeScreenProps = {
  onAddExpense: () => void;
};

export default function HomeScreen({
  onAddExpense,
}: HomeScreenProps) {
  const { expenses, total } = useExpenses();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      Alert.alert(
        'Error',
        'No se pudo cerrar la sesión.'
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              ExpenseTracker
            </Text>

            <Text style={styles.subtitle}>
              {user?.email ?? 'Tus finanzas'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutText}>
              Salir
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>
          Este mes
        </Text>

        <Text style={styles.amount}>
          {total.toFixed(2)} €
        </Text>

        <Text style={styles.summary}>
          {expenses.length === 0
            ? 'Todavía no has registrado ningún gasto.'
            : `${expenses.length} ${
                expenses.length === 1
                  ? 'gasto registrado'
                  : 'gastos registrados'
              }`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onAddExpense}
      >
        <Text style={styles.primaryButtonText}>
          ＋ Añadir gasto
        </Text>
      </TouchableOpacity>

      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>
          ✨ Añadir con IA
        </Text>

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

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
    paddingRight: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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

  summary: {
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

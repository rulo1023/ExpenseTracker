import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses } from '../../context/expenses-context';

export default function TransactionsScreen() {
  const { expenses } = useExpenses();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Movimientos</Text>

      <Text style={styles.subtitle}>
        Todos tus gastos registrados.
      </Text>

      {expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>↕</Text>

          <Text style={styles.emptyTitle}>
            Sin movimientos
          </Text>

          <Text style={styles.emptyText}>
            Cuando añadas tu primer gasto aparecerá aquí.
          </Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.transactionCard}>
              <View>
                <Text style={styles.description}>
                  {item.description}
                </Text>

                <Text style={styles.date}>
                  {item.createdAt.toLocaleDateString()}
                </Text>
              </View>

              <Text style={styles.amount}>
                {item.amount.toFixed(2)} €
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    paddingHorizontal: 20,
  },

  title: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
  },

  emptyCard: {
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    color: '#9CA3AF',
  },

  list: {
    paddingTop: 24,
    paddingBottom: 100,
  },

  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  date: {
    marginTop: 5,
    fontSize: 13,
    color: '#9CA3AF',
  },

  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Movimientos</Text>
      <Text style={styles.subtitle}>
        Aquí aparecerán todos tus gastos.
      </Text>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyIcon}>↕</Text>
        <Text style={styles.emptyTitle}>Sin movimientos</Text>
        <Text style={styles.emptyText}>
          Cuando añadas tu primer gasto aparecerá aquí.
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
});

import {
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCategories } from '../../context/categories-context';
import {
  Expense,
  useExpenses,
} from '../../context/expenses-context';

type ExpenseSection = {
  key: string;
  title: string;
  date: Date;
  total: number;
  planned: boolean;
  data: Expense[];
};

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatSectionTitle(date: Date) {
  const today = startOfDay(new Date());

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (sameDay(date, today)) {
    return 'Hoy';
  }

  if (sameDay(date, yesterday)) {
    return 'Ayer';
  }

  if (sameDay(date, tomorrow)) {
    return 'Mañana';
  }

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year:
      date.getFullYear() !== today.getFullYear()
        ? 'numeric'
        : undefined,
  }).format(date);
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function buildSections(expenses: Expense[]): ExpenseSection[] {
  const grouped = new Map<
    string,
    {
      date: Date;
      expenses: Expense[];
    }
  >();

  expenses.forEach((expense) => {
    const date = startOfDay(expense.transactionDate);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    const current = grouped.get(key);

    if (current) {
      current.expenses.push(expense);
    } else {
      grouped.set(key, {
        date,
        expenses: [expense],
      });
    }
  });

  return Array.from(grouped.entries())
    .map(([key, group]) => {
      const sortedExpenses = [...group.expenses].sort(
        (a, b) =>
          b.transactionDate.getTime() -
          a.transactionDate.getTime()
      );

      const total = sortedExpenses.reduce(
        (sum, expense) =>
          sum + expense.amount,
        0
      );

      return {
        key,
        title: formatSectionTitle(group.date),
        date: group.date,
        total,
        planned:
          group.date.getTime() >
          startOfDay(new Date()).getTime(),
        data: sortedExpenses,
      };
    })
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime()
    );
}

export default function TransactionsScreen() {
  const { expenses, loading } = useExpenses();
  const { getCategoryById } = useCategories();

  const sections = buildSections(expenses);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Movimientos
      </Text>

      <Text style={styles.subtitle}>
        Todos tus gastos registrados.
      </Text>

      {loading && expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>
            Cargando movimientos...
          </Text>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>
            $
          </Text>

          <Text style={styles.emptyTitle}>
            Sin movimientos
          </Text>

          <Text style={styles.emptyText}>
            Cuando añadas tu primer gasto aparecerá aquí.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      section.planned &&
                        styles.sectionTitlePlanned,
                    ]}
                  >
                    {section.title}
                  </Text>

                  {section.planned && (
                    <View style={styles.plannedBadge}>
                      <Text style={styles.plannedBadgeText}>
                        PREVISTO
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.sectionCount}>
                  {section.data.length}{' '}
                  {section.data.length === 1
                    ? 'movimiento'
                    : 'movimientos'}
                </Text>
              </View>

              <Text
                style={[
                  styles.sectionTotal,
                  section.planned &&
                    styles.sectionTotalPlanned,
                ]}
              >
                {formatAmount(section.total)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const category =
              getCategoryById(item.categoryId);

            const planned =
              item.status === 'planned';

            return (
              <View
                style={[
                  styles.transactionCard,
                  planned &&
                    styles.transactionCardPlanned,
                ]}
              >
                <View style={styles.transactionInfo}>
                  <Text style={styles.description}>
                    {item.description}
                  </Text>

                  <View style={styles.metadataRow}>
                    <Text style={styles.category}>
                      {category?.name ??
                        'Sin categoría'}
                    </Text>

                    {planned && (
                      <>
                        <Text style={styles.dot}>
                          ·
                        </Text>

                        <Text style={styles.plannedText}>
                          Previsto
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                <Text
                  style={[
                    styles.amount,
                    planned &&
                      styles.amountPlanned,
                  ]}
                >
                  {formatAmount(item.amount)}
                </Text>
              </View>
            );
          }}
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

  list: {
    paddingTop: 26,
    paddingBottom: 120,
  },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
  },

  sectionTitlePlanned: {
    color: '#9A3412',
  },

  sectionCount: {
    marginTop: 3,
    fontSize: 12,
    color: '#9CA3AF',
  },

  sectionTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  sectionTotalPlanned: {
    color: '#C2410C',
  },

  plannedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFEDD5',
  },

  plannedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C2410C',
  },

  transactionCard: {
    marginBottom: 10,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  transactionCardPlanned: {
    backgroundColor: '#FFF7ED',
  },

  transactionInfo: {
    flex: 1,
    paddingRight: 12,
  },

  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  metadataRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  category: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
  },

  dot: {
    marginHorizontal: 5,
    fontSize: 13,
    color: '#9CA3AF',
  },

  plannedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C2410C',
  },

  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  amountPlanned: {
    color: '#C2410C',
  },

  emptyCard: {
    marginTop: 30,
    padding: 30,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  emptyIcon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  emptyTitle: {
    marginTop: 12,
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

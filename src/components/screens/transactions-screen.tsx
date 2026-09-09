import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpenseEditorModal from '../expense-editor-modal';
import { useCategories } from '../../context/categories-context';
import {
  Expense,
  useExpenses,
} from '../../context/expenses-context';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function sectionTitle(date: Date) {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) {
    return 'Hoy';
  }

  if (date.getTime() === yesterday.getTime()) {
    return 'Ayer';
  }

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

export default function TransactionsScreen() {
  const { expenses } = useExpenses();
  const { getCategoryById } = useCategories();
  const [editing, setEditing] =
    useState<Expense | null>(null);

  const grouped = new Map<string, Expense[]>();

  expenses.forEach((expense) => {
    const key = startOfDay(
      expense.transactionDate
    ).toISOString();

    grouped.set(key, [
      ...(grouped.get(key) ?? []),
      expense,
    ]);
  });

  const sections = Array.from(grouped.entries())
    .map(([key, data]) => ({
      title: sectionTitle(new Date(key)),
      date: new Date(key),
      data,
    }))
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime()
    );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gastos</Text>

      <Text style={styles.subtitle}>
        Toca cualquier gasto para editarlo.
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          sections.length === 0 && styles.emptyList,
        ]}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={30}
                color="#6366F1"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Aún no hay gastos
            </Text>

            <Text style={styles.emptyText}>
              Los gastos que añadas aparecerán aquí.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>
            {section.title}
          </Text>
        )}
        renderItem={({ item }) => {
          const category = getCategoryById(
            item.categoryId
          );

          return (
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.card,
                item.status === 'planned' &&
                  styles.cardPlanned,
              ]}
              onPress={() => setEditing(item)}
            >
              <View
                style={[
                  styles.transactionIcon,
                  {
                    backgroundColor: `${
                      category?.color ?? '#6366F1'
                    }18`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    (category?.icon ??
                      'pricetag-outline') as any
                  }
                  size={21}
                  color={category?.color ?? '#6366F1'}
                />
              </View>

              <View style={styles.cardText}>
                <Text style={styles.description}>
                  {item.description ||
                    category?.name ||
                    'Gasto'}
                </Text>

                <Text
                  style={[
                    styles.category,
                    {
                      color:
                        category?.color ?? '#6366F1',
                    },
                  ]}
                >
                  {category?.name ?? 'Sin categoría'}
                  {item.status === 'planned'
                    ? ' · Previsto'
                    : ''}
                </Text>
              </View>

              <Text style={styles.amount}>
                {formatMoney(item.amount)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <ExpenseEditorModal
        expense={editing}
        onClose={() => setEditing(null)}
      />
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

  list: {
    paddingTop: 20,
    paddingBottom: 120,
  },

  emptyList: {
    flexGrow: 1,
  },

  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'capitalize',
  },

  card: {
    marginBottom: 9,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  cardPlanned: {
    backgroundColor: '#FFF7ED',
  },

  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardText: {
    flex: 1,
  },

  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  category: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },

  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  emptyState: {
    flex: 1,
    minHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  emptyText: {
    marginTop: 7,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});

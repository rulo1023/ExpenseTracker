import DateTimePicker from '@expo/ui/community/datetime-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpenseEditorModal from '../expense-editor-modal';
import ExpenseFiltersModal, {
  countExpenseFilters,
  defaultExpenseFilters,
  ExpenseFilters,
} from '../expense-filters-modal';
import {
  formatCurrencyAmount,
  useAppSettings,
} from '../../context/app-settings-context';
import { useCategories } from '../../context/categories-context';
import { Expense, useExpenses } from '../../context/expenses-context';
import { useAppStyles } from '../../lib/themed-styles';

type QuickPeriod = 'all' | 'today' | 'week' | 'month';

const periodOptions: { label: string; value: QuickPeriod }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
];

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getPeriodRange(period: QuickPeriod, monthAnchor: Date) {
  const today = startOfDay(new Date());

  if (period === 'today') {
    return { start: today, end: addDays(today, 1) };
  }

  if (period === 'week') {
    const day = today.getDay();
    const monday = addDays(today, day === 0 ? -6 : 1 - day);
    return { start: monday, end: addDays(monday, 7) };
  }

  if (period === 'month') {
    return {
      start: new Date(
        monthAnchor.getFullYear(),
        monthAnchor.getMonth(),
        1
      ),
      end: new Date(
        monthAnchor.getFullYear(),
        monthAnchor.getMonth() + 1,
        1
      ),
    };
  }

  return null;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year:
      date.getFullYear() === new Date().getFullYear()
        ? undefined
        : 'numeric',
  }).format(date);
}

function formatMonth(date: Date) {
  const label = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sectionTitle(date: Date) {
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);

  if (date.getTime() === today.getTime()) return 'Hoy';
  if (date.getTime() === yesterday.getTime()) return 'Ayer';

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-ES')
    .trim();
}

function parseAmount(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function sourceLabel(source: Expense['source']) {
  const labels: Record<Expense['source'], string> = {
    manual: 'Manual',
    text: 'Texto',
    voice: 'Voz',
    recurring: 'Recurrente',
  };
  return labels[source];
}

export default function TransactionsScreen() {
  const styles = useAppStyles(lightStyles);
  const { expenses } = useExpenses();
  const {
    convertAmount,
    displayCurrency,
    formatMoney,
  } = useAppSettings();
  const { getCategoryById } = useCategories();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [search, setSearch] = useState('');
  const [quickPeriod, setQuickPeriod] =
    useState<QuickPeriod>('all');
  const [monthAnchor, setMonthAnchor] = useState(
    startOfDay(new Date())
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showPlanned, setShowPlanned] = useState(false);
  const [filters, setFilters] =
    useState<ExpenseFilters>(defaultExpenseFilters);

  const activeFilterCount = countExpenseFilters(filters);
  const plannedCount = expenses.filter((expense) => expense.status === 'planned').length;
  const hasActiveQuery =
    search.trim() !== '' ||
    quickPeriod !== 'all' ||
    activeFilterCount > 0;

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = normalizeSearch(search);
    const range = getPeriodRange(quickPeriod, monthAnchor);
    const minimum = parseAmount(filters.minAmount);
    const maximum = parseAmount(filters.maxAmount);

    const result = expenses.filter((expense) => {
      const category = getCategoryById(expense.categoryId);
      const displayedAmount = convertAmount(
        expense.amount,
        expense.currency
      );

      if (
        expense.status === 'planned' &&
        !showPlanned &&
        filters.status !== 'planned'
      ) return false;

      if (range) {
        const timestamp = expense.transactionDate.getTime();
        if (
          timestamp < range.start.getTime() ||
          timestamp >= range.end.getTime()
        ) {
          return false;
        }
      }

      if (
        filters.categoryId &&
        expense.categoryId !== filters.categoryId
      ) return false;

      if (
        filters.status !== 'all' &&
        expense.status !== filters.status
      ) return false;

      if (
        filters.source !== 'all' &&
        expense.source !== filters.source
      ) return false;

      if (minimum !== null && displayedAmount < minimum) return false;
      if (maximum !== null && displayedAmount > maximum) return false;

      if (normalizedQuery) {
        const amountVariants = [
          expense.amount.toString(),
          expense.amount.toFixed(2),
          expense.amount.toFixed(2).replace('.', ','),
          displayedAmount.toString(),
          displayedAmount.toFixed(2).replace('.', ','),
          formatMoney(expense.amount, expense.currency),
        ].join(' ');
        const searchable = normalizeSearch(
          `${expense.description} ${category?.name ?? ''} ${amountVariants}`
        );
        if (!searchable.includes(normalizedQuery)) return false;
      }

      return true;
    });

    return result.sort((a, b) => {
      if (filters.sort === 'oldest') {
        return a.transactionDate.getTime() - b.transactionDate.getTime();
      }
      if (filters.sort === 'highest') {
        return (
          convertAmount(b.amount, b.currency) -
          convertAmount(a.amount, a.currency)
        );
      }
      if (filters.sort === 'lowest') {
        return (
          convertAmount(a.amount, a.currency) -
          convertAmount(b.amount, b.currency)
        );
      }
      return b.transactionDate.getTime() - a.transactionDate.getTime();
    });
  }, [
    expenses,
    convertAmount,
    filters,
    getCategoryById,
    monthAnchor,
    quickPeriod,
    search,
    showPlanned,
  ]);

  const sections = useMemo(() => {
    const planned = filteredExpenses
      .filter((expense) => expense.status === 'planned')
      .sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
    const completed = filteredExpenses.filter((expense) => expense.status !== 'planned');

    if (filters.sort === 'highest' || filters.sort === 'lowest') {
      const regular = completed.length > 0
        ? [
            {
              title:
                filters.sort === 'highest'
                  ? 'De mayor a menor'
                  : 'De menor a mayor',
              data: completed,
            },
          ]
        : [];
      return planned.length > 0
        ? [{ title: 'Próximos', data: planned }, ...regular]
        : regular;
    }

    const grouped = new Map<string, Expense[]>();
    completed.forEach((expense) => {
      const key = startOfDay(expense.transactionDate).toISOString();
      grouped.set(key, [...(grouped.get(key) ?? []), expense]);
    });

    const dated = Array.from(grouped.entries()).map(([key, data]) => ({
      title: sectionTitle(new Date(key)),
      data,
    }));
    return planned.length > 0
      ? [{ title: 'Próximos', data: planned }, ...dated]
      : dated;
  }, [filteredExpenses, filters.sort]);

  const resultTotal = filteredExpenses.reduce(
    (sum, expense) =>
      sum + convertAmount(expense.amount, expense.currency),
    0
  );

  function selectPeriod(period: QuickPeriod) {
    setQuickPeriod(period);
    if (period === 'month') setMonthAnchor(startOfDay(new Date()));
  }

  function moveMonth(offset: number) {
    setMonthAnchor(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + offset,
          1
        )
    );
  }

  function clearAll() {
    setSearch('');
    setQuickPeriod('all');
    setMonthAnchor(startOfDay(new Date()));
    setFilters(defaultExpenseFilters);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gastos</Text>
      <Text style={styles.subtitle}>
        Busca, filtra o toca un gasto para editarlo.
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.list,
          sections.length === 0 && styles.emptyList,
        ]}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Descripción, categoría o importe"
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodRow}
            >
              {periodOptions.map((option) => {
                const selected = quickPeriod === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.periodChip,
                      selected && styles.periodChipSelected,
                    ]}
                    onPress={() => selectPeriod(option.value)}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        selected && styles.periodChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {plannedCount > 0 && (
                <TouchableOpacity
                  style={[styles.periodChip, showPlanned && styles.plannedChipSelected]}
                  onPress={() => setShowPlanned((current) => !current)}
                >
                  <Ionicons name={showPlanned ? 'eye' : 'eye-off-outline'} size={16} color={showPlanned ? '#FFFFFF' : '#C2410C'} />
                  <Text style={[styles.periodChipText, styles.plannedChipText, showPlanned && styles.periodChipTextSelected]}>
                    {showPlanned ? 'Ocultar previstos' : `Mostrar previstos (${plannedCount})`}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {quickPeriod === 'month' && (
              <View style={styles.monthNavigator}>
                <TouchableOpacity
                  style={styles.monthArrow}
                  onPress={() => moveMonth(-1)}
                >
                  <Ionicons name="chevron-back" size={21} color="#4F46E5" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.monthLabelButton}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={17} color="#4F46E5" />
                  <Text style={styles.monthLabel}>
                    {formatMonth(monthAnchor)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.monthArrow}
                  onPress={() => moveMonth(1)}
                >
                  <Ionicons name="chevron-forward" size={21} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.resultsBar}>
              <View>
                <Text style={styles.resultCount}>
                  {filteredExpenses.length}{' '}
                  {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
                </Text>
                <Text style={styles.resultTotal}>
                  {formatMoney(resultTotal, displayCurrency)} en total
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilterCount > 0 && styles.filterButtonActive,
                ]}
                onPress={() => setFiltersVisible(true)}
              >
                <Ionicons
                  name="options-outline"
                  size={19}
                  color={activeFilterCount > 0 ? '#4F46E5' : '#4B5563'}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilterCount > 0 && styles.filterButtonTextActive,
                  ]}
                >
                  Filtros
                </Text>
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={expenses.length === 0 ? 'receipt-outline' : 'search-outline'}
                size={30}
                color="#6366F1"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {expenses.length === 0 ? 'Aún no hay gastos' : 'No hay resultados'}
            </Text>
            <Text style={styles.emptyText}>
              {expenses.length === 0
                ? 'Los gastos que añadas aparecerán aquí.'
                : 'Prueba con otra búsqueda o quita algún filtro.'}
            </Text>
            {hasActiveQuery && expenses.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
                <Text style={styles.clearButtonText}>
                  Limpiar búsqueda y filtros
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const category = getCategoryById(item.categoryId);
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.card,
                item.status === 'planned' && styles.cardPlanned,
              ]}
              onPress={() => setEditing(item)}
            >
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: `${category?.color ?? '#6366F1'}18` },
                ]}
              >
                <Ionicons
                  name={
                    (category?.icon ??
                      'pricetag-outline') as keyof typeof Ionicons.glyphMap
                  }
                  size={21}
                  color={category?.color ?? '#6366F1'}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.description} numberOfLines={1}>
                  {item.description || category?.name || 'Gasto'}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  <Text
                    style={{
                      color: category?.color ?? '#6366F1',
                      fontWeight: '600',
                    }}
                  >
                    {category?.name ?? 'Sin categoría'}
                  </Text>
                  {' · '}
                  {formatShortDate(item.transactionDate)}
                  {item.status === 'planned' ? ' · Previsto' : ''}
                  {item.source !== 'manual'
                    ? ` · ${sourceLabel(item.source)}`
                    : ''}
                </Text>
              </View>
              <View style={styles.amountGroup}>
                <Text style={styles.amount}>
                  {formatMoney(item.amount, item.currency)}
                </Text>
                {item.currency !== displayCurrency && (
                  <Text style={styles.originalAmount}>
                    {formatCurrencyAmount(item.amount, item.currency)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {showMonthPicker && (
        <DateTimePicker
          value={monthAnchor}
          mode="date"
          presentation="dialog"
          onValueChange={(_event, value) => {
            setMonthAnchor(
              new Date(value.getFullYear(), value.getMonth(), 1)
            );
            setShowMonthPicker(false);
          }}
          onDismiss={() => setShowMonthPicker(false)}
        />
      )}

      <ExpenseFiltersModal
        visible={filtersVisible}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFiltersVisible(false)}
      />
      <ExpenseEditorModal
        expense={editing}
        onClose={() => setEditing(null)}
      />
    </SafeAreaView>
  );
}

const lightStyles = StyleSheet.create({
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
    paddingTop: 18,
    paddingBottom: 120,
  },
  emptyList: {
    flexGrow: 1,
  },
  searchBox: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#111827',
  },
  periodRow: {
    paddingTop: 12,
    paddingBottom: 3,
    gap: 8,
  },
  periodChip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  periodChipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  periodChipTextSelected: { color: '#FFFFFF' },
  plannedChipSelected: { borderColor: '#C2410C', backgroundColor: '#C2410C' },
  plannedChipText: { color: '#C2410C' },
  monthNavigator: {
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 6,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthArrow: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4338CA',
  },
  resultsBar: {
    marginTop: 15,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  resultTotal: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
  filterButton: {
    minHeight: 42,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  filterButtonActive: {
    borderColor: '#A5B4FC',
    backgroundColor: '#EEF2FF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterButtonTextActive: { color: '#4F46E5' },
  filterBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'capitalize',
  },
  card: {
    marginBottom: 9,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  cardPlanned: { backgroundColor: '#FFF7ED' },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, minWidth: 0 },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  amountGroup: {
    alignItems: 'flex-end',
  },
  originalAmount: {
    marginTop: 3,
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    minHeight: 310,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
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
  clearButton: {
    marginTop: 16,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
});

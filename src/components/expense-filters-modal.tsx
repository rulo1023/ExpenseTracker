import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CategoryPickerModal from './category-picker-modal';
import {
  currencyInfo,
  useAppSettings,
} from '../context/app-settings-context';
import { useCategories } from '../context/categories-context';
import { useAppStyles } from '../lib/themed-styles';

export type ExpenseStatusFilter =
  | 'all'
  | 'completed'
  | 'planned';

export type ExpenseSourceFilter =
  | 'all'
  | 'manual'
  | 'text'
  | 'voice'
  | 'recurring';

export type ExpenseSort =
  | 'recent'
  | 'oldest'
  | 'highest'
  | 'lowest';

export type ExpenseFilters = {
  categoryId: string | null;
  status: ExpenseStatusFilter;
  source: ExpenseSourceFilter;
  minAmount: string;
  maxAmount: string;
  sort: ExpenseSort;
};

export const defaultExpenseFilters: ExpenseFilters = {
  categoryId: null,
  status: 'all',
  source: 'all',
  minAmount: '',
  maxAmount: '',
  sort: 'recent',
};

type ExpenseFiltersModalProps = {
  visible: boolean;
  filters: ExpenseFilters;
  onApply: (filters: ExpenseFilters) => void;
  onClose: () => void;
};

const statusOptions: {
  label: string;
  value: ExpenseStatusFilter;
}[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Realizados', value: 'completed' },
  { label: 'Previstos', value: 'planned' },
];

const sourceOptions: {
  label: string;
  value: ExpenseSourceFilter;
}[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Manual', value: 'manual' },
  { label: 'Texto', value: 'text' },
  { label: 'Voz', value: 'voice' },
  { label: 'Recurrente', value: 'recurring' },
];

const sortOptions: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: ExpenseSort;
}[] = [
  {
    label: 'Más reciente',
    icon: 'arrow-down-outline',
    value: 'recent',
  },
  {
    label: 'Más antiguo',
    icon: 'arrow-up-outline',
    value: 'oldest',
  },
  {
    label: 'Mayor importe',
    icon: 'trending-down-outline',
    value: 'highest',
  },
  {
    label: 'Menor importe',
    icon: 'trending-up-outline',
    value: 'lowest',
  },
];

export function countExpenseFilters(
  filters: ExpenseFilters
) {
  return [
    filters.categoryId !== null,
    filters.status !== 'all',
    filters.source !== 'all',
    filters.minAmount.trim() !== '' ||
      filters.maxAmount.trim() !== '',
    filters.sort !== 'recent',
  ].filter(Boolean).length;
}

export default function ExpenseFiltersModal({
  visible,
  filters,
  onApply,
  onClose,
}: ExpenseFiltersModalProps) {
  const styles = useAppStyles(lightStyles);
  const { categories } = useCategories();
  const { displayCurrency } = useAppSettings();
  const [draft, setDraft] =
    useState<ExpenseFilters>(filters);
  const [categoryPickerVisible, setCategoryPickerVisible] =
    useState(false);

  const selectedCategory = categories.find(
    (category) => category.id === draft.categoryId
  );

  useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [filters, visible]);

  function updateDraft<K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K]
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Filtrar gastos</Text>
            <Text style={styles.subtitle}>
              Combina los criterios que necesites.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Categoría</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.categorySelector}
            onPress={() => setCategoryPickerVisible(true)}
          >
            <View
              style={[
                styles.categorySelectorIcon,
                {
                  backgroundColor: selectedCategory
                    ? `${selectedCategory.color}18`
                    : '#EEF2FF',
                },
              ]}
            >
              <Ionicons
                name={
                  selectedCategory
                    ? (selectedCategory.icon as keyof typeof Ionicons.glyphMap)
                    : 'albums-outline'
                }
                size={21}
                color={selectedCategory?.color ?? '#6366F1'}
              />
            </View>

            <View style={styles.categorySelectorText}>
              <Text style={styles.categorySelectorLabel}>
                {selectedCategory?.name ?? 'Todas las categorías'}
              </Text>
              <Text style={styles.categorySelectorHint}>
                Toca para cambiar
              </Text>
            </View>

            <Ionicons
              name="chevron-down"
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.segmentedControl}>
            {statusOptions.map((option) => {
              const selected = draft.status === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segment,
                    selected && styles.segmentSelected,
                  ]}
                  onPress={() =>
                    updateDraft('status', option.value)
                  }
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Origen</Text>
          <View style={styles.chips}>
            {sourceOptions.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                selected={draft.source === option.value}
                onPress={() => updateDraft('source', option.value)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Importe</Text>
          <View style={styles.amountRow}>
            <View style={styles.amountField}>
              <Text style={styles.fieldLabel}>Mínimo</Text>
              <View style={styles.amountInputBox}>
                <TextInput
                  style={styles.amountInput}
                  value={draft.minAmount}
                  onChangeText={(value) =>
                    updateDraft('minAmount', value)
                  }
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                />
                <Text style={styles.currency}>
                  {currencyInfo(displayCurrency).symbol}
                </Text>
              </View>
            </View>

            <View style={styles.amountField}>
              <Text style={styles.fieldLabel}>Máximo</Text>
              <View style={styles.amountInputBox}>
                <TextInput
                  style={styles.amountInput}
                  value={draft.maxAmount}
                  onChangeText={(value) =>
                    updateDraft('maxAmount', value)
                  }
                  placeholder="Sin límite"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                />
                <Text style={styles.currency}>
                  {currencyInfo(displayCurrency).symbol}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Ordenar por</Text>
          <View style={styles.sortGrid}>
            {sortOptions.map((option) => {
              const selected = draft.sort === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    selected && styles.sortOptionSelected,
                  ]}
                  onPress={() => updateDraft('sort', option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={selected ? '#4F46E5' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.sortText,
                      selected && styles.sortTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => setDraft(defaultExpenseFilters)}
          >
            <Text style={styles.resetButtonText}>Limpiar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          >
            <Text style={styles.applyButtonText}>Ver resultados</Text>
          </TouchableOpacity>
        </View>

        <CategoryPickerModal
          visible={categoryPickerVisible}
          selectedCategoryId={draft.categoryId}
          title="Filtrar por categoría"
          allowClear
          onClear={() => updateDraft('categoryId', null)}
          onSelect={(categoryId) =>
            updateDraft('categoryId', categoryId)
          }
          onClose={() => setCategoryPickerVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

function FilterChip({
  label,
  selected,
  color = '#4F46E5',
  icon,
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const styles = useAppStyles(lightStyles);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.chip,
        selected && {
          borderColor: color,
          backgroundColor: `${color}12`,
        },
      ]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? color : '#6B7280'}
        />
      )}
      <Text
        style={[
          styles.chipText,
          selected && { color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const lightStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  categorySelector: {
    minHeight: 64,
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  categorySelectorIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySelectorText: {
    flex: 1,
  },
  categorySelectorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  categorySelectorHint: {
    marginTop: 3,
    fontSize: 12,
    color: '#9CA3AF',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  segmentedControl: {
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextSelected: {
    color: '#4F46E5',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amountField: {
    flex: 1,
  },
  fieldLabel: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  amountInputBox: {
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  currency: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  sortOption: {
    width: '48.5%',
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortOptionSelected: {
    borderColor: '#818CF8',
    backgroundColor: '#EEF2FF',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  sortTextSelected: {
    color: '#4F46E5',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 10,
  },
  resetButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
  applyButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

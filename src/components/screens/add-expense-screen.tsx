import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';

import { useCategories } from '../../context/categories-context';
import { useExpenses } from '../../context/expenses-context';
import { classifyCategories } from '../../lib/expense-intelligence/category-classifier';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function isFutureDate(date: Date) {
  return startOfDay(date).getTime() > startOfDay(new Date()).getTime();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function AddExpenseScreen() {
  const { addExpense } = useExpenses();
  const { categories } = useCategories();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [suggestedCategoryIds, setSuggestedCategoryIds] = useState<string[]>([]);
  const [categoryError, setCategoryError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const amountInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const normalizedCategorySearch =
    categorySearch
      .trim()
      .toLocaleLowerCase('es-ES');

  const filteredCategories =
    categories.filter((category) => {
      if (!normalizedCategorySearch) {
        return true;
      }

      const searchableText =
        `${category.name} ${category.description}`
          .toLocaleLowerCase('es-ES');

      return searchableText.includes(
        normalizedCategorySearch
      );
    });

  function normalizeSuggestionText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es-ES')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getSuggestedCategoryIds(
    text: string
  ): string[] {
    const input =
      normalizeSuggestionText(text);

    if (input.length < 2) {
      return [];
    }

    const inputTokens =
      input
        .split(' ')
        .filter((token) => token.length >= 3);

    return categories
      .map((category) => {
        const name =
          normalizeSuggestionText(
            category.name
          );

        const categoryDescription =
          normalizeSuggestionText(
            category.description
          );

        let score = 0;

        if (name === input) {
          score += 20;
        }

        if (
          input.includes(name) ||
          name.includes(input)
        ) {
          score += 10;
        }

        for (const token of inputTokens) {
          if (name.includes(token)) {
            score += 5;
          }

          if (
            categoryDescription.includes(
              token
            )
          ) {
            score += 2;
          }
        }

        return {
          id: category.id,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 3)
      .map((item) => item.id);
  }

  useEffect(() => {
    let cancelled = false;

    const timer =
      setTimeout(() => {
        void (async () => {
          const result =
            await classifyCategories(
              description,
              categories,
              3
            );

          if (cancelled) {
            return;
          }

          setSuggestedCategoryIds(
            result.suggestions.map(
              (item) => item.categoryId
            )
          );
        })();
      }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    description,
    categories,
  ]);

  function setToday() {
    setTransactionDate(new Date());
  }

  function setYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setTransactionDate(yesterday);
  }

  function handleDateChange(
    _event: unknown,
    selectedDate: Date
  ) {
    setTransactionDate(selectedDate);

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  }

  function handleDateDismiss() {
    setShowDatePicker(false);
  }

  async function handleSave() {
    const parsedAmount = Number(
      amount.replace(',', '.')
    );

    if (
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      Alert.alert(
        'Importe incorrecto',
        'Introduce un importe válido.'
      );
      return;
    }

    if (!categoryId) {
      setCategoryError(true);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);

      return;
    }

    const planned = isFutureDate(transactionDate);

    try {
      setSaving(true);
      setCategoryError(false);

      await addExpense({
        description: description.trim(),
        amount: parsedAmount,
        categoryId,
        transactionDate,
        status: planned ? 'planned' : 'completed',
        source: 'manual',
      });

      setDescription('');
      setAmount('');
      setCategoryId(null);
    setSuggestedCategoryIds([]);
      setTransactionDate(new Date());
      setCategoryError(false);

      Alert.alert(
        planned
          ? 'Gasto previsto guardado'
          : 'Gasto guardado',
        planned
          ? 'El gasto futuro se ha añadido correctamente.'
          : 'El gasto se ha añadido correctamente.'
      );
    } catch (error) {
      console.error(
        'Error saving expense:',
        error
      );

      Alert.alert(
        'Error',
        'No se pudo guardar el gasto.'
      );
    } finally {
      setSaving(false);
    }
  }

  const planned = isFutureDate(transactionDate);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Añadir gasto
          </Text>

          <Text style={styles.subtitle}>
            Escríbelo como quieras.
          </Text>

          <View style={styles.aiCard}>
            <Text style={styles.aiLabel}>
              ✨ Introducir con lenguaje natural
            </Text>

            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Ej: Ayer cené fuera y gasté 24 euros"
              placeholderTextColor="#9CA3AF"
              cursorColor="#4F46E5"
              selectionColor="#C7D2FE"
            />

            <TouchableOpacity
              style={styles.aiButton}
            >
              <Text style={styles.aiButtonText}>
                Interpretar gasto
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.separator}>
            o introduce los datos manualmente
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Descripción"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            cursorColor="#111827"
            selectionColor="#D1D5DB"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() =>
              amountInputRef.current?.focus()
            }
          />

          <TextInput
            ref={amountInputRef}
            style={styles.input}
            placeholder="Importe"
            placeholderTextColor="#9CA3AF"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            cursorColor="#111827"
            selectionColor="#D1D5DB"
            returnKeyType="done"
            onSubmitEditing={() => {
              if (!categoryId) {
                setCategoryError(true);

                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({
                    animated: true,
                  });
                }, 100);
              }
            }}
          />

          <Text style={styles.sectionLabel}>
            Fecha
          </Text>

          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={styles.quickDateButton}
              onPress={setToday}
            >
              <Text style={styles.quickDateText}>
                Hoy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickDateButton}
              onPress={setYesterday}
            >
              <Text style={styles.quickDateText}>
                Ayer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() =>
                setShowDatePicker(true)
              }
            >
              <Text style={styles.dateButtonText}>
                {formatDate(transactionDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {planned && (
            <View style={styles.plannedBanner}>
              <Text style={styles.plannedTitle}>
                Gasto previsto
              </Text>

              <Text style={styles.plannedText}>
                Esta fecha está en el futuro. El gasto se guardará como previsto.
              </Text>
            </View>
          )}

          {showDatePicker && (
            <DateTimePicker
              value={transactionDate}
              mode="date"
              display={
                Platform.OS === 'ios'
                  ? 'inline'
                  : 'default'
              }
              onChange={handleDateChange}
            />
          )}

          <Text style={styles.categoryLabel}>
            Categoría *
          </Text>

          {categoryError && (
            <Text style={styles.categoryError}>
              Debes seleccionar una categoría.
            </Text>
          )}
{suggestedCategoryIds.length > 0 && (
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsTitleRow}>
            <Ionicons
              name="sparkles"
              size={17}
              color="#4F46E5"
            />

            <Text style={styles.suggestionsTitle}>
              Sugeridas
            </Text>
          </View>

          <View style={styles.suggestionsList}>
            {suggestedCategoryIds
              .map((id) =>
                categories.find(
                  (category) =>
                    category.id === id
                )
              )
              .filter(Boolean)
              .map((category) => {
                if (!category) {
                  return null;
                }

                const selected =
                  category.id === categoryId;

                const categoryColor =
                  category.color ||
                  '#6366F1';

                const categoryIcon =
                  category.icon ||
                  'pricetag-outline';

                return (
                  <TouchableOpacity
                    key={category.id}
                    activeOpacity={0.75}
                    style={[
                      styles.suggestionCard,
                      {
                        borderColor:
                          selected
                            ? categoryColor
                            : `${categoryColor}45`,
                        backgroundColor:
                          selected
                            ? `${categoryColor}12`
                            : '#FFFFFF',
                      },
                    ]}
                    onPress={() => {
                      setCategoryId(
                        category.id
                      );
                      setCategoryError(false);
                    }}
                  >
                    <View
                      style={[
                        styles.suggestionIcon,
                        {
                          backgroundColor:
                            selected
                              ? categoryColor
                              : `${categoryColor}18`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          categoryIcon as any
                        }
                        size={20}
                        color={
                          selected
                            ? '#FFFFFF'
                            : categoryColor
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.suggestionText
                      }
                      numberOfLines={2}
                    >
                      {category.name}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={
                          categoryColor
                        }
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      )}

      <View style={styles.categorySearch}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#9CA3AF"
        />

        <TextInput
          style={styles.categorySearchInput}
          value={categorySearch}
          onChangeText={setCategorySearch}
          placeholder="Buscar categoría..."
          placeholderTextColor="#9CA3AF"
          cursorColor="#4F46E5"
          selectionColor="#C7D2FE"
          autoCorrect={false}
        />

        {categorySearch.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              setCategorySearch('')
            }
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>

      {filteredCategories.length === 0 && (
        <View style={styles.noCategoriesFound}>
          <Ionicons
            name="search-outline"
            size={24}
            color="#9CA3AF"
          />

          <Text style={styles.noCategoriesFoundText}>
            No encontramos ninguna categoría
          </Text>
        </View>
      )}

      <View style={styles.categoryList}>
        {filteredCategories.map((category) => {
          const selected =
            category.id === categoryId;

          const categoryColor =
            category.color || '#6366F1';

          const categoryIcon =
            category.icon ||
            'pricetag-outline';

          return (
            <TouchableOpacity
              key={category.id}
              activeOpacity={0.75}
              style={[
                styles.categoryCard,
                {
                  borderColor: selected
                    ? categoryColor
                    : `${categoryColor}45`,
                  backgroundColor: selected
                    ? `${categoryColor}12`
                    : '#FFFFFF',
                },
              ]}
              onPress={() => {
                setCategoryId(category.id);
                setCategoryError(false);
              }}
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor: selected
                      ? categoryColor
                      : `${categoryColor}18`,
                  },
                ]}
              >
                <Ionicons
                  name={categoryIcon as any}
                  size={22}
                  color={
                    selected
                      ? '#FFFFFF'
                      : categoryColor
                  }
                />
              </View>

              <Text
                style={[
                  styles.categoryCardText,
                  selected &&
                    styles.categoryCardTextSelected,
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>

              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color={categoryColor}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

          <TouchableOpacity
            style={[
              styles.manualButton,
              saving &&
                styles.manualButtonDisabled,
            ]}
            disabled={saving}
            onPress={() => {
              void handleSave();
            }}
          >
            <Text style={styles.manualButtonText}>
              {saving
                ? 'Guardando...'
                : planned
                  ? 'Guardar gasto previsto'
                  : 'Guardar gasto'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 120,
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

  aiCard: {
    marginTop: 26,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 20,
  },

  aiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3730A3',
  },

  textArea: {
    marginTop: 14,
    minHeight: 110,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    fontSize: 16,
    textAlignVertical: 'top',
    color: '#111827',
  },

  aiButton: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },

  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },

  separator: {
    marginVertical: 24,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#111827',
  },

  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  quickDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  quickDateButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  quickDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  dateButton: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
  },

  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  plannedBanner: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
  },

  plannedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },

  plannedText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#C2410C',
  },

  categoryLabel: {
    marginTop: 4,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  categoryError: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
  },


  suggestionsSection: {
    marginBottom: 16,
  },

  suggestionsTitleRow: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },

  suggestionsList: {
    flexDirection: 'row',
    gap: 8,
  },

  suggestionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 78,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  suggestionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  suggestionText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: '#374151',
  },

  categorySearch: {
    height: 48,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  categorySearchInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontSize: 14,
    color: '#111827',
  },

  noCategoriesFound: {
    marginBottom: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  noCategoriesFoundText: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  categoryCard: {
    width: '48%',
    minHeight: 74,
    paddingHorizontal: 11,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryCardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: '#374151',
  },

  categoryCardTextSelected: {
    fontWeight: '700',
    color: '#111827',
  },

  manualButton: {
    marginTop: 4,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#111827',
  },

  manualButtonDisabled: {
    opacity: 0.6,
  },

  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});















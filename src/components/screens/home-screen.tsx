import DateTimePicker from '@expo/ui/community/datetime-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ExpenseDonut from '../expense-donut';

import { useAuth } from '../../context/auth-context';
import {
  Category,
  useCategories,
} from '../../context/categories-context';
import {
  Expense,
  useExpenses,
} from '../../context/expenses-context';
import {
  SummaryPeriod,
  usePreferences,
} from '../../context/preferences-context';

type HomeScreenProps = {
  onAddExpense: () => void;
};

const periodOptions: {
  label: string;
  value: SummaryPeriod;
}[] = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' },
];

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(
  date: Date,
  days: number
) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNaturalRange(
  period: SummaryPeriod,
  anchor: Date
) {
  let start = startOfDay(anchor);
  let end = new Date(start);

  if (period === 'day') {
    end = addDays(start, 1);
  }

  if (period === 'week') {
    const day = start.getDay();

    const diff =
      day === 0
        ? -6
        : 1 - day;

    start = addDays(start, diff);
    end = addDays(start, 7);
  }

  if (period === 'month') {
    start = new Date(
      anchor.getFullYear(),
      anchor.getMonth(),
      1
    );

    end = new Date(
      anchor.getFullYear(),
      anchor.getMonth() + 1,
      1
    );
  }

  if (period === 'year') {
    start = new Date(
      anchor.getFullYear(),
      0,
      1
    );

    end = new Date(
      anchor.getFullYear() + 1,
      0,
      1
    );
  }

  return { start, end };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    'es-ES',
    {
      style: 'currency',
      currency: 'EUR',
    }
  ).format(value);
}

function formatRange(
  start: Date,
  endExclusive: Date
) {
  const end =
    addDays(endExclusive, -1);

  if (
    start.getTime() ===
    end.getTime()
  ) {
    return new Intl.DateTimeFormat(
      'es-ES',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    ).format(start);
  }

  return `${new Intl.DateTimeFormat(
    'es-ES',
    {
      day: 'numeric',
      month: 'short',
    }
  ).format(start)} – ${new Intl.DateTimeFormat(
    'es-ES',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(end)}`;
}

export default function HomeScreen({
  onAddExpense,
}: HomeScreenProps) {
  const {
    expenses,
    updateExpense,
    deleteExpense,
  } = useExpenses();

  const {
    categories,
  } = useCategories();

  const {
    signOut,
  } = useAuth();

  const {
    summaryPeriod,
    customStartDate,
    customEndDate,
    setSummaryPeriod,
    setCustomPeriod,
  } = usePreferences();

  const [anchorDate, setAnchorDate] =
    useState(new Date());

  const [
    customModalVisible,
    setCustomModalVisible,
  ] = useState(false);

  const [
    customStart,
    setCustomStart,
  ] = useState(
    customStartDate ??
      new Date()
  );

  const [
    customEnd,
    setCustomEnd,
  ] = useState(
    customEndDate ??
      new Date()
  );

  const [
    choosingStart,
    setChoosingStart,
  ] = useState(false);

  const [
    choosingEnd,
    setChoosingEnd,
  ] = useState(false);

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<Category | null>(
      null
    );

  const [
    editingExpense,
    setEditingExpense,
  ] =
    useState<Expense | null>(
      null
    );

  const [
    editDescription,
    setEditDescription,
  ] = useState('');

  const [
    editAmount,
    setEditAmount,
  ] = useState('');

  const [
    editCategoryId,
    setEditCategoryId,
  ] = useState('');

  const [
    editDate,
    setEditDate,
  ] = useState(
    new Date()
  );

  const [
    editDatePicker,
    setEditDatePicker,
  ] = useState(false);

  let range;

  if (
    summaryPeriod === 'custom' &&
    customStartDate &&
    customEndDate
  ) {
    range = {
      start:
        startOfDay(
          customStartDate
        ),
      end:
        addDays(
          startOfDay(
            customEndDate
          ),
          1
        ),
    };
  } else {
    range =
      getNaturalRange(
        summaryPeriod ===
          'custom'
          ? 'month'
          : summaryPeriod,
        anchorDate
      );
  }

  const periodExpenses =
    expenses.filter(
      (expense) =>
        expense.status ===
          'completed' &&
        expense.transactionDate.getTime() >=
          range.start.getTime() &&
        expense.transactionDate.getTime() <
          range.end.getTime()
    );

  const total =
    periodExpenses.reduce(
      (sum, expense) =>
        sum +
        expense.amount,
      0
    );

  const breakdown =
    categories
      .map((category) => {
        const categoryExpenses =
          periodExpenses.filter(
            (expense) =>
              expense.categoryId ===
              category.id
          );

        return {
          ...category,
          expenses:
            categoryExpenses,
          value:
            categoryExpenses.reduce(
              (
                sum,
                expense
              ) =>
                sum +
                expense.amount,
              0
            ),
        };
      })
      .filter(
        (category) =>
          category.value > 0
      )
      .sort(
        (a, b) =>
          b.value -
          a.value
      );

  function movePeriod(
    direction: number
  ) {
    if (
      summaryPeriod ===
      'custom'
    ) {
      return;
    }

    const next =
      new Date(anchorDate);

    if (
      summaryPeriod ===
      'day'
    ) {
      next.setDate(
        next.getDate() +
          direction
      );
    }

    if (
      summaryPeriod ===
      'week'
    ) {
      next.setDate(
        next.getDate() +
          7 * direction
      );
    }

    if (
      summaryPeriod ===
      'month'
    ) {
      next.setMonth(
        next.getMonth() +
          direction
      );
    }

    if (
      summaryPeriod ===
      'year'
    ) {
      next.setFullYear(
        next.getFullYear() +
          direction
      );
    }

    setAnchorDate(next);
  }

  function openExpense(
    expense: Expense
  ) {
    setEditingExpense(
      expense
    );

    setEditDescription(
      expense.description
    );

    setEditAmount(
      String(expense.amount)
    );

    setEditCategoryId(
      expense.categoryId
    );

    setEditDate(
      expense.transactionDate
    );
  }

  async function saveEditedExpense() {
    if (!editingExpense) {
      return;
    }

    const amount =
      Number(
        editAmount.replace(
          ',',
          '.'
        )
      );

    if (
      !amount ||
      amount <= 0 ||
      !editCategoryId
    ) {
      Alert.alert(
        'Datos incompletos',
        'Revisa los datos del gasto.'
      );

      return;
    }

    const future =
      startOfDay(
        editDate
      ).getTime() >
      startOfDay(
        new Date()
      ).getTime();

    await updateExpense(
      editingExpense.id,
      {
        description:
          editDescription,
        amount,
        categoryId:
          editCategoryId,
        transactionDate:
          editDate,
        status:
          future
            ? 'planned'
            : 'completed',
        source:
          editingExpense.source,
      }
    );

    setEditingExpense(null);
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={styles.header}
        >
          <Text
            style={styles.title}
          >
            Resumen
          </Text>

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            onPress={() => {
              void signOut();
            }}
          >
            <Text
              style={
                styles.logoutText
              }
            >
              Salir
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.periodSelector
          }
        >
          {periodOptions.map(
            (option) => (
              <TouchableOpacity
                key={
                  option.value
                }
                style={[
                  styles.periodButton,
                  summaryPeriod ===
                    option.value &&
                    styles.periodButtonActive,
                ]}
                onPress={() => {
                  setAnchorDate(
                    new Date()
                  );

                  void setSummaryPeriod(
                    option.value
                  );
                }}
              >
                <Text
                  style={[
                    styles.periodText,
                    summaryPeriod ===
                      option.value &&
                      styles.periodTextActive,
                  ]}
                >
                  {
                    option.label
                  }
                </Text>
              </TouchableOpacity>
            )
          )}

          <TouchableOpacity
            style={[
              styles.periodButton,
              summaryPeriod ===
                'custom' &&
                styles.periodButtonActive,
            ]}
            onPress={() =>
              setCustomModalVisible(
                true
              )
            }
          >
            <Text
              style={[
                styles.periodText,
                summaryPeriod ===
                  'custom' &&
                  styles.periodTextActive,
              ]}
            >
              Personalizado
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View
          style={
            styles.rangeNavigator
          }
        >
          {summaryPeriod !==
            'custom' && (
            <TouchableOpacity
              style={
                styles.arrowButton
              }
              onPress={() =>
                movePeriod(-1)
              }
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#111827"
              />
            </TouchableOpacity>
          )}

          <Text
            style={
              styles.rangeText
            }
          >
            {formatRange(
              range.start,
              range.end
            )}
          </Text>

          {summaryPeriod !==
            'custom' && (
            <TouchableOpacity
              style={
                styles.arrowButton
              }
              onPress={() =>
                movePeriod(1)
              }
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color="#111827"
              />
            </TouchableOpacity>
          )}
        </View>

        <View
          style={
            styles.chartCard
          }
        >
          <ExpenseDonut
            total={total}
            items={breakdown.map(
              (item) => ({
                value:
                  item.value,
                color:
                  item.color,
              })
            )}
          />

          <Text
            style={
              styles.periodTotalLabel
            }
          >
            Total del periodo
          </Text>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Categorías
        </Text>

        <View
          style={
            styles.categoryGrid
          }
        >
          {breakdown.map(
            (item) => {
              const percentage =
                total > 0
                  ? (item.value /
                      total) *
                    100
                  : 0;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={
                    styles.categoryCard
                  }
                  onPress={() =>
                    setSelectedCategory(
                      item
                    )
                  }
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor:
                          `${item.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        item.icon as any
                      }
                      size={28}
                      color={
                        item.color
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.categoryInfo
                    }
                  >
                    <Text
                      style={
                        styles.categoryName
                      }
                    >
                      {
                        item.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.categoryAmount
                      }
                    >
                      {formatMoney(
                        item.value
                      )}
                    </Text>

                    <Text
                      style={
                        styles.categoryPercentage
                      }
                    >
                      {percentage.toFixed(
                        1
                      )}
                      %
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              );
            }
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddExpense}
        >
          <Text
            style={
              styles.addButtonText
            }
          >
            ＋ Añadir gasto
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={
          customModalVisible
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setCustomModalVisible(
            false
          )
        }
      >
        <SafeAreaView
          style={styles.modalSafe}
        >
          <View
            style={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Periodo personalizado
            </Text>

            <Text style={styles.label}>
              Desde
            </Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setChoosingStart(
                  true
                )
              }
            >
              <Text>
                {customStart.toLocaleDateString(
                  'es-ES'
                )}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>
              Hasta
            </Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setChoosingEnd(
                  true
                )
              }
            >
              <Text>
                {customEnd.toLocaleDateString(
                  'es-ES'
                )}
              </Text>
            </TouchableOpacity>

            {choosingStart && (
              <DateTimePicker
                value={customStart}
                mode="date"
                presentation="dialog"
                onValueChange={(
                  _event,
                  value
                ) => {
                  setCustomStart(
                    value
                  );
                  setChoosingStart(
                    false
                  );
                }}
                onDismiss={() =>
                  setChoosingStart(
                    false
                  )
                }
              />
            )}

            {choosingEnd && (
              <DateTimePicker
                value={customEnd}
                mode="date"
                presentation="dialog"
                onValueChange={(
                  _event,
                  value
                ) => {
                  setCustomEnd(
                    value
                  );
                  setChoosingEnd(
                    false
                  );
                }}
                onDismiss={() =>
                  setChoosingEnd(
                    false
                  )
                }
              />
            )}

            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={async () => {
                if (
                  customEnd.getTime() <
                  customStart.getTime()
                ) {
                  Alert.alert(
                    'Periodo incorrecto',
                    'La fecha final debe ser posterior a la inicial.'
                  );
                  return;
                }

                await setCustomPeriod(
                  customStart,
                  customEnd
                );

                setCustomModalVisible(
                  false
                );
              }}
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Ver periodo
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={
          selectedCategory !==
          null
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setSelectedCategory(
            null
          )
        }
      >
        <SafeAreaView
          style={styles.modalSafe}
        >
          <ScrollView
            contentContainerStyle={
              styles.modalContent
            }
          >
            {selectedCategory && (
              <>
                <View
                  style={
                    styles.categoryDetailHeader
                  }
                >
                  <View
                    style={[
                      styles.categoryIconLarge,
                      {
                        backgroundColor:
                          `${selectedCategory.color}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedCategory.icon as any
                      }
                      size={34}
                      color={
                        selectedCategory.color
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {
                        selectedCategory.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.categoryDetailTotal
                      }
                    >
                      {formatMoney(
                        selectedCategory.value
                      )}
                    </Text>
                  </View>
                </View>

                {selectedCategory.expenses.map(
                  (expense) => (
                    <TouchableOpacity
                      key={
                        expense.id
                      }
                      style={
                        styles.expenseRow
                      }
                      onPress={() =>
                        openExpense(
                          expense
                        )
                      }
                    >
                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.expenseName
                          }
                        >
                          {
                            expense.description
                          }
                        </Text>

                        <Text
                          style={
                            styles.expenseDate
                          }
                        >
                          {expense.transactionDate.toLocaleDateString(
                            'es-ES'
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.expenseAmount
                        }
                      >
                        {formatMoney(
                          expense.amount
                        )}
                      </Text>
                    </TouchableOpacity>
                  )
                )}

                <TouchableOpacity
                  style={
                    styles.closeButton
                  }
                  onPress={() =>
                    setSelectedCategory(
                      null
                    )
                  }
                >
                  <Text>
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={
          editingExpense !==
          null
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setEditingExpense(
            null
          )
        }
      >
        <SafeAreaView
          style={styles.modalSafe}
        >
          <ScrollView
            contentContainerStyle={
              styles.modalContent
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Editar gasto
            </Text>

            <Text style={styles.label}>
              Descripción
            </Text>

            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={
                setEditDescription
              }
            />

            <Text style={styles.label}>
              Importe
            </Text>

            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={
                setEditAmount
              }
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>
              Fecha
            </Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setEditDatePicker(
                  true
                )
              }
            >
              <Text>
                {editDate.toLocaleDateString(
                  'es-ES'
                )}
              </Text>
            </TouchableOpacity>

            {editDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                presentation="dialog"
                onValueChange={(
                  _event,
                  value
                ) => {
                  setEditDate(
                    value
                  );

                  setEditDatePicker(
                    false
                  );
                }}
                onDismiss={() =>
                  setEditDatePicker(
                    false
                  )
                }
              />
            )}

            <Text style={styles.label}>
              Categoría
            </Text>

            <View
              style={
                styles.editCategoryList
              }
            >
              {categories.map(
                (category) => (
                  <TouchableOpacity
                    key={
                      category.id
                    }
                    style={[
                      styles.editCategoryChip,
                      editCategoryId ===
                        category.id && {
                        backgroundColor:
                          category.color,
                        borderColor:
                          category.color,
                      },
                    ]}
                    onPress={() =>
                      setEditCategoryId(
                        category.id
                      )
                    }
                  >
                    <Text
                      style={{
                        color:
                          editCategoryId ===
                          category.id
                            ? '#FFFFFF'
                            : '#374151',
                      }}
                    >
                      {
                        category.name
                      }
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={() => {
                void saveEditedExpense();
              }}
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Guardar cambios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.deleteButton
              }
              onPress={() => {
                if (
                  !editingExpense
                ) {
                  return;
                }

                Alert.alert(
                  'Eliminar gasto',
                  '¿Seguro que quieres eliminarlo?',
                  [
                    {
                      text: 'Cancelar',
                    },
                    {
                      text: 'Eliminar',
                      style:
                        'destructive',
                      onPress:
                        async () => {
                          await deleteExpense(
                            editingExpense.id
                          );

                          setEditingExpense(
                            null
                          );
                        },
                    },
                  ]
                );
              }}
            >
              <Text
                style={
                  styles.deleteText
                }
              >
                Eliminar gasto
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  header: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },

  logoutText: {
    color: '#374151',
    fontWeight: '600',
  },

  periodSelector: {
    marginTop: 22,
    gap: 8,
  },

  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },

  periodButtonActive: {
    backgroundColor: '#111827',
  },

  periodText: {
    fontSize: 13,
    color: '#6B7280',
  },

  periodTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  rangeNavigator: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  rangeText: {
    flex: 1,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  chartCard: {
    marginTop: 18,
    padding: 20,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  periodTotalLabel: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  categoryGrid: {
    gap: 10,
  },

  categoryCard: {
    minHeight: 92,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  categoryIcon: {
    width: 58,
    height: 58,
    marginRight: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  categoryAmount: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },

  categoryPercentage: {
    marginTop: 2,
    fontSize: 12,
    color: '#9CA3AF',
  },

  addButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#111827',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  modalSafe: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  modalContent: {
    padding: 22,
    paddingBottom: 60,
  },

  modalTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#111827',
  },

  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },

  saveButton: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#111827',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  deleteButton: {
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },

  deleteText: {
    color: '#DC2626',
    fontWeight: '600',
  },

  categoryDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },

  categoryIconLarge: {
    width: 70,
    height: 70,
    marginRight: 16,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryDetailTotal: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },

  expenseRow: {
    marginBottom: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },

  expenseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  expenseDate: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },

  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  closeButton: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },

  editCategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  editCategoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
});



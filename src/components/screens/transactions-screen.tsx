import DateTimePicker from '@expo/ui/community/datetime-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Expense,
  useExpenses,
} from '../../context/expenses-context';

import {
  useCategories,
} from '../../context/categories-context';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

function sectionTitle(date: Date) {
  const today =
    startOfDay(new Date());

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  if (
    date.getTime() ===
    today.getTime()
  ) {
    return 'Hoy';
  }

  if (
    date.getTime() ===
    yesterday.getTime()
  ) {
    return 'Ayer';
  }

  return new Intl.DateTimeFormat(
    'es-ES',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }
  ).format(date);
}

export default function TransactionsScreen() {
  const {
    expenses,
    updateExpense,
    deleteExpense,
  } = useExpenses();

  const {
    categories,
    getCategoryById,
  } = useCategories();

  const [editing, setEditing] =
    useState<Expense | null>(
      null
    );

  const [
    description,
    setDescription,
  ] = useState('');

  const [amount, setAmount] =
    useState('');

  const [
    categoryId,
    setCategoryId,
  ] = useState('');

  const [
    transactionDate,
    setTransactionDate,
  ] = useState(
    new Date()
  );

  const [
    showDatePicker,
    setShowDatePicker,
  ] = useState(false);

  const [
    categoryPickerVisible,
    setCategoryPickerVisible,
  ] = useState(false);

  const [
    categorySearch,
    setCategorySearch,
  ] = useState('');

  const selectedCategory =
    getCategoryById(
      categoryId
    );

  const normalizedSearch =
    categorySearch
      .trim()
      .toLocaleLowerCase(
        'es-ES'
      );

  const filteredCategories =
    categories.filter(
      (category) => {
        if (
          !normalizedSearch
        ) {
          return true;
        }

        const text =
          `${category.name} ${category.description}`
            .toLocaleLowerCase(
              'es-ES'
            );

        return text.includes(
          normalizedSearch
        );
      }
    );

  function openExpense(
    expense: Expense
  ) {
    setEditing(expense);

    setDescription(
      expense.description
    );

    setAmount(
      expense.amount.toString()
    );

    setCategoryId(
      expense.categoryId
    );

    setTransactionDate(
      expense.transactionDate
    );

    setCategorySearch('');
    setCategoryPickerVisible(
      false
    );
  }

  async function saveExpense() {
    if (!editing) {
      return;
    }

    const parsed =
      Number(
        amount.replace(
          ',',
          '.'
        )
      );

    if (
      !categoryId ||
      !parsed ||
      parsed <= 0
    ) {
      Alert.alert(
        'Datos incompletos',
        'Revisa el importe y la categoría.'
      );

      return;
    }

    const future =
      startOfDay(
        transactionDate
      ).getTime() >
      startOfDay(
        new Date()
      ).getTime();

    try {
      await updateExpense(
        editing.id,
        {
          description,
          amount: parsed,
          categoryId,
          transactionDate,
          status:
            future
              ? 'planned'
              : 'completed',
          source:
            editing.source,
        }
      );

      setEditing(null);
    } catch {
      Alert.alert(
        'Error',
        'No se pudo actualizar el gasto.'
      );
    }
  }

  function confirmDelete() {
    if (!editing) {
      return;
    }

    Alert.alert(
      'Eliminar gasto',
      '¿Seguro que quieres eliminar este gasto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress:
            async () => {
              await deleteExpense(
                editing.id
              );

              setEditing(null);
            },
        },
      ]
    );
  }

  const grouped =
    new Map<
      string,
      Expense[]
    >();

  expenses.forEach(
    (expense) => {
      const date =
        startOfDay(
          expense.transactionDate
        );

      const key =
        date.toISOString();

      grouped.set(
        key,
        [
          ...(grouped.get(
            key
          ) ?? []),
          expense,
        ]
      );
    }
  );

  const sections =
    Array.from(
      grouped.entries()
    )
      .map(
        ([key, data]) => ({
          title:
            sectionTitle(
              new Date(key)
            ),
          date:
            new Date(key),
          data,
        })
      )
      .sort(
        (a, b) =>
          b.date.getTime() -
          a.date.getTime()
      );

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Movimientos
      </Text>

      <Text
        style={styles.subtitle}
      >
        Toca cualquier gasto para editarlo.
      </Text>

      <SectionList
        sections={sections}
        keyExtractor={
          (item) => item.id
        }
        contentContainerStyle={
          styles.list
        }
        stickySectionHeadersEnabled={
          false
        }
        renderSectionHeader={({
          section,
        }) => (
          <Text
            style={
              styles.sectionTitle
            }
          >
            {section.title}
          </Text>
        )}
        renderItem={({
          item,
        }) => {
          const category =
            getCategoryById(
              item.categoryId
            );

          return (
            <TouchableOpacity
              style={[
                styles.card,
                item.status ===
                  'planned' &&
                  styles.cardPlanned,
              ]}
              onPress={() =>
                openExpense(item)
              }
            >
              <View
                style={[
                  styles.transactionIcon,
                  {
                    backgroundColor:
                      `${
                        category?.color ??
                        '#6366F1'
                      }18`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    (
                      category?.icon ??
                      'pricetag-outline'
                    ) as any
                  }
                  size={21}
                  color={
                    category?.color ??
                    '#6366F1'
                  }
                />
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.description
                  }
                >
                  {
                    item.description ||
                    category?.name ||
                    'Gasto'
                  }
                </Text>

                <Text
                  style={[
                    styles.category,
                    {
                      color:
                        category?.color ??
                        '#6366F1',
                    },
                  ]}
                >
                  {category?.name ??
                    'Sin categoría'}
                </Text>
              </View>

              <Text
                style={styles.amount}
              >
                {formatMoney(
                  item.amount
                )}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={
          editing !== null
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setEditing(null)
        }
      >
        <SafeAreaView
          style={styles.modalSafe}
        >
          <ScrollView
            contentContainerStyle={
              styles.modalContent
            }
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Editar gasto
              </Text>

              <TouchableOpacity
                style={
                  styles.headerClose
                }
                onPress={() =>
                  setEditing(null)
                }
              >
                <Ionicons
                  name="close"
                  size={22}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <Text
              style={styles.label}
            >
              Concepto
            </Text>

            <TextInput
              style={styles.input}
              value={description}
              onChangeText={
                setDescription
              }
              placeholder="Descripción opcional"
              placeholderTextColor="#9CA3AF"
            />

            <Text
              style={styles.label}
            >
              Importe
            </Text>

            <View
              style={
                styles.amountInputContainer
              }
            >
              <Text
                style={
                  styles.currencySymbol
                }
              >
                €
              </Text>

              <TextInput
                style={
                  styles.amountInput
                }
                value={amount}
                onChangeText={
                  setAmount
                }
                keyboardType="decimal-pad"
              />
            </View>

            <Text
              style={styles.label}
            >
              Fecha
            </Text>

            <TouchableOpacity
              style={
                styles.selectorRow
              }
              onPress={() =>
                setShowDatePicker(
                  true
                )
              }
            >
              <View
                style={
                  styles.selectorIconNeutral
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color="#4F46E5"
                />
              </View>

              <Text
                style={
                  styles.selectorText
                }
              >
                {formatDate(
                  transactionDate
                )}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={
                  transactionDate
                }
                mode="date"
                presentation="dialog"
                onValueChange={(
                  _event,
                  value
                ) => {
                  setTransactionDate(
                    value
                  );

                  setShowDatePicker(
                    false
                  );
                }}
                onDismiss={() =>
                  setShowDatePicker(
                    false
                  )
                }
              />
            )}

            <Text
              style={styles.label}
            >
              Categoría
            </Text>

            <TouchableOpacity
              style={
                styles.selectorRow
              }
              onPress={() => {
                setCategorySearch('');
                setCategoryPickerVisible(
                  true
                );
              }}
            >
              <View
                style={[
                  styles.selectorCategoryIcon,
                  {
                    backgroundColor:
                      `${
                        selectedCategory?.color ??
                        '#6366F1'
                      }18`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    (
                      selectedCategory?.icon ??
                      'pricetag-outline'
                    ) as any
                  }
                  size={22}
                  color={
                    selectedCategory?.color ??
                    '#6366F1'
                  }
                />
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.selectorText
                  }
                >
                  {selectedCategory?.name ??
                    'Seleccionar categoría'}
                </Text>

                {selectedCategory && (
                  <Text
                    style={
                      styles.selectorDescription
                    }
                    numberOfLines={1}
                  >
                    {
                      selectedCategory.description
                    }
                  </Text>
                )}
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={() => {
                void saveExpense();
              }}
            >
              <Text
                style={
                  styles.saveText
                }
              >
                Guardar cambios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.deleteButton
              }
              onPress={
                confirmDelete
              }
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color="#DC2626"
              />

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

      <Modal
        visible={
          categoryPickerVisible
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setCategoryPickerVisible(
            false
          )
        }
      >
        <SafeAreaView
          style={
            styles.categoryModalSafe
          }
        >
          <View
            style={
              styles.categoryModalHeader
            }
          >
            <View>
              <Text
                style={
                  styles.categoryModalTitle
                }
              >
                Cambiar categoría
              </Text>

              <Text
                style={
                  styles.categoryModalSubtitle
                }
              >
                Busca o selecciona una categoría.
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.headerClose
              }
              onPress={() =>
                setCategoryPickerVisible(
                  false
                )
              }
            >
              <Ionicons
                name="close"
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          </View>

          <View
            style={
              styles.categorySearch
            }
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#9CA3AF"
            />

            <TextInput
              style={
                styles.categorySearchInput
              }
              value={
                categorySearch
              }
              onChangeText={
                setCategorySearch
              }
              placeholder="Buscar categoría..."
              placeholderTextColor="#9CA3AF"
            />

            {categorySearch.length >
              0 && (
              <TouchableOpacity
                onPress={() =>
                  setCategorySearch(
                    ''
                  )
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

          <ScrollView
            contentContainerStyle={
              styles.categoryPickerList
            }
            keyboardShouldPersistTaps="handled"
          >
            {filteredCategories.map(
              (category) => {
                const selected =
                  category.id ===
                  categoryId;

                return (
                  <TouchableOpacity
                    key={
                      category.id
                    }
                    style={[
                      styles.categoryPickerCard,
                      selected && {
                        borderColor:
                          category.color,
                        backgroundColor:
                          `${category.color}0D`,
                      },
                    ]}
                    onPress={() => {
                      setCategoryId(
                        category.id
                      );

                      setCategoryPickerVisible(
                        false
                      );
                    }}
                  >
                    <View
                      style={[
                        styles.categoryPickerIcon,
                        {
                          backgroundColor:
                            `${category.color}18`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          category.icon as any
                        }
                        size={23}
                        color={
                          category.color
                        }
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.categoryPickerName
                        }
                      >
                        {
                          category.name
                        }
                      </Text>

                      <Text
                        style={
                          styles.categoryPickerDescription
                        }
                        numberOfLines={1}
                      >
                        {
                          category.description
                        }
                      </Text>
                    </View>

                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={
                          category.color
                        }
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#D1D5DB"
                      />
                    )}
                  </TouchableOpacity>
                );
              }
            )}

            {filteredCategories.length ===
              0 && (
              <View
                style={
                  styles.emptySearch
                }
              >
                <Ionicons
                  name="search-outline"
                  size={28}
                  color="#9CA3AF"
                />

                <Text
                  style={
                    styles.emptySearchText
                  }
                >
                  No encontramos ninguna categoría.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F6F7F9',
      paddingHorizontal:
        20,
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

    sectionTitle: {
      marginTop: 12,
      marginBottom: 8,
      fontSize: 17,
      fontWeight: '700',
      color: '#374151',
      textTransform:
        'capitalize',
    },

    card: {
      marginBottom: 9,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
      gap: 12,
    },

    cardPlanned: {
      backgroundColor:
        '#FFF7ED',
    },

    transactionIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
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

    modalSafe: {
      flex: 1,
      backgroundColor:
        '#F6F7F9',
    },

    modalContent: {
      padding: 22,
      paddingBottom: 60,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    modalTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
    },

    headerClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
    },

    label: {
      marginTop: 18,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },

    input: {
      minHeight: 54,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
    },

    amountInputContainer: {
      minHeight: 56,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
    },

    currencySymbol: {
      marginRight: 10,
      fontSize: 19,
      fontWeight: '700',
      color: '#6B7280',
    },

    amountInput: {
      flex: 1,
      height: 56,
      fontSize: 21,
      fontWeight: '700',
      color: '#111827',
    },

    selectorRow: {
      minHeight: 66,
      padding: 12,
      borderRadius: 15,
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },

    selectorIconNeutral: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    selectorCategoryIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    selectorText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
    },

    selectorDescription: {
      marginTop: 3,
      paddingRight: 10,
      fontSize: 12,
      color: '#6B7280',
    },

    saveButton: {
      marginTop: 30,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor:
        '#111827',
    },

    saveText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    deleteButton: {
      marginTop: 12,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        '#FCA5A5',
      flexDirection: 'row',
      gap: 7,
    },

    deleteText: {
      color: '#DC2626',
      fontWeight: '600',
    },

    categoryModalSafe: {
      flex: 1,
      backgroundColor:
        '#F6F7F9',
    },

    categoryModalHeader: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    categoryModalTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: '#111827',
    },

    categoryModalSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: '#6B7280',
    },

    categorySearch: {
      marginHorizontal: 20,
      height: 48,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    categorySearchInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: '#111827',
    },

    categoryPickerList: {
      padding: 20,
      paddingBottom: 60,
      gap: 9,
    },

    categoryPickerCard: {
      minHeight: 66,
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        'transparent',
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    categoryPickerIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    categoryPickerName: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
    },

    categoryPickerDescription: {
      marginTop: 3,
      fontSize: 12,
      color: '#6B7280',
    },

    emptySearch: {
      paddingVertical: 50,
      alignItems: 'center',
      gap: 9,
    },

    emptySearchText: {
      fontSize: 14,
      color: '#9CA3AF',
    },
  });







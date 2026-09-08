import DateTimePicker from '@expo/ui/community/datetime-picker';
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
import { useCategories } from '../../context/categories-context';

function startOfDay(
  date: Date
) {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    'es-ES',
    {
      style: 'currency',
      currency: 'EUR',
    }
  ).format(value);
}

function formatDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

function sectionTitle(
  date: Date
) {
  const today =
    startOfDay(
      new Date()
    );

  const yesterday =
    new Date(today);

  yesterday.setDate(
    yesterday.getDate() -
      1
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

  const [
    editing,
    setEditing,
  ] =
    useState<Expense | null>(
      null
    );

  const [
    description,
    setDescription,
  ] =
    useState('');

  const [amount, setAmount] =
    useState('');

  const [
    categoryId,
    setCategoryId,
  ] =
    useState('');

  const [
    transactionDate,
    setTransactionDate,
  ] =
    useState(new Date());

  const [
    showDatePicker,
    setShowDatePicker,
  ] =
    useState(false);

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
        'Revisa descripción, importe y categoría.'
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

              setEditing(
                null
              );
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
      <Text
        style={styles.title}
      >
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
          (item) =>
            item.id
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
                openExpense(
                  item
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
                    styles.description
                  }
                >
                  {
                    item.description
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
                style={
                  styles.amount
                }
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
          style={
            styles.modalSafe
          }
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
              value={description}
              onChangeText={
                setDescription
              }
            />

            <Text style={styles.label}>
              Importe
            </Text>

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={
                setAmount
              }
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>
              Fecha
            </Text>

            <TouchableOpacity
              style={styles.input}
              onPress={() =>
                setShowDatePicker(
                  true
                )
              }
            >
              <Text>
                {formatDate(
                  transactionDate
                )}
              </Text>
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

            <Text style={styles.label}>
              Categoría
            </Text>

            <View
              style={
                styles.categoryList
              }
            >
              {categories.map(
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
                        styles.categoryChip,
                        selected && {
                          backgroundColor:
                            category.color,
                          borderColor:
                            category.color,
                        },
                      ]}
                      onPress={() =>
                        setCategoryId(
                          category.id
                        )
                      }
                    >
                      <Text
                        style={{
                          color:
                            selected
                              ? '#FFFFFF'
                              : '#374151',
                          fontWeight:
                            '600',
                        }}
                      >
                        {
                          category.name
                        }
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

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
              <Text
                style={
                  styles.deleteText
                }
              >
                Eliminar gasto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setEditing(null)
              }
            >
              <Text>
                Cancelar
              </Text>
            </TouchableOpacity>
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
      padding: 17,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
    },

    cardPlanned: {
      backgroundColor:
        '#FFF7ED',
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

    modalTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 20,
    },

    label: {
      marginTop: 14,
      marginBottom: 7,
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },

    input: {
      minHeight: 52,
      paddingHorizontal: 15,
      justifyContent:
        'center',
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
    },

    categoryList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    categoryChip: {
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
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
      fontWeight: '700',
    },

    deleteButton: {
      marginTop: 12,
      paddingVertical: 15,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#FCA5A5',
    },

    deleteText: {
      color: '#DC2626',
      fontWeight: '600',
    },

    closeButton: {
      marginTop: 12,
      paddingVertical: 15,
      alignItems: 'center',
    },
  });



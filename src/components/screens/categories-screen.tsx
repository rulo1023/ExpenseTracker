import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Category,
  useCategories,
} from '../../context/categories-context';

const COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#EC4899',
  '#64748B',
];

const ICONS = [
  'basket-outline',
  'restaurant-outline',
  'cafe-outline',
  'car-outline',
  'bus-outline',
  'airplane-outline',
  'home-outline',
  'game-controller-outline',
  'fitness-outline',
  'medical-outline',
  'gift-outline',
  'school-outline',
  'briefcase-outline',
  'paw-outline',
  'sparkles-outline',
  'shirt-outline',
  'phone-portrait-outline',
  'card-outline',
] as const;

export default function CategoriesScreen() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [editing, setEditing] =
    useState<Category | null>(null);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [name, setName] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [icon, setIcon] =
    useState<string>(
      'pricetag-outline'
    );

  const [color, setColor] =
    useState('#6366F1');

  const [saving, setSaving] =
    useState(false);

  function openNew() {
    setEditing(null);
    setName('');
    setDescription('');
    setIcon(
      'pricetag-outline'
    );
    setColor('#6366F1');
    setModalVisible(true);
  }

  function openEdit(
    category: Category
  ) {
    setEditing(category);
    setName(category.name);
    setDescription(
      category.description
    );
    setIcon(category.icon);
    setColor(category.color);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(
        'Falta el nombre',
        'Introduce un nombre.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Falta la descripción',
        'Describe qué gastos pertenecen a esta categoría.'
      );
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await updateCategory(
          editing.id,
          {
            name,
            description,
            icon,
            color,
          }
        );
      } else {
        await addCategory(
          name,
          description,
          icon,
          color
        );
      }

      setModalVisible(false);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'No se pudo guardar la categoría.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!editing) {
      return;
    }

    Alert.alert(
      'Eliminar categoría',
      'Solo podrás eliminarla si no tiene gastos asociados.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(
                editing.id
              );

              setModalVisible(
                false
              );
            } catch {
              Alert.alert(
                'No se puede eliminar',
                'Esta categoría tiene gastos asociados.'
              );
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Categorías
          </Text>

          <Text
            style={styles.subtitle}
          >
            Personaliza cómo organizas tu dinero.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newButton}
          onPress={openNew}
        >
          <Ionicons
            name="add"
            size={21}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.list
        }
      >
        {categories.map(
          (category) => (
            <TouchableOpacity
              key={category.id}
              style={
                styles.categoryCard
              }
              onPress={() =>
                openEdit(category)
              }
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      `${category.color}20`,
                  },
                ]}
              >
                <Ionicons
                  name={
                    category.icon as any
                  }
                  size={24}
                  color={
                    category.color
                  }
                />
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.categoryName
                  }
                >
                  {category.name}
                </Text>

                <Text
                  style={
                    styles.categoryDescription
                  }
                  numberOfLines={2}
                >
                  {
                    category.description
                  }
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <SafeAreaView
          style={styles.modalSafe}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : 'height'
            }
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
                <TouchableOpacity
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.cancelText
                    }
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {editing
                    ? 'Editar categoría'
                    : 'Nueva categoría'}
                </Text>

                <View
                  style={{ width: 60 }}
                />
              </View>

              <View
                style={
                  styles.preview
                }
              >
                <View
                  style={[
                    styles.previewIcon,
                    {
                      backgroundColor:
                        `${color}20`,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={34}
                    color={color}
                  />
                </View>

                <Text
                  style={
                    styles.previewName
                  }
                >
                  {name ||
                    'Categoría'}
                </Text>
              </View>

              <Text style={styles.label}>
                Nombre
              </Text>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Transporte"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>
                Descripción
              </Text>

              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={
                  setDescription
                }
                multiline
                textAlignVertical="top"
                placeholder="Describe con tus palabras qué gastos pertenecen aquí."
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>
                Icono
              </Text>

              <View
                style={
                  styles.iconGrid
                }
              >
                {ICONS.map(
                  (item) => {
                    const selected =
                      item === icon;

                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.iconOption,
                          selected && {
                            borderColor:
                              color,
                            backgroundColor:
                              `${color}15`,
                          },
                        ]}
                        onPress={() =>
                          setIcon(
                            item
                          )
                        }
                      >
                        <Ionicons
                          name={item}
                          size={25}
                          color={
                            selected
                              ? color
                              : '#6B7280'
                          }
                        />
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              <Text style={styles.label}>
                Color
              </Text>

              <View
                style={
                  styles.colorGrid
                }
              >
                {COLORS.map(
                  (item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.colorCircle,
                        {
                          backgroundColor:
                            item,
                        },
                        item ===
                          color &&
                          styles.colorSelected,
                      ]}
                      onPress={() =>
                        setColor(item)
                      }
                    >
                      {item ===
                        color && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color="#FFFFFF"
                        />
                      )}
                    </TouchableOpacity>
                  )
                )}
              </View>

              <TouchableOpacity
                style={
                  styles.saveButton
                }
                disabled={saving}
                onPress={() => {
                  void handleSave();
                }}
              >
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {saving
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>

              {editing && (
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
                    Eliminar categoría
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#F6F7F9',
    },

    header: {
      paddingHorizontal: 20,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    title: {
      fontSize: 30,
      fontWeight: '700',
      color: '#111827',
    },

    subtitle: {
      marginTop: 5,
      fontSize: 14,
      color: '#6B7280',
    },

    newButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        '#111827',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    list: {
      padding: 20,
      paddingBottom: 120,
      gap: 10,
    },

    categoryCard: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 17,
      backgroundColor:
        '#FFFFFF',
    },

    iconCircle: {
      width: 50,
      height: 50,
      marginRight: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    categoryName: {
      fontSize: 17,
      fontWeight: '600',
      color: '#111827',
    },

    categoryDescription: {
      marginTop: 4,
      paddingRight: 10,
      fontSize: 13,
      lineHeight: 18,
      color: '#6B7280',
    },

    modalSafe: {
      flex: 1,
      backgroundColor:
        '#F6F7F9',
    },

    modalContent: {
      padding: 20,
      paddingBottom: 60,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 26,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
    },

    cancelText: {
      width: 60,
      color: '#6366F1',
    },

    preview: {
      alignItems: 'center',
      marginBottom: 30,
    },

    previewIcon: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    previewName: {
      marginTop: 10,
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
    },

    label: {
      marginTop: 16,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },

    input: {
      padding: 16,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
    },

    textArea: {
      minHeight: 110,
      padding: 16,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
    },

    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    iconOption: {
      width: 48,
      height: 48,
      borderWidth: 2,
      borderColor:
        'transparent',
      borderRadius: 15,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },

    colorCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    colorSelected: {
      borderWidth: 3,
      borderColor:
        '#111827',
    },

    saveButton: {
      marginTop: 30,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 14,
      backgroundColor:
        '#111827',
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },

    deleteButton: {
      marginTop: 14,
      paddingVertical: 15,
      alignItems: 'center',
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#FCA5A5',
    },

    deleteText: {
      color: '#DC2626',
      fontWeight: '600',
    },
  });

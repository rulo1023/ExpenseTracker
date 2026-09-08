import { useState } from 'react';
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

import { useCategories } from '../../context/categories-context';

export default function CategoriesScreen() {
  const {
    categories,
    addCategory,
    loading,
  } = useCategories();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(
        'Falta el nombre',
        'Introduce un nombre para la categoría.'
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Falta la descripción',
        'Describe qué tipo de gastos pertenecen a esta categoría.'
      );
      return;
    }

    try {
      setSaving(true);

      await addCategory(
        name.trim(),
        description.trim()
      );

      setName('');
      setDescription('');
      setCreating(false);

      Alert.alert(
        'Categoría creada',
        'La categoría se ha guardado correctamente.'
      );
    } catch (error) {
      console.error(
        'Error creating category:',
        error
      );

      Alert.alert(
        'Error',
        'No se pudo crear la categoría.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName('');
    setDescription('');
    setCreating(false);
  }

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
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                Categorías
              </Text>

              <Text style={styles.subtitle}>
                Describe tus categorías con tus propias palabras.
              </Text>
            </View>

            {!creating && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setCreating(true)}
              >
                <Text style={styles.addButtonText}>
                  ＋ Nueva
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {creating && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                Nueva categoría
              </Text>

              <Text style={styles.label}>
                Nombre
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ej: Transporte"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="next"
                cursorColor="#111827"
                selectionColor="#D1D5DB"
              />

              <Text style={styles.label}>
                Descripción
              </Text>

              <TextInput
                style={styles.textArea}
                placeholder="Ej: Metro, autobús, taxi, gasolina y otros desplazamientos."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                cursorColor="#111827"
                selectionColor="#D1D5DB"
              />

              <Text style={styles.help}>
                Más adelante la IA utilizará esta descripción para decidir automáticamente dónde clasificar tus gastos.
              </Text>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  disabled={saving}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                  ]}
                  disabled={saving}
                  onPress={() => {
                    void handleSave();
                  }}
                >
                  <Text style={styles.saveButtonText}>
                    {saving
                      ? 'Guardando...'
                      : 'Guardar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loading && categories.length === 0 ? (
            <Text style={styles.emptyText}>
              Cargando categorías...
            </Text>
          ) : categories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                No tienes categorías
              </Text>

              <Text style={styles.emptyText}>
                Crea tu primera categoría para empezar a organizar tus gastos.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {categories.map((category) => (
                <View
                  key={category.id}
                  style={styles.categoryCard}
                >
                  <View style={styles.categoryIcon}>
                    <Text style={styles.categoryIconText}>
                      {category.name
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryName}>
                      {category.name}
                    </Text>

                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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

  header: {
    marginTop: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    color: '#6B7280',
  },

  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  formCard: {
    marginBottom: 22,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  formTitle: {
    marginBottom: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#F6F7F9',
    fontSize: 16,
    color: '#111827',
  },

  textArea: {
    minHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#F6F7F9',
    fontSize: 16,
    color: '#111827',
  },

  help: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#9CA3AF',
  },

  formActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },

  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },

  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#111827',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.6,
  },

  list: {
    gap: 12,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  categoryIcon: {
    width: 44,
    height: 44,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
  },

  categoryIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4338CA',
  },

  categoryContent: {
    flex: 1,
  },

  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },

  categoryDescription: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },

  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
  },
});

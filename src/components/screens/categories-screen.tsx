import { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategories } from '../../context/categories-context';

export default function CategoriesScreen() {
  const { categories, addCategory } = useCategories();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const descriptionRef = useRef<TextInput>(null);

  function handleSave() {
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

    addCategory(name, description);

    setName('');
    setDescription('');
    setCreating(false);
  }

  return (
          <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>Categorías</Text>

              <Text style={styles.subtitle}>
                Define tus categorías con tus propias palabras.
              </Text>

              {creating ? (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>
                    Nueva categoría
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() =>
                      descriptionRef.current?.focus()
                    }
                  />

                  <TextInput
                    ref={descriptionRef}
                    style={[styles.input, styles.descriptionInput]}
                    placeholder="Ej: Comidas y compras fuera de la rutina"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                  />

                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setName('');
                        setDescription('');
                        setCreating(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}
                    >
                      <Text style={styles.saveButtonText}>
                        Guardar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.newButton}
                  onPress={() => setCreating(true)}
                >
                  <Text style={styles.newButtonText}>
                    ＋ Nueva categoría
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.sectionTitle}>
                Tus categorías
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.categoryCard}>
              <Text style={styles.categoryName}>
                {item.name}
              </Text>

              <Text style={styles.categoryDescription}>
                {item.description}
              </Text>
            </View>
          )}
        />
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
    lineHeight: 21,
    color: '#6B7280',
  },

  newButton: {
    marginTop: 22,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },

  newButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },

  categoryCard: {
    padding: 20,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  categoryDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },

  form: {
    marginTop: 22,
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  formTitle: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  input: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    fontSize: 16,
    color: '#111827',
  },

  descriptionInput: {
    minHeight: 100,
  },

  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },

  cancelButtonText: {
    fontWeight: '600',
    color: '#4B5563',
  },

  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#111827',
  },

  saveButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

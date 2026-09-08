import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddExpenseScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Añadir gasto</Text>
      <Text style={styles.subtitle}>
        Escríbelo como quieras.
      </Text>

      <View style={styles.aiCard}>
        <Text style={styles.aiLabel}>✨ Introducir con lenguaje natural</Text>

        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ej: Ayer cené fuera y gasté 24 euros"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity style={styles.aiButton}>
          <Text style={styles.aiButtonText}>Interpretar gasto</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.separator}>o introduce los datos manualmente</Text>

      <TextInput
        style={styles.input}
        placeholder="Descripción"
        placeholderTextColor="#9CA3AF"
      />

      <TextInput
        style={styles.input}
        placeholder="Importe"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <TouchableOpacity style={styles.manualButton}>
        <Text style={styles.manualButtonText}>Guardar gasto</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    paddingHorizontal: 20,
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
  manualButton: {
    marginTop: 4,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#111827',
  },
  manualButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categories = [
  {
    name: 'Compra',
    description: 'Supermercado, alimentación y productos habituales para casa.',
  },
  {
    name: 'Caprichos',
    description: 'Comidas y compras fuera de la rutina.',
  },
  {
    name: 'Ocio',
    description: 'Actividades y gastos destinados al entretenimiento.',
  },
];

export default function CategoriesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Categorías</Text>
          <Text style={styles.subtitle}>
            Define tus categorías con tus propias palabras.
          </Text>
        </View>
      </View>

      {categories.map((category) => (
        <View key={category.name} style={styles.categoryCard}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryDescription}>
            {category.description}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>＋ Nueva categoría</Text>
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
  header: {
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
    maxWidth: 320,
  },
  categoryCard: {
    padding: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  categoryDescription: {
    marginTop: 7,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});

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

import { useCategories } from '../context/categories-context';
import { useAppStyles } from '../lib/themed-styles';

type CategoryPickerModalProps = {
  visible: boolean;
  selectedCategoryId: string | null;
  title?: string;
  allowClear?: boolean;
  clearLabel?: string;
  onSelect: (categoryId: string) => void;
  onClear?: () => void;
  onClose: () => void;
};

export default function CategoryPickerModal({
  visible,
  selectedCategoryId,
  title = 'Elegir categoría',
  allowClear = false,
  clearLabel = 'Todas las categorías',
  onSelect,
  onClear,
  onClose,
}: CategoryPickerModalProps) {
  const styles = useAppStyles(lightStyles);
  const { categories } = useCategories();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      setSearch('');
    }
  }, [visible]);

  const normalizedSearch = search
    .trim()
    .toLocaleLowerCase('es-ES');

  const filteredCategories =
    categories.filter((category) => {
      if (!normalizedSearch) {
        return true;
      }

      return `${category.name} ${category.description}`
        .toLocaleLowerCase('es-ES')
        .includes(normalizedSearch);
    });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {title}
            </Text>

            <Text style={styles.subtitle}>
              Busca o selecciona una categoría.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons
              name="close"
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.search}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#9CA3AF"
          />

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar categoría..."
            placeholderTextColor="#9CA3AF"
            autoCorrect={false}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
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
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {allowClear && (
            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.card,
                selectedCategoryId === null &&
                  styles.clearCardSelected,
              ]}
              onPress={() => {
                onClear?.();
                onClose();
              }}
            >
              <View style={styles.clearIcon}>
                <Ionicons
                  name="albums-outline"
                  size={22}
                  color="#6366F1"
                />
              </View>

              <View style={styles.categoryText}>
                <Text style={styles.categoryName}>
                  {clearLabel}
                </Text>

                <Text style={styles.description}>
                  No limitar los resultados por categoría.
                </Text>
              </View>

              <Ionicons
                name={
                  selectedCategoryId === null
                    ? 'checkmark-circle'
                    : 'chevron-forward'
                }
                size={selectedCategoryId === null ? 22 : 18}
                color={
                  selectedCategoryId === null
                    ? '#6366F1'
                    : '#D1D5DB'
                }
              />
            </TouchableOpacity>
          )}

          {filteredCategories.map((category) => {
            const selected =
              category.id === selectedCategoryId;

            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.75}
                style={[
                  styles.card,
                  selected && {
                    borderColor: category.color,
                    backgroundColor: `${category.color}0D`,
                  },
                ]}
                onPress={() => {
                  onSelect(category.id);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor: `${category.color}18`,
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={23}
                    color={category.color}
                  />
                </View>

                <View style={styles.categoryText}>
                  <Text style={styles.categoryName}>
                    {category.name}
                  </Text>

                  <Text
                    style={styles.description}
                    numberOfLines={1}
                  >
                    {category.description}
                  </Text>
                </View>

                <Ionicons
                  name={
                    selected
                      ? 'checkmark-circle'
                      : 'chevron-forward'
                  }
                  size={selected ? 22 : 18}
                  color={
                    selected
                      ? category.color
                      : '#D1D5DB'
                  }
                />
              </TouchableOpacity>
            );
          })}

          {filteredCategories.length === 0 && (
            <View style={styles.empty}>
              <Ionicons
                name="search-outline"
                size={28}
                color="#9CA3AF"
              />

              <Text style={styles.emptyText}>
                No encontramos ninguna categoría.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
    paddingRight: 16,
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

  search: {
    marginHorizontal: 20,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#111827',
  },

  list: {
    padding: 20,
    paddingBottom: 60,
    gap: 9,
  },

  card: {
    minHeight: 66,
    padding: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  clearCardSelected: {
    borderColor: '#818CF8',
    backgroundColor: '#EEF2FF',
  },

  clearIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryText: {
    flex: 1,
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  description: {
    marginTop: 3,
    fontSize: 12,
    color: '#6B7280',
  },

  empty: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 9,
  },

  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

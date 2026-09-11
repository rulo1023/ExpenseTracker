import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CURRENCIES,
  CurrencyCode,
  currencyName,
  useAppSettings,
} from '../context/app-settings-context';
import { useAppStyles } from '../lib/themed-styles';

type CurrencyPickerModalProps = {
  visible: boolean;
  title?: string;
  selected: CurrencyCode;
  onSelect: (currency: CurrencyCode) => void;
  onClose: () => void;
};

export default function CurrencyPickerModal({
  visible,
  title,
  selected,
  onSelect,
  onClose,
}: CurrencyPickerModalProps) {
  const styles = useAppStyles(lightStyles);
  const { language, t } = useAppSettings();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title ?? t('chooseCurrency')}</Text>
            <Text style={styles.subtitle}>{t('commonCurrency')}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {CURRENCIES.map((currency) => {
            const active = currency.code === selected;

            return (
              <TouchableOpacity
                key={currency.code}
                style={[styles.row, active && styles.rowSelected]}
                onPress={() => {
                  onSelect(currency.code);
                  onClose();
                }}
              >
                <View style={styles.symbolBox}>
                  <Text style={styles.symbol}>{currency.symbol}</Text>
                </View>
                <View style={styles.currencyText}>
                  <Text style={styles.currencyName}>{currencyName(currency.code, language)}</Text>
                  <Text style={styles.currencyCode}>{currency.code}</Text>
                </View>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'chevron-forward'}
                  size={active ? 22 : 18}
                  color={active ? '#4F46E5' : '#D1D5DB'}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7F9' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#6B7280' },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 9 },
  row: {
    minHeight: 64,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowSelected: { borderColor: '#818CF8', backgroundColor: '#EEF2FF' },
  symbolBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 16, fontWeight: '800', color: '#374151' },
  currencyText: { flex: 1 },
  currencyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  currencyCode: { marginTop: 3, fontSize: 12, color: '#6B7280' },
});

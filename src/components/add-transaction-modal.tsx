import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppStyles } from '../lib/themed-styles';

export default function AddTransactionModal({ visible, onExpense, onIncome, onClose }: {
  visible: boolean;
  onExpense: () => void;
  onIncome: () => void;
  onClose: () => void;
}) {
  const styles = useAppStyles(lightStyles);
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => undefined}>
        <View style={styles.handle} />
        <Text style={styles.title}>¿Qué quieres añadir?</Text>
        <TouchableOpacity style={styles.option} onPress={onExpense}>
          <View style={[styles.icon, styles.expenseIcon]}><Ionicons name="arrow-up" size={24} color="#DC2626" /></View>
          <View style={styles.flex}><Text style={styles.optionTitle}>Gasto</Text><Text style={styles.optionText}>Compra, factura o cualquier pago</Text></View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={onIncome}>
          <View style={[styles.icon, styles.incomeIcon]}><Ionicons name="arrow-down" size={24} color="#059669" /></View>
          <View style={styles.flex}><Text style={styles.optionTitle}>Ingreso</Text><Text style={styles.optionText}>Nómina, devolución u otra entrada</Text></View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </Pressable>
    </Pressable>
  </Modal>;
}

const lightStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 38, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#F6F7F9' },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: '#D1D5DB', marginBottom: 18 },
  title: { marginBottom: 15, color: '#111827', fontSize: 22, fontWeight: '800' },
  option: { marginTop: 9, padding: 15, borderRadius: 17, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  expenseIcon: { backgroundColor: '#FEF2F2' }, incomeIcon: { backgroundColor: '#ECFDF5' }, flex: { flex: 1 },
  optionTitle: { color: '#111827', fontSize: 16, fontWeight: '800' }, optionText: { marginTop: 3, color: '#6B7280', fontSize: 12 },
});

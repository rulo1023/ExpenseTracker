import DateTimePicker from '@expo/ui/community/datetime-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import CurrencyPickerModal from '../currency-picker-modal';
import SettingsButton from '../settings-button';
import { currencyInfo, useAppSettings } from '../../context/app-settings-context';
import { useFeedback } from '../../context/feedback-context';
import { useFinance } from '../../context/finance-context';
import { useAppStyles } from '../../lib/themed-styles';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
}

export default function AddIncomeScreen({
  onSwitchExpense,
  onOpenSettings,
}: {
  onSwitchExpense: () => void;
  onOpenSettings: () => void;
}) {
  const styles = useAppStyles(lightStyles);
  const { addIncome, setupRequired } = useFinance();
  const { inputCurrency } = useAppSettings();
  const { showFeedback } = useFeedback();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(inputCurrency);
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<TextInput>(null);

  useEffect(() => setCurrency(inputCurrency), [inputCurrency]);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateMode = sameDay(date, new Date())
    ? 'today'
    : sameDay(date, yesterday) ? 'yesterday' : 'other';

  async function save() {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showFeedback('Introduce un importe válido.', 'error');
      amountRef.current?.focus();
      return;
    }
    if (setupRequired) {
      showFeedback('Primero aplica la migración de Planificación en Supabase.', 'error');
      return;
    }
    try {
      setSaving(true);
      await addIncome({
        description: description.trim(),
        amount: parsed,
        currency,
        transactionDate: date,
        status: startOfDay(date) > startOfDay(new Date()) ? 'planned' : 'completed',
      });
      setDescription('');
      setAmount('');
      setDate(new Date());
      setCurrency(inputCurrency);
      showFeedback('Ingreso añadido');
    } catch (error) {
      console.error('Error saving income:', error);
      showFeedback('No se pudo guardar el ingreso.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <View style={styles.modeRow}>
              <TouchableOpacity style={styles.modeInactive} onPress={onSwitchExpense}>
                <Text style={styles.modeInactiveText}>Gasto</Text>
              </TouchableOpacity>
              <View style={styles.modeActive}>
                <Text style={styles.modeActiveText}>Ingreso</Text>
              </View>
            </View>
            <SettingsButton onPress={onOpenSettings} />
          </View>

          <Text style={styles.title}>Nuevo ingreso</Text>
          <Text style={styles.subtitle}>Registra nómina, devolución u otra entrada.</Text>

          <View style={styles.fieldsRow}>
            <View style={styles.conceptField}>
              <Text style={styles.label}>Concepto</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                placeholder="Nómina, devolución…"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
                onSubmitEditing={() => amountRef.current?.focus()}
              />
            </View>
            <View style={styles.amountField}>
              <Text style={styles.label}>Importe</Text>
              <View style={styles.amountBox}>
                <TouchableOpacity style={styles.currencyButton} onPress={() => setShowCurrency(true)}>
                  <Text style={styles.currencySymbol}>{currencyInfo(currency).symbol}</Text>
                </TouchableOpacity>
                <TextInput
                  ref={amountRef}
                  value={amount}
                  onChangeText={setAmount}
                  style={styles.amountInput}
                  placeholder="0,00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Fecha</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={[styles.dateChip, dateMode === 'today' && styles.dateChipActive]} onPress={() => setDate(new Date())}>
              <Text style={[styles.dateText, dateMode === 'today' && styles.dateTextActive]}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateChip, dateMode === 'yesterday' && styles.dateChipActive]} onPress={() => setDate(yesterday)}>
              <Text style={[styles.dateText, dateMode === 'yesterday' && styles.dateTextActive]}>Ayer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateChip, dateMode === 'other' && styles.dateChipActive]} onPress={() => setShowDate(true)}>
              <Ionicons name="calendar-outline" size={17} color={dateMode === 'other' ? '#FFFFFF' : '#4B5563'} />
              <Text style={[styles.dateText, dateMode === 'other' && styles.dateTextActive]}>
                {dateMode === 'other' ? formatDate(date) : 'Otro día'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="wallet-outline" size={22} color="#047857" />
            <Text style={styles.infoText}>Este ingreso contará para el balance y el ahorro del mes.</Text>
          </View>

          <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} disabled={saving} onPress={() => void save()}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>Guardar ingreso</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          presentation="dialog"
          onValueChange={(_event, value) => { setDate(value); setShowDate(false); }}
          onDismiss={() => setShowDate(false)}
        />
      )}
      <CurrencyPickerModal
        visible={showCurrency}
        selected={currency}
        title="Divisa del ingreso"
        onSelect={setCurrency}
        onClose={() => setShowCurrency(false)}
      />
    </SafeAreaView>
  );
}

const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7F9' },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modeRow: { flexDirection: 'row', padding: 4, borderRadius: 13, backgroundColor: '#E5E7EB' },
  modeActive: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: '#059669' },
  modeInactive: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  modeActiveText: { color: '#FFFFFF', fontWeight: '700' },
  modeInactiveText: { color: '#4B5563', fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 5, marginBottom: 26, fontSize: 14, color: '#6B7280' },
  fieldsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  conceptField: { flex: 1.45 },
  amountField: { flex: 1 },
  label: { marginBottom: 8, fontSize: 13, fontWeight: '700', color: '#374151' },
  input: { height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', fontSize: 15, color: '#111827' },
  amountBox: { height: 52, flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  currencyButton: { minWidth: 43, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', borderRightWidth: 1, borderRightColor: '#D1FAE5' },
  currencySymbol: { color: '#047857', fontWeight: '800' },
  amountInput: { flex: 1, paddingHorizontal: 9, textAlign: 'right', fontSize: 16, color: '#111827' },
  dateRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  dateChip: { minHeight: 43, paddingHorizontal: 15, borderRadius: 13, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateChipActive: { borderColor: '#059669', backgroundColor: '#059669' },
  dateText: { color: '#4B5563', fontSize: 13, fontWeight: '700' },
  dateTextActive: { color: '#FFFFFF' },
  infoCard: { marginTop: 24, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#ECFDF5' },
  infoText: { flex: 1, color: '#065F46', lineHeight: 19, fontSize: 13, fontWeight: '600' },
  saveButton: { marginTop: 26, minHeight: 54, borderRadius: 16, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.55 },
});

import DateTimePicker from '@expo/ui/community/datetime-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CurrencyPickerModal from './currency-picker-modal';
import { CurrencyCode, currencyInfo, useAppSettings } from '../context/app-settings-context';
import { useFeedback } from '../context/feedback-context';
import { Income, useFinance } from '../context/finance-context';
import { useAppStyles } from '../lib/themed-styles';

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function IncomeEditorModal({ income, onClose }: {
  income: Income | null;
  onClose: () => void;
}) {
  const styles = useAppStyles(lightStyles);
  const { updateIncome, deleteIncome, completePlannedMovement } = useFinance();
  const { locale, plannedExecutionMode, t } = useAppSettings();
  const { showFeedback } = useFeedback();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [date, setDate] = useState(new Date());
  const [datePicker, setDatePicker] = useState(false);
  const [currencyPicker, setCurrencyPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const canComplete =
    income?.status === 'planned' &&
    plannedExecutionMode === 'manual' &&
    startOfDay(date).getTime() <= startOfDay(new Date()).getTime();

  useEffect(() => {
    if (!income) return;
    setDescription(income.description);
    setAmount(String(income.amount).replace('.', ','));
    setCurrency(income.currency);
    setDate(new Date(income.transactionDate));
  }, [income]);

  async function save() {
    if (!income || saving) return;
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showFeedback(t('invalidAmount'), 'error');
      return;
    }
    try {
      setSaving(true);
      await updateIncome(income.id, {
        description,
        amount: parsed,
        currency,
        transactionDate: date,
        status:
          startOfDay(date) > startOfDay(new Date()) ||
          (income.status === 'planned' && plannedExecutionMode === 'manual')
            ? 'planned'
            : 'completed',
        source: income.source,
      });
      onClose();
      showFeedback(t('updatedIncome'));
    } catch (error) {
      console.error('Error updating income:', error);
      showFeedback(t('incomeSaveError'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function completeIncome() {
    if (!income || saving) return;
    try {
      setSaving(true);
      await completePlannedMovement('income', income.id, income.recurringId);
      onClose();
      showFeedback(t('movementCompleted'));
    } catch (error) {
      console.error('Error completing income:', error);
      showFeedback(t('movementCompleteError'), 'error');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!income) return;
    Alert.alert(t('deleteIncome'), t('deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'), style: 'destructive', onPress: async () => {
          try {
            await deleteIncome(income.id);
            onClose();
            showFeedback(t('incomeDeleted'));
          } catch {
            showFeedback(t('movementCompleteError'), 'error');
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={Boolean(income)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity style={styles.back} onPress={onClose}>
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('editIncome')}</Text>
          </View>

          <Text style={styles.label}>{t('concept')}</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder={t('concept')} placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>{t('amount')}</Text>
          <View style={styles.amountBox}>
            <TouchableOpacity style={styles.currencyButton} onPress={() => setCurrencyPicker(true)}>
              <Text style={styles.currency}>{currencyInfo(currency).symbol}</Text>
            </TouchableOpacity>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          </View>

          <Text style={styles.label}>{t('date')}</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setDatePicker(true)}>
            <Text style={styles.selectorText}>
              {new Intl.DateTimeFormat(locale, {
                day: 'numeric', month: 'long', year: 'numeric',
              }).format(date)}
            </Text>
            <Ionicons name="calendar-outline" size={19} color="#4F46E5" />
          </TouchableOpacity>

          {canComplete && (
            <TouchableOpacity style={styles.complete} onPress={() => void completeIncome()} disabled={saving}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#047857" />
              <Text style={styles.completeText}>{t('markCompleted')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.save} onPress={() => void save()} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>{t('saveChanges')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.delete} onPress={confirmDelete}>
            <Text style={styles.deleteText}>{t('deleteIncome')}</Text>
          </TouchableOpacity>
        </ScrollView>

        <CurrencyPickerModal visible={currencyPicker} selected={currency} onSelect={setCurrency} onClose={() => setCurrencyPicker(false)} />
        {datePicker && <DateTimePicker value={date} mode="date" presentation="dialog" onValueChange={(_event, value) => { setDate(value); setDatePicker(false); }} onDismiss={() => setDatePicker(false)} />}
      </SafeAreaView>
    </Modal>
  );
}

const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7F9' },
  content: { padding: 20, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#111827', fontSize: 24, fontWeight: '800' },
  label: { marginTop: 18, marginBottom: 8, color: '#374151', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 54, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', color: '#111827', fontSize: 16 },
  amountBox: { minHeight: 54, flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  currencyButton: { minWidth: 58, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5' },
  currency: { color: '#047857', fontSize: 17, fontWeight: '800' },
  amountInput: { flex: 1, paddingHorizontal: 15, textAlign: 'right', color: '#111827', fontSize: 17 },
  selector: { minHeight: 54, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorText: { color: '#111827', fontSize: 15, fontWeight: '600' },
  save: { marginTop: 30, minHeight: 54, borderRadius: 16, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  complete: { marginTop: 24, minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: '#6EE7B7', backgroundColor: '#ECFDF5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  completeText: { color: '#047857', fontSize: 14, fontWeight: '800' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  delete: { marginTop: 13, minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#DC2626', fontSize: 14, fontWeight: '800' },
});

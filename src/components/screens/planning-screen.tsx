import DateTimePicker from '@expo/ui/community/datetime-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CategoryPickerModal from '../category-picker-modal';
import CurrencyPickerModal from '../currency-picker-modal';
import { CurrencyCode, currencyInfo, formatCurrencyAmount, useAppSettings } from '../../context/app-settings-context';
import { useCategories } from '../../context/categories-context';
import { useExpenses } from '../../context/expenses-context';
import { useFeedback } from '../../context/feedback-context';
import { RecurringFrequency, RecurringKind, useFinance } from '../../context/finance-context';
import { useAppStyles } from '../../lib/themed-styles';

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatMonth(date: Date) {
  const value = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);
}

const frequencyLabels: Record<RecurringFrequency, string> = {
  weekly: 'Semanal', monthly: 'Mensual', yearly: 'Anual',
};

export default function PlanningScreen({ onAddIncome }: { onAddIncome: () => void }) {
  const styles = useAppStyles(lightStyles);
  const { expenses } = useExpenses();
  const { categories, getCategoryById } = useCategories();
  const {
    incomes, budgets, recurring, setupRequired,
    saveBudget, deleteBudget, addRecurring, toggleRecurring, deleteRecurring, deleteIncome,
  } = useFinance();
  const { convertAmount, displayCurrency, formatMoney } = useAppSettings();
  const { showFeedback } = useFeedback();
  const [anchor, setAnchor] = useState(monthStart(new Date()));
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [recurringVisible, setRecurringVisible] = useState(false);

  const monthExpenses = expenses.filter(
    (item) => item.status === 'completed' && item.transactionDate >= monthStart(anchor) && item.transactionDate < monthEnd(anchor)
  );
  const monthIncomes = incomes.filter(
    (item) => item.status === 'completed' && item.transactionDate >= monthStart(anchor) && item.transactionDate < monthEnd(anchor)
  );
  const expenseTotal = monthExpenses.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0);
  const incomeTotal = monthIncomes.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0);
  const balance = incomeTotal - expenseTotal;
  const savingsRate = incomeTotal > 0 ? (balance / incomeTotal) * 100 : 0;
  const monthBudgets = budgets.filter((item) => sameMonth(item.monthStart, anchor));
  const recentIncomes = [...incomes].sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()).slice(0, 4);

  const budgetRows = useMemo(() => monthBudgets.map((budget) => {
    const spent = monthExpenses
      .filter((expense) => budget.categoryId === null || expense.categoryId === budget.categoryId)
      .reduce((sum, expense) => sum + convertAmount(expense.amount, expense.currency), 0);
    const limit = convertAmount(budget.amount, budget.currency);
    return { budget, spent, limit, ratio: limit > 0 ? spent / limit : 0 };
  }), [monthBudgets, monthExpenses, convertAmount]);

  function removeBudget(id: string) {
    Alert.alert('Eliminar presupuesto', '¿Quieres eliminar este límite mensual?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteBudget(id).catch(() => showFeedback('No se pudo eliminar.', 'error')) },
    ]);
  }

  function removeRule(id: string) {
    Alert.alert('Eliminar recurrencia', 'Los movimientos ya generados se conservarán.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void deleteRecurring(id).catch(() => showFeedback('No se pudo eliminar.', 'error')) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Planificación</Text>
        <Text style={styles.subtitle}>Tu balance, límites y próximos movimientos.</Text>

        {setupRequired && (
          <View style={styles.setupCard}>
            <Ionicons name="construct-outline" size={23} color="#92400E" />
            <View style={styles.flex}>
              <Text style={styles.setupTitle}>Falta preparar Supabase</Text>
              <Text style={styles.setupText}>Aplica la migración incluida en el proyecto para activar ingresos, presupuestos y recurrencias.</Text>
            </View>
          </View>
        )}

        <View style={styles.monthNavigator}>
          <TouchableOpacity onPress={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}>
            <Ionicons name="chevron-back" size={22} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonth(anchor)}</Text>
          <TouchableOpacity onPress={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}>
            <Ionicons name="chevron-forward" size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance del mes</Text>
          <Text style={[styles.balanceAmount, balance < 0 && styles.negative]}>{formatMoney(balance, displayCurrency)}</Text>
          <View style={styles.balanceDetails}>
            <View><Text style={styles.detailLabel}>Ingresos</Text><Text style={styles.incomeText}>{formatMoney(incomeTotal, displayCurrency)}</Text></View>
            <View><Text style={styles.detailLabel}>Gastos</Text><Text style={styles.expenseText}>{formatMoney(expenseTotal, displayCurrency)}</Text></View>
            <View><Text style={styles.detailLabel}>Ahorro</Text><Text style={styles.detailValue}>{Math.round(savingsRate)}%</Text></View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Presupuestos</Text><Text style={styles.sectionHint}>Límites para este mes</Text></View>
          <TouchableOpacity style={styles.smallAdd} onPress={() => setBudgetVisible(true)} disabled={setupRequired}>
            <Ionicons name="add" size={21} color="#FFFFFF" /><Text style={styles.smallAddText}>Añadir</Text>
          </TouchableOpacity>
        </View>
        {budgetRows.length === 0 ? (
          <EmptyCard icon="speedometer-outline" text="Crea un límite total o por categoría." />
        ) : budgetRows.map(({ budget, spent, limit, ratio }) => {
          const category = budget.categoryId ? getCategoryById(budget.categoryId) : null;
          const color = ratio >= 1 ? '#DC2626' : ratio >= 0.8 ? '#D97706' : category?.color ?? '#4F46E5';
          return (
            <TouchableOpacity key={budget.id} style={styles.listCard} onLongPress={() => removeBudget(budget.id)}>
              <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}><Ionicons name={(category?.icon ?? 'pie-chart-outline') as any} size={21} color={color} /></View>
              <View style={styles.flex}>
                <View style={styles.rowBetween}><Text style={styles.cardTitle}>{category?.name ?? 'Presupuesto total'}</Text><Text style={styles.cardAmount}>{formatMoney(spent, displayCurrency)} / {formatMoney(limit, displayCurrency)}</Text></View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: color }]} /></View>
                <Text style={[styles.progressText, { color }]}>{Math.round(ratio * 100)}% utilizado · mantén pulsado para eliminar</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Recurrentes</Text><Text style={styles.sectionHint}>Solo se genera el siguiente vencimiento</Text></View>
          <TouchableOpacity style={styles.smallAdd} onPress={() => setRecurringVisible(true)} disabled={setupRequired}>
            <Ionicons name="add" size={21} color="#FFFFFF" /><Text style={styles.smallAddText}>Añadir</Text>
          </TouchableOpacity>
        </View>
        {recurring.length === 0 ? (
          <EmptyCard icon="repeat-outline" text="Añade alquiler, nómina o suscripciones." />
        ) : recurring.map((item) => {
          const category = item.categoryId ? getCategoryById(item.categoryId) : null;
          const color = item.kind === 'income' ? '#059669' : category?.color ?? '#4F46E5';
          return (
            <TouchableOpacity key={item.id} style={styles.listCard} onLongPress={() => removeRule(item.id)}>
              <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}><Ionicons name={item.kind === 'income' ? 'arrow-down' : 'repeat-outline'} size={21} color={color} /></View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{item.description || (item.kind === 'income' ? 'Ingreso' : category?.name ?? 'Gasto')}</Text>
                <Text style={styles.cardMeta}>{frequencyLabels[item.frequency]} · próximo {formatDate(item.nextRunDate)} · mantén pulsado para eliminar</Text>
              </View>
              <View style={styles.trailing}><Text style={[styles.cardAmount, item.kind === 'income' && styles.incomeText]}>{item.kind === 'income' ? '+' : '−'}{formatCurrencyAmount(item.amount, item.currency)}</Text><Switch value={item.active} onValueChange={(active) => void toggleRecurring(item.id, active)} /></View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Ingresos</Text><Text style={styles.sectionHint}>Entradas recientes</Text></View>
          <TouchableOpacity style={[styles.smallAdd, styles.incomeAdd]} onPress={onAddIncome} disabled={setupRequired}>
            <Ionicons name="add" size={21} color="#FFFFFF" /><Text style={styles.smallAddText}>Ingreso</Text>
          </TouchableOpacity>
        </View>
        {recentIncomes.length === 0 ? <EmptyCard icon="wallet-outline" text="Añade un ingreso para calcular tu ahorro." /> : recentIncomes.map((income) => (
          <TouchableOpacity key={income.id} style={styles.listCard} onLongPress={() => Alert.alert('Eliminar ingreso', '¿Quieres eliminarlo?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => void deleteIncome(income.id) }])}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}><Ionicons name="arrow-down" size={21} color="#059669" /></View>
            <View style={styles.flex}><Text style={styles.cardTitle}>{income.description || 'Ingreso'}</Text><Text style={styles.cardMeta}>{formatDate(income.transactionDate)}{income.status === 'planned' ? ' · Previsto' : ''}</Text></View>
            <Text style={[styles.cardAmount, styles.incomeText]}>+{formatCurrencyAmount(income.amount, income.currency)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BudgetModal visible={budgetVisible} month={anchor} categories={categories} onClose={() => setBudgetVisible(false)} onSave={saveBudget} />
      <RecurringModal visible={recurringVisible} onClose={() => setRecurringVisible(false)} onSave={addRecurring} />
    </SafeAreaView>
  );
}

function EmptyCard({ icon, text }: { icon: string; text: string }) {
  const styles = useAppStyles(lightStyles);
  return <View style={styles.emptyCard}><Ionicons name={icon as any} size={23} color="#818CF8" /><Text style={styles.emptyText}>{text}</Text></View>;
}

function BudgetModal({ visible, month, categories, onClose, onSave }: any) {
  const styles = useAppStyles(lightStyles);
  const { inputCurrency } = useAppSettings();
  const { showFeedback } = useFeedback();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(inputCurrency);
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [currencyPicker, setCurrencyPicker] = useState(false);
  const category = categories.find((item: any) => item.id === categoryId);
  async function submit() {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return showFeedback('Introduce un límite válido.', 'error');
    try {
      await onSave({ categoryId, amount: parsed, currency, monthStart: monthStart(month) });
      setAmount(''); onClose(); showFeedback('Presupuesto guardado');
    } catch { showFeedback('No se pudo guardar el presupuesto.', 'error'); }
  }
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.modalSafe}><ScrollView contentContainerStyle={styles.modalContent}>
    <ModalHeader title="Nuevo presupuesto" onClose={onClose} />
    <Text style={styles.modalHint}>Límite para {formatMonth(month)}. Si ya existe, se actualizará.</Text>
    <Text style={styles.label}>Ámbito</Text>
    <TouchableOpacity style={styles.selector} onPress={() => setCategoryPicker(true)}><Text style={styles.selectorText}>{category?.name ?? 'Todo el gasto mensual'}</Text><Ionicons name="chevron-down" size={18} color="#6B7280" /></TouchableOpacity>
    <Text style={styles.label}>Límite</Text>
    <View style={styles.amountEditor}><TouchableOpacity onPress={() => setCurrencyPicker(true)}><Text style={styles.currencyEditor}>{currencyInfo(currency).symbol}</Text></TouchableOpacity><TextInput style={styles.modalInput} value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" /></View>
    <TouchableOpacity style={styles.primaryButton} onPress={() => void submit()}><Text style={styles.primaryText}>Guardar presupuesto</Text></TouchableOpacity>
  </ScrollView>
  <CategoryPickerModal visible={categoryPicker} selectedCategoryId={categoryId} allowClear clearLabel="Todo el gasto mensual" onClear={() => { setCategoryId(null); setCategoryPicker(false); }} onSelect={(id) => { setCategoryId(id); setCategoryPicker(false); }} onClose={() => setCategoryPicker(false)} />
  <CurrencyPickerModal visible={currencyPicker} selected={currency} onSelect={setCurrency} onClose={() => setCurrencyPicker(false)} />
  </SafeAreaView></Modal>;
}

function RecurringModal({ visible, onClose, onSave }: any) {
  const styles = useAppStyles(lightStyles);
  const { inputCurrency } = useAppSettings();
  const { getCategoryById } = useCategories();
  const { showFeedback } = useFeedback();
  const [kind, setKind] = useState<RecurringKind>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(inputCurrency);
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [currencyPicker, setCurrencyPicker] = useState(false);
  const [datePicker, setDatePicker] = useState(false);
  async function submit() {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return showFeedback('Introduce un importe válido.', 'error');
    if (kind === 'expense' && !categoryId) return showFeedback('Selecciona una categoría.', 'error');
    try {
      await onSave({ kind, categoryId: kind === 'expense' ? categoryId : null, description, amount: parsed, currency, frequency, nextRunDate: date, active: true });
      setDescription(''); setAmount(''); onClose(); showFeedback('Recurrencia creada');
    } catch { showFeedback('No se pudo crear la recurrencia.', 'error'); }
  }
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.modalSafe}><ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
    <ModalHeader title="Nuevo recurrente" onClose={onClose} />
    <View style={styles.kindRow}><TouchableOpacity style={[styles.kindChip, kind === 'expense' && styles.kindExpense]} onPress={() => setKind('expense')}><Text style={[styles.kindText, kind === 'expense' && styles.kindTextActive]}>Gasto</Text></TouchableOpacity><TouchableOpacity style={[styles.kindChip, kind === 'income' && styles.kindIncome]} onPress={() => setKind('income')}><Text style={[styles.kindText, kind === 'income' && styles.kindTextActive]}>Ingreso</Text></TouchableOpacity></View>
    <Text style={styles.label}>Concepto</Text><TextInput style={styles.textInput} value={description} onChangeText={setDescription} placeholder="Alquiler, nómina, plataforma…" placeholderTextColor="#9CA3AF" />
    <Text style={styles.label}>Importe</Text><View style={styles.amountEditor}><TouchableOpacity onPress={() => setCurrencyPicker(true)}><Text style={styles.currencyEditor}>{currencyInfo(currency).symbol}</Text></TouchableOpacity><TextInput style={styles.modalInput} value={amount} onChangeText={setAmount} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" /></View>
    {kind === 'expense' && <><Text style={styles.label}>Categoría</Text><TouchableOpacity style={styles.selector} onPress={() => setCategoryPicker(true)}><Text style={styles.selectorText}>{getCategoryById(categoryId)?.name ?? 'Elegir categoría'}</Text><Ionicons name="chevron-down" size={18} color="#6B7280" /></TouchableOpacity></>}
    <Text style={styles.label}>Frecuencia</Text><View style={styles.frequencyRow}>{(['weekly', 'monthly', 'yearly'] as RecurringFrequency[]).map((item) => <TouchableOpacity key={item} style={[styles.frequencyChip, frequency === item && styles.frequencyActive]} onPress={() => setFrequency(item)}><Text style={[styles.frequencyText, frequency === item && styles.frequencyTextActive]}>{frequencyLabels[item]}</Text></TouchableOpacity>)}</View>
    <Text style={styles.label}>Próximo vencimiento</Text><TouchableOpacity style={styles.selector} onPress={() => setDatePicker(true)}><Text style={styles.selectorText}>{formatDate(date)}</Text><Ionicons name="calendar-outline" size={18} color="#6B7280" /></TouchableOpacity>
    <TouchableOpacity style={styles.primaryButton} onPress={() => void submit()}><Text style={styles.primaryText}>Crear recurrencia</Text></TouchableOpacity>
  </ScrollView>
  <CategoryPickerModal visible={categoryPicker} selectedCategoryId={categoryId} onSelect={(id) => { setCategoryId(id); setCategoryPicker(false); }} onClose={() => setCategoryPicker(false)} />
  <CurrencyPickerModal visible={currencyPicker} selected={currency} onSelect={setCurrency} onClose={() => setCurrencyPicker(false)} />
  {datePicker && <DateTimePicker value={date} mode="date" presentation="dialog" onValueChange={(_event, value) => { setDate(value); setDatePicker(false); }} onDismiss={() => setDatePicker(false)} />}
  </SafeAreaView></Modal>;
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const styles = useAppStyles(lightStyles);
  return <View style={styles.modalHeader}><Text style={styles.modalTitle}>{title}</Text><TouchableOpacity style={styles.closeButton} onPress={onClose}><Ionicons name="close" size={22} color="#6B7280" /></TouchableOpacity></View>;
}

const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7F9' }, content: { padding: 20, paddingBottom: 130 }, flex: { flex: 1 },
  title: { marginTop: 12, fontSize: 30, fontWeight: '700', color: '#111827' }, subtitle: { marginTop: 5, fontSize: 14, color: '#6B7280' },
  setupCard: { marginTop: 18, padding: 15, borderRadius: 16, backgroundColor: '#FEF3C7', flexDirection: 'row', gap: 11 }, setupTitle: { color: '#92400E', fontWeight: '800' }, setupText: { marginTop: 3, color: '#A16207', fontSize: 12, lineHeight: 17 },
  monthNavigator: { marginTop: 20, minHeight: 48, paddingHorizontal: 16, borderRadius: 15, backgroundColor: '#EEF2FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, monthText: { color: '#4338CA', fontSize: 15, fontWeight: '800' },
  balanceCard: { marginTop: 14, padding: 20, borderRadius: 22, backgroundColor: '#111827' }, balanceLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '700' }, balanceAmount: { marginTop: 5, color: '#FFFFFF', fontSize: 34, fontWeight: '800' }, negative: { color: '#FCA5A5' }, balanceDetails: { marginTop: 20, paddingTop: 17, borderTopWidth: 1, borderTopColor: '#374151', flexDirection: 'row', justifyContent: 'space-between' }, detailLabel: { color: '#9CA3AF', fontSize: 11 }, detailValue: { marginTop: 3, color: '#FFFFFF', fontWeight: '800' }, incomeText: { color: '#059669' }, expenseText: { marginTop: 3, color: '#F87171', fontWeight: '800' },
  sectionHeader: { marginTop: 28, marginBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: '#111827', fontSize: 20, fontWeight: '800' }, sectionHint: { marginTop: 2, color: '#6B7280', fontSize: 12 },
  smallAdd: { minHeight: 38, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', gap: 4 }, incomeAdd: { backgroundColor: '#059669' }, smallAddText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  listCard: { marginBottom: 9, padding: 13, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 11 }, iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, cardTitle: { flexShrink: 1, color: '#111827', fontSize: 14, fontWeight: '700' }, cardAmount: { color: '#111827', fontSize: 12, fontWeight: '800' }, cardMeta: { marginTop: 4, color: '#6B7280', fontSize: 11 }, trailing: { alignItems: 'flex-end', gap: 3 },
  progressTrack: { marginTop: 9, height: 7, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 4 }, progressText: { marginTop: 5, fontSize: 10, fontWeight: '700' },
  emptyCard: { padding: 18, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#C7D2FE', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 10 }, emptyText: { flex: 1, color: '#6B7280', fontSize: 13 },
  modalSafe: { flex: 1, backgroundColor: '#F6F7F9' }, modalContent: { padding: 20, paddingBottom: 60 }, modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }, modalTitle: { color: '#111827', fontSize: 24, fontWeight: '800' }, closeButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }, modalHint: { marginBottom: 24, color: '#6B7280', fontSize: 13, lineHeight: 18 },
  label: { marginTop: 18, marginBottom: 8, color: '#374151', fontSize: 13, fontWeight: '700' }, selector: { minHeight: 52, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, selectorText: { color: '#111827', fontSize: 15, fontWeight: '600' },
  amountEditor: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }, currencyEditor: { paddingHorizontal: 17, color: '#4F46E5', fontSize: 18, fontWeight: '800' }, modalInput: { flex: 1, minHeight: 52, paddingRight: 16, textAlign: 'right', color: '#111827', fontSize: 17 }, textInput: { minHeight: 52, paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', color: '#111827', fontSize: 15 },
  kindRow: { flexDirection: 'row', gap: 9, marginTop: 15 }, kindChip: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, kindExpense: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }, kindIncome: { backgroundColor: '#059669', borderColor: '#059669' }, kindText: { color: '#4B5563', fontWeight: '800' }, kindTextActive: { color: '#FFFFFF' },
  frequencyRow: { flexDirection: 'row', gap: 7 }, frequencyChip: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, frequencyActive: { backgroundColor: '#EEF2FF', borderColor: '#818CF8' }, frequencyText: { color: '#6B7280', fontSize: 12, fontWeight: '700' }, frequencyTextActive: { color: '#4F46E5' },
  primaryButton: { marginTop: 30, minHeight: 54, borderRadius: 16, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

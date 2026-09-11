import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { CurrencyCode, useAppSettings } from './app-settings-context';
import { useAuth } from './auth-context';
import { useExpenses } from './expenses-context';
import { supabase } from '../lib/supabase';
import { advanceRecurringDate } from '../lib/recurring-dates';

export type IncomeStatus = 'completed' | 'planned';
export type RecurringKind = 'expense' | 'income';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export type Income = {
  id: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  transactionDate: Date;
  status: IncomeStatus;
  source: 'manual' | 'recurring';
  recurringId: string | null;
  createdAt: Date;
};

export type Budget = {
  id: string;
  categoryId: string | null;
  amount: number;
  currency: CurrencyCode;
  monthStart: Date;
};

export type RecurringTransaction = {
  id: string;
  kind: RecurringKind;
  categoryId: string | null;
  description: string;
  amount: number;
  currency: CurrencyCode;
  frequency: RecurringFrequency;
  nextRunDate: Date;
  active: boolean;
};

export type IncomeInput = Omit<Income, 'id' | 'createdAt' | 'source' | 'recurringId'> & {
  source?: Income['source'];
};

export type BudgetInput = Omit<Budget, 'id'>;
export type RecurringInput = Omit<RecurringTransaction, 'id'>;

type FinanceContextValue = {
  incomes: Income[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  loading: boolean;
  setupRequired: boolean;
  addIncome: (input: IncomeInput) => Promise<void>;
  updateIncome: (id: string, input: IncomeInput) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  saveBudget: (input: BudgetInput) => Promise<void>;
  updateBudget: (id: string, input: BudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addRecurring: (input: RecurringInput) => Promise<void>;
  updateRecurring: (id: string, input: RecurringInput) => Promise<void>;
  toggleRecurring: (id: string, active: boolean) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  completePlannedMovement: (
    kind: RecurringKind,
    id: string,
    recurringId?: string | null
  ) => Promise<void>;
  refreshFinance: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function mapIncome(row: any): Income {
  return {
    id: row.id,
    description: row.description ?? '',
    amount: Number(row.amount),
    currency: (row.currency ?? 'EUR') as CurrencyCode,
    transactionDate: new Date(row.transaction_date),
    status: row.status as IncomeStatus,
    source: row.source as Income['source'],
    recurringId: row.recurring_id ?? null,
    createdAt: new Date(row.created_at),
  };
}

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: Number(row.amount),
    currency: (row.currency ?? 'EUR') as CurrencyCode,
    monthStart: new Date(`${row.month_start}T12:00:00`),
  };
}

function mapRecurring(row: any): RecurringTransaction {
  return {
    id: row.id,
    kind: row.kind as RecurringKind,
    categoryId: row.category_id,
    description: row.description ?? '',
    amount: Number(row.amount),
    currency: (row.currency ?? 'EUR') as CurrencyCode,
    frequency: row.frequency as RecurringFrequency,
    nextRunDate: new Date(`${row.next_run_date}T12:00:00`),
    active: Boolean(row.active),
  };
}

function dateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isMissingPlanningSchema(error: any) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

function isStaleRecurringReference(error: any) {
  return (
    error?.code === '23503' &&
    String(error?.message ?? '').includes('recurring_id')
  );
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { hydrated: settingsHydrated, inputCurrency, plannedExecutionMode, refreshRates } = useAppSettings();
  const { refreshExpenses } = useExpenses();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const refreshRunningRef = useRef(false);

  const generateDueOccurrences = useCallback(
    async (rules: RecurringTransaction[]) => {
      if (!user || !settingsHydrated) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 31);
      horizon.setHours(23, 59, 59, 999);
      let expensesChanged = false;
      let incomesChanged = false;

      for (const rule of rules.filter((item) => item.active)) {
        const targetTable = rule.kind === 'expense' ? 'expenses' : 'incomes';
        const { data: pending, error: pendingError } = await supabase
          .from(targetTable)
          .select('id, transaction_date')
          .eq('recurring_id', rule.id)
          .eq('status', 'planned')
          .limit(1);
        if (pendingError) throw pendingError;
        const pendingOccurrence = pending?.[0];
        let occurrenceDate = new Date(rule.nextRunDate);
        if (pendingOccurrence) {
          const pendingDate = new Date(pendingOccurrence.transaction_date);
          if (pendingDate.getTime() > today.getTime()) {
            if (dateOnly(pendingDate) !== dateOnly(rule.nextRunDate)) {
              const { error: alignError } = await supabase
                .from('recurring_transactions')
                .update({ next_run_date: dateOnly(pendingDate) })
                .eq('id', rule.id)
                .eq('user_id', user.id);
              if (alignError) throw alignError;
            }
            continue;
          }
          if (plannedExecutionMode === 'manual') {
            continue;
          }
          const { error: completeError } = await supabase
            .from(targetTable)
            .update({ status: 'completed' })
            .eq('id', pendingOccurrence.id)
            .eq('user_id', user.id);
          if (completeError) throw completeError;
          if (rule.kind === 'expense') expensesChanged = true;
          else incomesChanged = true;

          occurrenceDate = rule.nextRunDate.getTime() > pendingDate.getTime()
            ? new Date(rule.nextRunDate)
            : advanceRecurringDate(pendingDate, rule.frequency);
          while (occurrenceDate.getTime() <= today.getTime()) {
            occurrenceDate = advanceRecurringDate(occurrenceDate, rule.frequency);
          }

          const { error: advanceError } = await supabase
            .from('recurring_transactions')
            .update({ next_run_date: dateOnly(occurrenceDate) })
            .eq('id', rule.id)
            .eq('user_id', user.id);
          if (advanceError) throw advanceError;
        } else if (
          plannedExecutionMode === 'automatic' &&
          occurrenceDate.getTime() <= today.getTime()
        ) {
          const completed = {
            user_id: user.id,
            description: rule.description.trim(),
            amount: rule.amount,
            currency: rule.currency,
            transaction_date: occurrenceDate.toISOString(),
            status: 'completed',
            source: 'recurring',
            recurring_id: rule.id,
          };
          if (rule.kind === 'expense' && rule.categoryId) {
            const { error } = await supabase
              .from('expenses')
              .insert({ ...completed, category_id: rule.categoryId });
            if (error) {
              if (isStaleRecurringReference(error)) continue;
              if (error.code !== '23505') throw error;
            } else {
              expensesChanged = true;
            }
          } else if (rule.kind === 'income') {
            const { error } = await supabase.from('incomes').insert(completed);
            if (error) {
              if (isStaleRecurringReference(error)) continue;
              if (error.code !== '23505') throw error;
            } else {
              incomesChanged = true;
            }
          }

          do {
            occurrenceDate = advanceRecurringDate(occurrenceDate, rule.frequency);
          } while (occurrenceDate.getTime() <= today.getTime());

          const { error: advanceError } = await supabase
            .from('recurring_transactions')
            .update({ next_run_date: dateOnly(occurrenceDate) })
            .eq('id', rule.id)
            .eq('user_id', user.id);
          if (advanceError) throw advanceError;
        }

        if (occurrenceDate.getTime() > horizon.getTime()) continue;

        const common = {
          user_id: user.id,
          description: rule.description.trim(),
          amount: rule.amount,
          currency: rule.currency,
          transaction_date: occurrenceDate.toISOString(),
          status: 'planned',
          source: 'recurring',
          recurring_id: rule.id,
        };

        if (rule.kind === 'expense' && rule.categoryId) {
          const { error } = await supabase
            .from('expenses')
            .insert({ ...common, category_id: rule.categoryId });
          if (error) {
            if (isStaleRecurringReference(error)) continue;
            if (error.code !== '23505') throw error;
          } else {
            expensesChanged = true;
          }
        }

        if (rule.kind === 'income') {
          const { error } = await supabase.from('incomes').insert(common);
          if (error) {
            if (isStaleRecurringReference(error)) continue;
            if (error.code !== '23505') throw error;
          } else {
            incomesChanged = true;
          }
        }
      }

      if (expensesChanged) await refreshExpenses();
      return incomesChanged;
    },
    [plannedExecutionMode, refreshExpenses, settingsHydrated, user]
  );

  const completeDueStandaloneMovements = useCallback(async () => {
    if (!user || !settingsHydrated || plannedExecutionMode !== 'automatic') return;
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const [expenseResult, incomeResult] = await Promise.all([
      supabase
        .from('expenses')
        .update({ status: 'completed' })
        .eq('user_id', user.id)
        .eq('status', 'planned')
        .is('recurring_id', null)
        .lte('transaction_date', endOfToday.toISOString()),
      supabase
        .from('incomes')
        .update({ status: 'completed' })
        .eq('user_id', user.id)
        .eq('status', 'planned')
        .is('recurring_id', null)
        .lte('transaction_date', endOfToday.toISOString()),
    ]);
    if (expenseResult.error) throw expenseResult.error;
    if (incomeResult.error) throw incomeResult.error;
    await refreshExpenses();
  }, [plannedExecutionMode, refreshExpenses, settingsHydrated, user]);

  const refreshFinance = useCallback(async () => {
    if (!user) {
      setIncomes([]);
      setBudgets([]);
      setRecurring([]);
      return;
    }

    if (refreshRunningRef.current) return;
    refreshRunningRef.current = true;

    try {
      setLoading(true);
      await completeDueStandaloneMovements();
      const [incomeResult, budgetResult, recurringResult] = await Promise.all([
        supabase.from('incomes').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id).order('month_start', { ascending: false }),
        supabase.from('recurring_transactions').select('*').eq('user_id', user.id).order('next_run_date'),
      ]);
      const error = incomeResult.error ?? budgetResult.error ?? recurringResult.error;
      if (error) {
        if (isMissingPlanningSchema(error)) {
          setSetupRequired(true);
          return;
        }
        throw error;
      }

      setSetupRequired(false);
      const mappedRules = (recurringResult.data ?? []).map(mapRecurring);
      setIncomes((incomeResult.data ?? []).map(mapIncome));
      setBudgets((budgetResult.data ?? []).map(mapBudget));
      setRecurring(mappedRules);

      const incomesChanged = await generateDueOccurrences(mappedRules);
      if (incomesChanged) {
        const refreshed = await supabase.from('incomes').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false });
        if (!refreshed.error) setIncomes((refreshed.data ?? []).map(mapIncome));
      }
      const rulesRefreshed = await supabase.from('recurring_transactions').select('*').eq('user_id', user.id).order('next_run_date');
      if (!rulesRefreshed.error) setRecurring((rulesRefreshed.data ?? []).map(mapRecurring));
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      refreshRunningRef.current = false;
      setLoading(false);
    }
  }, [completeDueStandaloneMovements, generateDueOccurrences, user]);

  useEffect(() => {
    void refreshFinance();
  }, [refreshFinance]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshFinance();
    });
    return () => subscription.remove();
  }, [refreshFinance]);

  useEffect(() => {
    const currencies = [...incomes, ...budgets, ...recurring].map((item) => item.currency);
    if (currencies.length > 0) void refreshRates(currencies);
  }, [incomes, budgets, recurring]);

  async function addIncome(input: IncomeInput) {
    if (!user) throw new Error('User is not authenticated');
    const { data, error } = await supabase.from('incomes').insert({
      user_id: user.id,
      description: input.description.trim(),
      amount: input.amount,
      currency: input.currency ?? inputCurrency,
      transaction_date: input.transactionDate.toISOString(),
      status: input.status,
      source: input.source ?? 'manual',
    }).select().single();
    if (error) throw error;
    setIncomes((current) => [mapIncome(data), ...current]);
  }

  async function deleteIncome(id: string) {
    if (!user) return;
    const { error } = await supabase.from('incomes').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setIncomes((current) => current.filter((item) => item.id !== id));
  }

  async function updateIncome(id: string, input: IncomeInput) {
    if (!user) throw new Error('User is not authenticated');
    const { data, error } = await supabase.from('incomes').update({
      description: input.description.trim(),
      amount: input.amount,
      currency: input.currency ?? inputCurrency,
      transaction_date: input.transactionDate.toISOString(),
      status: input.status,
      source: input.source ?? 'manual',
    }).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    const mapped = mapIncome(data);
    setIncomes((current) => current
      .map((item) => item.id === id ? mapped : item)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()));
  }

  async function saveBudget(input: BudgetInput) {
    if (!user) throw new Error('User is not authenticated');
    const existing = budgets.find(
      (item) => item.categoryId === input.categoryId && dateOnly(item.monthStart) === dateOnly(input.monthStart)
    );
    const payload = {
      user_id: user.id,
      category_id: input.categoryId,
      amount: input.amount,
      currency: input.currency,
      month_start: dateOnly(input.monthStart),
    };
    const query = existing
      ? supabase.from('budgets').update(payload).eq('id', existing.id).eq('user_id', user.id)
      : supabase.from('budgets').insert(payload);
    const { data, error } = await query.select().single();
    if (error) throw error;
    const mapped = mapBudget(data);
    setBudgets((current) => [mapped, ...current.filter((item) => item.id !== mapped.id)]);
  }

  async function updateBudget(id: string, input: BudgetInput) {
    if (!user) throw new Error('User is not authenticated');
    const { data, error } = await supabase.from('budgets').update({
      user_id: user.id,
      category_id: input.categoryId,
      amount: input.amount,
      currency: input.currency,
      month_start: dateOnly(input.monthStart),
    }).eq('id', id).eq('user_id', user.id).select().single();
    if (error) throw error;
    const mapped = mapBudget(data);
    setBudgets((current) => [
      mapped,
      ...current.filter((item) => item.id !== id),
    ].sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime()));
  }

  async function deleteBudget(id: string) {
    if (!user) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setBudgets((current) => current.filter((item) => item.id !== id));
  }

  async function addRecurring(input: RecurringInput) {
    if (!user) throw new Error('User is not authenticated');
    const { data, error } = await supabase.from('recurring_transactions').insert({
      user_id: user.id,
      kind: input.kind,
      category_id: input.categoryId,
      description: input.description.trim(),
      amount: input.amount,
      currency: input.currency,
      frequency: input.frequency,
      next_run_date: dateOnly(input.nextRunDate),
      active: input.active,
    }).select().single();
    if (error) throw error;
    setRecurring((current) => [...current, mapRecurring(data)].sort((a, b) => a.nextRunDate.getTime() - b.nextRunDate.getTime()));
    await refreshFinance();
  }

  async function toggleRecurring(id: string, active: boolean) {
    if (!user) return;
    const { error } = await supabase.from('recurring_transactions').update({ active }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setRecurring((current) => current.map((item) => item.id === id ? { ...item, active } : item));
    if (!active) {
      const [expenseDelete, incomeDelete] = await Promise.all([
        supabase.from('expenses').delete().eq('recurring_id', id).eq('status', 'planned').eq('user_id', user.id),
        supabase.from('incomes').delete().eq('recurring_id', id).eq('status', 'planned').eq('user_id', user.id),
      ]);
      if (expenseDelete.error) throw expenseDelete.error;
      if (incomeDelete.error) throw incomeDelete.error;
      setIncomes((current) => current.filter((item) => item.recurringId !== id || item.status !== 'planned'));
      await refreshExpenses();
    } else {
      await refreshFinance();
    }
  }

  async function updateRecurring(id: string, input: RecurringInput) {
    if (!user) throw new Error('User is not authenticated');
    const { error } = await supabase.from('recurring_transactions').update({
      kind: input.kind,
      category_id: input.categoryId,
      description: input.description.trim(),
      amount: input.amount,
      currency: input.currency,
      frequency: input.frequency,
      next_run_date: dateOnly(input.nextRunDate),
      active: input.active,
    }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    const [expenseDelete, incomeDelete] = await Promise.all([
      supabase.from('expenses').delete().eq('recurring_id', id).eq('status', 'planned').eq('user_id', user.id),
      supabase.from('incomes').delete().eq('recurring_id', id).eq('status', 'planned').eq('user_id', user.id),
    ]);
    if (expenseDelete.error) throw expenseDelete.error;
    if (incomeDelete.error) throw incomeDelete.error;
    await refreshExpenses();
    await refreshFinance();
  }

  async function deleteRecurring(id: string) {
    if (!user) return;
    const [expenseDelete, incomeDelete] = await Promise.all([
      supabase.from('expenses').delete().eq('recurring_id', id).eq('status', 'planned').eq('user_id', user.id),
      supabase.from('incomes').delete().eq('recurring_id', id).eq('status', 'planned').eq('user_id', user.id),
    ]);
    if (expenseDelete.error) throw expenseDelete.error;
    if (incomeDelete.error) throw incomeDelete.error;
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;
    setRecurring((current) => current.filter((item) => item.id !== id));
    setIncomes((current) => current.filter((item) => item.recurringId !== id || item.status !== 'planned'));
    await refreshExpenses();
  }

  async function completePlannedMovement(
    kind: RecurringKind,
    id: string,
    recurringId?: string | null
  ) {
    if (!user) throw new Error('User is not authenticated');
    const table = kind === 'expense' ? 'expenses' : 'incomes';
    const { data: completedRow, error } = await supabase
      .from(table)
      .update({ status: 'completed' })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('transaction_date')
      .single();
    if (error) throw error;

    if (recurringId) {
      const rule = recurring.find((item) => item.id === recurringId);
      if (rule) {
        const completedDate = completedRow?.transaction_date
          ? new Date(completedRow.transaction_date)
          : rule.nextRunDate;
        let nextDate = advanceRecurringDate(completedDate, rule.frequency);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        while (nextDate.getTime() <= today.getTime()) {
          nextDate = advanceRecurringDate(nextDate, rule.frequency);
        }
        const { error: advanceError } = await supabase
          .from('recurring_transactions')
          .update({ next_run_date: dateOnly(nextDate) })
          .eq('id', recurringId)
          .eq('user_id', user.id);
        if (advanceError) throw advanceError;
      }
    }

    await refreshExpenses();
    await refreshFinance();
  }

  const value = useMemo(() => ({
    incomes, budgets, recurring, loading, setupRequired,
    addIncome, updateIncome, deleteIncome, saveBudget, updateBudget, deleteBudget,
    addRecurring, updateRecurring, toggleRecurring, deleteRecurring,
    completePlannedMovement, refreshFinance,
  }), [incomes, budgets, recurring, loading, setupRequired, refreshFinance]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
}

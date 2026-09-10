import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CurrencyCode, useAppSettings } from './app-settings-context';
import { useAuth } from './auth-context';
import { useExpenses } from './expenses-context';
import { supabase } from '../lib/supabase';

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
  deleteBudget: (id: string) => Promise<void>;
  addRecurring: (input: RecurringInput) => Promise<void>;
  updateRecurring: (id: string, input: RecurringInput) => Promise<void>;
  toggleRecurring: (id: string, active: boolean) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
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

function advanceDate(date: Date, frequency: RecurringFrequency) {
  const next = new Date(date);
  if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

function isMissingPlanningSchema(error: any) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { inputCurrency, refreshRates } = useAppSettings();
  const { refreshExpenses } = useExpenses();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  const generateDueOccurrences = useCallback(
    async (rules: RecurringTransaction[]) => {
      if (!user) return;
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
            : advanceDate(pendingDate, rule.frequency);
          while (occurrenceDate.getTime() <= today.getTime()) {
            occurrenceDate = advanceDate(occurrenceDate, rule.frequency);
          }

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
          if (error && error.code !== '23505') throw error;
          expensesChanged = true;
        }

        if (rule.kind === 'income') {
          const { error } = await supabase.from('incomes').insert(common);
          if (error && error.code !== '23505') throw error;
          incomesChanged = true;
        }
      }

      if (expensesChanged) await refreshExpenses();
      return incomesChanged;
    },
    [refreshExpenses, user]
  );

  const refreshFinance = useCallback(async () => {
    if (!user) {
      setIncomes([]);
      setBudgets([]);
      setRecurring([]);
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [generateDueOccurrences, user]);

  useEffect(() => {
    void refreshFinance();
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

  const value = useMemo(() => ({
    incomes, budgets, recurring, loading, setupRequired,
    addIncome, updateIncome, deleteIncome, saveBudget, deleteBudget,
    addRecurring, updateRecurring, toggleRecurring, deleteRecurring, refreshFinance,
  }), [incomes, budgets, recurring, loading, setupRequired, refreshFinance]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
}

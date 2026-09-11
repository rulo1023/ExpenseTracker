import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from './auth-context';
import {
  CurrencyCode,
  useAppSettings,
} from './app-settings-context';
import { supabase } from '../lib/supabase';

export type ExpenseStatus =
  | 'completed'
  | 'planned';

export type ExpenseSource =
  | 'manual'
  | 'text'
  | 'voice'
  | 'recurring';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  categoryId: string;
  transactionDate: Date;
  status: ExpenseStatus;
  source: ExpenseSource;
  recurringId: string | null;
  createdAt: Date;
};

export type ExpenseInput = {
  description: string;
  amount: number;
  currency?: CurrencyCode;
  categoryId: string;
  transactionDate?: Date;
  status?: ExpenseStatus;
  source?: ExpenseSource;
};

type ExpensesContextType = {
  expenses: Expense[];
  loading: boolean;

  addExpense: (
    expense: ExpenseInput
  ) => Promise<void>;

  updateExpense: (
    id: string,
    expense: ExpenseInput
  ) => Promise<void>;

  deleteExpense: (
    id: string
  ) => Promise<void>;

  refreshExpenses: () => Promise<void>;

  total: number;
};

const ExpensesContext =
  createContext<ExpensesContextType | undefined>(
    undefined
  );

function mapExpense(row: any): Expense {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    currency: (row.currency ?? 'EUR') as CurrencyCode,
    categoryId: row.category_id,
    transactionDate:
      new Date(row.transaction_date),
    status:
      row.status as ExpenseStatus,
    source:
      row.source as ExpenseSource,
    recurringId: row.recurring_id ?? null,
    createdAt:
      new Date(row.created_at),
  };
}

export function ExpensesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const {
    inputCurrency,
    displayCurrency,
    convertAmount,
    refreshRates,
  } = useAppSettings();

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    void loadExpenses();
  }, [user?.id]);

  useEffect(() => {
    const currencies = Array.from(
      new Set(expenses.map((expense) => expense.currency))
    );
    if (currencies.length > 0) {
      void refreshRates(currencies);
    }
  }, [displayCurrency, expenses]);

  async function loadExpenses() {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order(
          'transaction_date',
          {
            ascending: false,
          }
        );

      if (error) {
        throw error;
      }

      setExpenses(
        (data ?? []).map(
          mapExpense
        )
      );
    } catch (error) {
      console.error(
        'Error loading expenses:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const refreshExpenses = useCallback(loadExpenses, [user?.id]);

  async function addExpense({
    description,
    amount,
    currency = inputCurrency,
    categoryId,
    transactionDate = new Date(),
    status = 'completed',
    source = 'manual',
  }: ExpenseInput) {
    if (!user) {
      throw new Error(
        'User is not authenticated'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        description:
          description.trim(),
        amount,
        currency,
        transaction_date:
          transactionDate.toISOString(),
        status,
        source,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    setExpenses(
      (current) => [
        mapExpense(data),
        ...current,
      ]
    );
  }

  async function updateExpense(
    id: string,
    {
      description,
      amount,
      currency = inputCurrency,
      categoryId,
      transactionDate = new Date(),
      status = 'completed',
      source = 'manual',
    }: ExpenseInput
  ) {
    if (!user) {
      throw new Error(
        'User is not authenticated'
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('expenses')
      .update({
        category_id: categoryId,
        description:
          description.trim(),
        amount,
        currency,
        transaction_date:
          transactionDate.toISOString(),
        status,
        source,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setExpenses(
      (current) =>
        current
          .map((expense) =>
            expense.id === id
              ? mapExpense(data)
              : expense
          )
          .sort(
            (a, b) =>
              b.transactionDate.getTime() -
              a.transactionDate.getTime()
          )
    );
  }

  async function deleteExpense(
    id: string
  ) {
    if (!user) {
      throw new Error(
        'User is not authenticated'
      );
    }

    const { error } =
      await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    setExpenses(
      (current) =>
        current.filter(
          (expense) =>
            expense.id !== id
        )
    );
  }

  const total =
    useMemo(
      () =>
        expenses
          .filter(
            (expense) =>
              expense.status ===
              'completed'
          )
          .reduce(
            (sum, expense) =>
              sum +
              convertAmount(
                expense.amount,
                expense.currency
              ),
            0
          ),
      [convertAmount, expenses]
    );

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        loading,
        addExpense,
        updateExpense,
        deleteExpense,
        refreshExpenses,
        total,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context =
    useContext(
      ExpensesContext
    );

  if (!context) {
    throw new Error(
      'useExpenses must be used inside ExpensesProvider'
    );
  }

  return context;
}

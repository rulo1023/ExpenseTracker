import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from './auth-context';
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
  categoryId: string;
  transactionDate: Date;
  status: ExpenseStatus;
  source: ExpenseSource;
  createdAt: Date;
};

type NewExpenseInput = {
  description: string;
  amount: number;
  categoryId: string;
  transactionDate?: Date;
  status?: ExpenseStatus;
  source?: ExpenseSource;
};

type ExpensesContextType = {
  expenses: Expense[];
  loading: boolean;
  addExpense: (
    expense: NewExpenseInput
  ) => Promise<void>;
  total: number;
};

const ExpensesContext =
  createContext<ExpensesContextType | undefined>(
    undefined
  );

export function ExpensesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      return;
    }

    loadExpenses();
  }, [user?.id]);

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
        .order('transaction_date', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setExpenses(
        (data ?? []).map(
          (expense) => ({
            id: expense.id,
            description:
              expense.description,
            amount: Number(
              expense.amount
            ),
            categoryId:
              expense.category_id,
            transactionDate:
              new Date(
                expense.transaction_date
              ),
            status:
              expense.status as ExpenseStatus,
            source:
              expense.source as ExpenseSource,
            createdAt:
              new Date(
                expense.created_at
              ),
          })
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

  async function addExpense({
    description,
    amount,
    categoryId,
    transactionDate = new Date(),
    status = 'completed',
    source = 'manual',
  }: NewExpenseInput) {
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
        currency: 'EUR',
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

    const expense: Expense = {
      id: data.id,
      description:
        data.description,
      amount: Number(data.amount),
      categoryId:
        data.category_id,
      transactionDate:
        new Date(
          data.transaction_date
        ),
      status:
        data.status as ExpenseStatus,
      source:
        data.source as ExpenseSource,
      createdAt:
        new Date(data.created_at),
    };

    setExpenses((current) => [
      expense,
      ...current,
    ]);
  }

  const total = useMemo(
    () =>
      expenses
        .filter(
          (expense) =>
            expense.status ===
            'completed'
        )
        .reduce(
          (sum, expense) =>
            sum + expense.amount,
          0
        ),
    [expenses]
  );

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        loading,
        addExpense,
        total,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context =
    useContext(ExpensesContext);

  if (!context) {
    throw new Error(
      'useExpenses must be used inside ExpensesProvider'
    );
  }

  return context;
}

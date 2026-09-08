import React, { createContext, useContext, useMemo, useState } from 'react';

export type ExpenseStatus = 'completed' | 'planned';

export type ExpenseSource =
  | 'manual'
  | 'text'
  | 'voice'
  | 'recurring';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  categoryId: string | null;
  transactionDate: Date;
  status: ExpenseStatus;
  source: ExpenseSource;
  createdAt: Date;
};

type NewExpenseInput = {
  description: string;
  amount: number;
  categoryId?: string | null;
  transactionDate?: Date;
  status?: ExpenseStatus;
  source?: ExpenseSource;
};

type ExpensesContextType = {
  expenses: Expense[];
  addExpense: (expense: NewExpenseInput) => void;
  total: number;
};

const ExpensesContext = createContext<ExpensesContextType | undefined>(
  undefined
);

export function ExpensesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  function addExpense({
    description,
    amount,
    categoryId = null,
    transactionDate = new Date(),
    status = 'completed',
    source = 'manual',
  }: NewExpenseInput) {
    const expense: Expense = {
      id: Date.now().toString(),
      description,
      amount,
      categoryId,
      transactionDate,
      status,
      source,
      createdAt: new Date(),
    };

    setExpenses((current) => [expense, ...current]);
  }

  const total = useMemo(
    () =>
      expenses
        .filter((expense) => expense.status === 'completed')
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        addExpense,
        total,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);

  if (!context) {
    throw new Error(
      'useExpenses must be used inside ExpensesProvider'
    );
  }

  return context;
}

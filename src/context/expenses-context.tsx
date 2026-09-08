import React, { createContext, useContext, useMemo, useState } from 'react';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  createdAt: Date;
};

type ExpensesContextType = {
  expenses: Expense[];
  addExpense: (description: string, amount: number) => void;
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

  function addExpense(description: string, amount: number) {
    const expense: Expense = {
      id: Date.now().toString(),
      description,
      amount,
      createdAt: new Date(),
    };

    setExpenses((current) => [expense, ...current]);
  }

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
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

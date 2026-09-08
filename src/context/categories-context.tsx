import React, { createContext, useContext, useState } from 'react';

export type Category = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

type CategoriesContextType = {
  categories: Category[];
  addCategory: (name: string, description: string) => void;
  getCategoryById: (id: string | null) => Category | undefined;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(
  undefined
);

const initialCategories: Category[] = [
  {
    id: 'shopping',
    name: 'Compra',
    description:
      'Supermercado, alimentación y productos habituales para casa.',
    createdAt: new Date(),
  },
  {
    id: 'treats',
    name: 'Caprichos',
    description:
      'Comidas, compras y pequeños gastos fuera de la rutina.',
    createdAt: new Date(),
  },
  {
    id: 'leisure',
    name: 'Ocio',
    description:
      'Actividades y gastos destinados principalmente al entretenimiento.',
    createdAt: new Date(),
  },
];

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  function addCategory(name: string, description: string) {
    const category: Category = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date(),
    };

    setCategories((current) => [...current, category]);
  }

  function getCategoryById(id: string | null) {
    if (!id) {
      return undefined;
    }

    return categories.find((category) => category.id === id);
  }

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        addCategory,
        getCategoryById,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);

  if (!context) {
    throw new Error(
      'useCategories must be used inside CategoriesProvider'
    );
  }

  return context;
}

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from './auth-context';
import { supabase } from '../lib/supabase';

export type Category = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
};

type CategoriesContextType = {
  categories: Category[];
  loading: boolean;
  addCategory: (
    name: string,
    description: string
  ) => Promise<void>;
  getCategoryById: (
    id: string | null
  ) => Category | undefined;
};

const CategoriesContext =
  createContext<CategoriesContextType | undefined>(
    undefined
  );

const defaultCategories = [
  {
    name: 'Compra',
    description:
      'Supermercado, alimentación y productos habituales para casa.',
  },
  {
    name: 'Caprichos',
    description:
      'Comidas, compras y pequeños gastos fuera de la rutina.',
  },
  {
    name: 'Ocio',
    description:
      'Actividades y gastos destinados principalmente al entretenimiento.',
  },
];

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      return;
    }

    loadCategories();
  }, [user?.id]);

  async function loadCategories() {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        const {
          data: inserted,
          error: insertError,
        } = await supabase
          .from('categories')
          .insert(
            defaultCategories.map(
              (category) => ({
                user_id: user.id,
                name: category.name,
                description:
                  category.description,
              })
            )
          )
          .select();

        if (insertError) {
          throw insertError;
        }

        setCategories(
          (inserted ?? []).map(
            (category) => ({
              id: category.id,
              name: category.name,
              description:
                category.description,
              createdAt: new Date(
                category.created_at
              ),
            })
          )
        );

        return;
      }

      setCategories(
        data.map((category) => ({
          id: category.id,
          name: category.name,
          description:
            category.description,
          createdAt: new Date(
            category.created_at
          ),
        }))
      );
    } catch (error) {
      console.error(
        'Error loading categories:',
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function addCategory(
    name: string,
    description: string
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
      .from('categories')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description:
          description.trim(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const category: Category = {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(
        data.created_at
      ),
    };

    setCategories((current) => [
      ...current,
      category,
    ]);
  }

  function getCategoryById(
    id: string | null
  ) {
    if (!id) {
      return undefined;
    }

    return categories.find(
      (category) => category.id === id
    );
  }

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        addCategory,
        getCategoryById,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context =
    useContext(CategoriesContext);

  if (!context) {
    throw new Error(
      'useCategories must be used inside CategoriesProvider'
    );
  }

  return context;
}

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
  icon: string;
  color: string;
  createdAt: Date;
};

type CategoryInput = {
  name: string;
  description: string;
  icon: string;
  color: string;
};

type CategoriesContextType = {
  categories: Category[];
  loading: boolean;

  addCategory: (
    name: string,
    description: string,
    icon?: string,
    color?: string
  ) => Promise<void>;

  updateCategory: (
    id: string,
    input: CategoryInput
  ) => Promise<void>;

  deleteCategory: (
    id: string
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
    icon: 'basket-outline',
    color: '#22C55E',
  },
  {
    name: 'Caprichos',
    description:
      'Comidas, compras y pequeños gastos fuera de la rutina.',
    icon: 'sparkles-outline',
    color: '#F97316',
  },
  {
    name: 'Ocio',
    description:
      'Actividades y gastos destinados principalmente al entretenimiento.',
    icon: 'game-controller-outline',
    color: '#8B5CF6',
  },
];

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon:
      row.icon ??
      'pricetag-outline',
    color:
      row.color ??
      '#6366F1',
    createdAt:
      new Date(row.created_at),
  };
}

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

    void loadCategories();
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
        .eq(
          'user_id',
          user.id
        )
        .order(
          'created_at',
          {
            ascending: true,
          }
        );

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
                user_id:
                  user.id,
                ...category,
              })
            )
          )
          .select();

        if (insertError) {
          throw insertError;
        }

        setCategories(
          (inserted ?? []).map(
            mapCategory
          )
        );

        return;
      }

      setCategories(
        data.map(mapCategory)
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
    description: string,
    icon = 'pricetag-outline',
    color = '#6366F1'
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
        icon,
        color,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    setCategories(
      (current) => [
        ...current,
        mapCategory(data),
      ]
    );
  }

  async function updateCategory(
    id: string,
    input: CategoryInput
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
      .update({
        name:
          input.name.trim(),
        description:
          input.description.trim(),
        icon:
          input.icon,
        color:
          input.color,
      })
      .eq('id', id)
      .eq(
        'user_id',
        user.id
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    setCategories(
      (current) =>
        current.map(
          (category) =>
            category.id === id
              ? mapCategory(data)
              : category
        )
    );
  }

  async function deleteCategory(
    id: string
  ) {
    if (!user) {
      throw new Error(
        'User is not authenticated'
      );
    }

    const { error } =
      await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq(
          'user_id',
          user.id
        );

    if (error) {
      throw error;
    }

    setCategories(
      (current) =>
        current.filter(
          (category) =>
            category.id !== id
        )
    );
  }

  function getCategoryById(
    id: string | null
  ) {
    if (!id) {
      return undefined;
    }

    return categories.find(
      (category) =>
        category.id === id
    );
  }

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        loading,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context =
    useContext(
      CategoriesContext
    );

  if (!context) {
    throw new Error(
      'useCategories must be used inside CategoriesProvider'
    );
  }

  return context;
}

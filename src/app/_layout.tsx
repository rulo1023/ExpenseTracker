import { Stack } from 'expo-router';

import { CategoriesProvider } from '../context/categories-context';
import { ExpensesProvider } from '../context/expenses-context';

export default function RootLayout() {
  return (
    <CategoriesProvider>
      <ExpensesProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ExpensesProvider>
    </CategoriesProvider>
  );
}

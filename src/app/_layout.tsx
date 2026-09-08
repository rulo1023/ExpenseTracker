import { Stack } from 'expo-router';

import { AuthProvider } from '../context/auth-context';
import { CategoriesProvider } from '../context/categories-context';
import { ExpensesProvider } from '../context/expenses-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <ExpensesProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ExpensesProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
}

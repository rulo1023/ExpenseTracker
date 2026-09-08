import { Stack } from 'expo-router';

import { AuthProvider } from '../context/auth-context';
import { CategoriesProvider } from '../context/categories-context';
import { ExpensesProvider } from '../context/expenses-context';
import { PreferencesProvider } from '../context/preferences-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
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
      </PreferencesProvider>
    </AuthProvider>
  );
}

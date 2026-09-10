import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  AppSettingsProvider,
  useAppSettings,
} from '../context/app-settings-context';
import { AuthProvider } from '../context/auth-context';
import { CategoriesProvider } from '../context/categories-context';
import { ExpensesProvider } from '../context/expenses-context';
import { FeedbackProvider } from '../context/feedback-context';
import { FinanceProvider } from '../context/finance-context';
import { PreferencesProvider } from '../context/preferences-context';

export default function RootLayout() {
  return (
    <AppSettingsProvider>
      <AppContent />
    </AppSettingsProvider>
  );
}

function AppContent() {
  const { isDark } = useAppSettings();

  return (
    <AuthProvider>
      <FeedbackProvider>
        <PreferencesProvider>
          <CategoriesProvider>
            <ExpensesProvider>
              <FinanceProvider>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: isDark ? '#0F1115' : '#F6F7F9',
                    },
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </FinanceProvider>
            </ExpensesProvider>
          </CategoriesProvider>
        </PreferencesProvider>
      </FeedbackProvider>
    </AuthProvider>
  );
}

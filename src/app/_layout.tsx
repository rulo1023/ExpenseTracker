import { Stack } from 'expo-router';
import { ExpensesProvider } from '../context/expenses-context';

export default function RootLayout() {
  return (
    <ExpensesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ExpensesProvider>
  );
}

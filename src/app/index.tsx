import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { useAuth } from '../context/auth-context';

export default function IndexScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7F9',
  },
});

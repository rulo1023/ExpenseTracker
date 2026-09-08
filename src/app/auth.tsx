import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const { session } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Datos incompletos',
        'Introduce tu email y contraseña.'
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert(
          'No se pudo iniciar sesión',
          error.message
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Datos incompletos',
        'Introduce tu email y contraseña.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña demasiado corta',
        'Utiliza al menos 6 caracteres.'
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert(
          'No se pudo crear la cuenta',
          error.message
        );
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Revisa tu correo',
          'Te hemos enviado un email para confirmar tu cuenta.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>€</Text>
        </View>

        <Text style={styles.title}>ExpenseTracker</Text>

        <Text style={styles.subtitle}>
          Entiende tu dinero sin perder tiempo registrándolo.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>Contraseña</Text>

          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.disabledButton,
            ]}
            disabled={loading}
            onPress={handleSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Iniciar sesión
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>o</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={loading}
            onPress={handleSignUp}
          >
            <Text style={styles.secondaryButtonText}>
              Crear una cuenta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    color: '#6B7280',
  },

  form: {
    marginTop: 38,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },

  primaryButton: {
    marginTop: 6,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },

  separatorText: {
    marginHorizontal: 14,
    color: '#9CA3AF',
  },

  secondaryButton: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});

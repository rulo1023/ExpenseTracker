import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../context/auth-context';
import { useFeedback } from '../../context/feedback-context';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  value: string;
};

function SettingRow({
  icon,
  iconColor,
  iconBackground,
  title,
  value,
}: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: iconBackground },
        ]}
      >
        <Ionicons
          name={icon}
          size={21}
          color={iconColor}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { showFeedback } = useFeedback();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showFeedback(
        'No se pudo cerrar la sesión.',
        'error'
      );
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ajustes</Text>

        <Text style={styles.subtitle}>
          Tu cuenta y preferencias de ExpenseTracker.
        </Text>

        <Text style={styles.sectionTitle}>Cuenta</Text>

        <View style={styles.card}>
          <SettingRow
            icon="person-outline"
            iconColor="#4F46E5"
            iconBackground="#EEF2FF"
            title="Sesión iniciada"
            value={user?.email ?? 'Cuenta de ExpenseTracker'}
          />
        </View>

        <Text style={styles.sectionTitle}>Aplicación</Text>

        <View style={styles.card}>
          <SettingRow
            icon="cash-outline"
            iconColor="#047857"
            iconBackground="#ECFDF5"
            title="Moneda"
            value="Euro (EUR)"
          />

          <View style={styles.divider} />

          <SettingRow
            icon="sparkles-outline"
            iconColor="#7C3AED"
            iconBackground="#F3E8FF"
            title="Clasificación local"
            value="E5 procesa los conceptos en este dispositivo"
          />

          <View style={styles.divider} />

          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#0369A1"
            iconBackground="#E0F2FE"
            title="Privacidad"
            value="Los conceptos no se envían a servicios de IA"
          />
        </View>

        <Text style={styles.sectionTitle}>Información</Text>

        <View style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            iconColor="#4B5563"
            iconBackground="#F3F4F6"
            title="Versión"
            value={Constants.expoConfig?.version ?? '1.0.0'}
          />
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          activeOpacity={0.78}
          style={[
            styles.logoutButton,
            signingOut && styles.logoutButtonDisabled,
          ]}
          disabled={signingOut}
          onPress={() => void handleSignOut()}
        >
          {signingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#DC2626"
            />
          )}

          <Text style={styles.logoutText}>
            {signingOut
              ? 'Cerrando sesión…'
              : 'Cerrar sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  title: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },

  sectionTitle: {
    marginTop: 26,
    marginBottom: 9,
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowText: {
    flex: 1,
    paddingVertical: 12,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  rowValue: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },

  divider: {
    height: 1,
    marginLeft: 54,
    backgroundColor: '#F0F1F3',
  },

  spacer: {
    flex: 1,
    minHeight: 42,
  },

  logoutButton: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  logoutButtonDisabled: {
    opacity: 0.55,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});

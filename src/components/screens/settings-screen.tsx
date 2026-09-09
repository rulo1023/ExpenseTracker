import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { E5Status } from '../main-pager';
import {
  CURRENCIES,
  CurrencyCode,
  currencyInfo,
  useAppSettings,
} from '../../context/app-settings-context';
import { useAuth } from '../../context/auth-context';
import { useFeedback } from '../../context/feedback-context';
import { useAppStyles } from '../../lib/themed-styles';

type SettingsScreenProps = {
  e5Status: E5Status;
};

type CurrencyPickerMode = 'input' | 'display' | null;

function e5Description(status: E5Status) {
  if (status === 'ready') return 'Modelo cargado y listo para clasificar';
  if (status === 'error') return 'No disponible · se está usando la heurística';
  if (status === 'expo-go') return 'Expo Go · disponible en la development build';
  return 'Preparando tokenizer y modelo local…';
}

function e5Colors(status: E5Status) {
  if (status === 'ready') {
    return { color: '#047857', background: '#DCFCE7' };
  }
  if (status === 'error') {
    return { color: '#B91C1C', background: '#FEE2E2' };
  }
  return { color: '#A16207', background: '#FEF3C7' };
}

export default function SettingsScreen({
  e5Status,
}: SettingsScreenProps) {
  const styles = useAppStyles(lightStyles);
  const { user, signOut } = useAuth();
  const { showFeedback } = useFeedback();
  const {
    inputCurrency,
    displayCurrency,
    themeMode,
    rateStatus,
    setInputCurrency,
    setDisplayCurrency,
    setThemeMode,
    refreshRates,
    getRate,
  } = useAppSettings();
  const [signingOut, setSigningOut] = useState(false);
  const [currencyPicker, setCurrencyPicker] =
    useState<CurrencyPickerMode>(null);

  const currentRate = getRate(inputCurrency);
  const modelColors = e5Colors(e5Status);

  async function handleSignOut() {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showFeedback('No se pudo cerrar la sesión.', 'error');
      setSigningOut(false);
    }
  }

  async function handleRefreshRate() {
    const updated = await refreshRates([inputCurrency], true);
    showFeedback(
      updated
        ? 'Tipo de cambio actualizado'
        : 'No se pudo actualizar el cambio',
      updated ? 'info' : 'error'
    );
  }

  function chooseCurrency(currency: CurrencyCode) {
    if (currencyPicker === 'input') setInputCurrency(currency);
    if (currencyPicker === 'display') setDisplayCurrency(currency);
    setCurrencyPicker(null);
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
            styles={styles}
            icon="person-outline"
            iconColor="#4F46E5"
            iconBackground="#EEF2FF"
            title="Sesión iniciada"
            value={user?.email ?? 'Cuenta de ExpenseTracker'}
          />
        </View>

        <Text style={styles.sectionTitle}>Divisas</Text>
        <View style={styles.card}>
          <SettingRow
            styles={styles}
            icon="wallet-outline"
            iconColor="#047857"
            iconBackground="#ECFDF5"
            title="Moneda de entrada"
            value={`${currencyInfo(inputCurrency).name} (${inputCurrency}) · gastos nuevos`}
            onPress={() => setCurrencyPicker('input')}
          />
          <View style={styles.divider} />
          <SettingRow
            styles={styles}
            icon="swap-horizontal-outline"
            iconColor="#0369A1"
            iconBackground="#E0F2FE"
            title="Moneda mostrada"
            value={`${currencyInfo(displayCurrency).name} (${displayCurrency}) · resúmenes y listados`}
            onPress={() => setCurrencyPicker('display')}
          />
          <View style={styles.divider} />
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.rateRow}
            onPress={() => void handleRefreshRate()}
            disabled={rateStatus === 'loading'}
          >
            <View style={styles.rateText}>
              <Text style={styles.rowTitle}>Tipo de cambio</Text>
              <Text style={styles.rowValue}>
                {inputCurrency === displayCurrency
                  ? `1 ${inputCurrency} = 1 ${displayCurrency}`
                  : currentRate
                    ? `1 ${inputCurrency} = ${currentRate.rate.toLocaleString('es-ES', {
                        maximumFractionDigits: 6,
                      })} ${displayCurrency} · ${currentRate.date}`
                    : rateStatus === 'error'
                      ? 'Sin conexión · se mantendrá el último cambio disponible'
                      : 'Obteniendo la cotización más reciente…'}
              </Text>
              <Text style={styles.rateProvider}>
                Referencia diaria de Frankfurter · toca para actualizar
              </Text>
            </View>
            {rateStatus === 'loading' ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <Ionicons name="refresh" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.themeControl}>
          <ThemeOption
            styles={styles}
            label="Claro"
            icon="sunny-outline"
            selected={themeMode === 'light'}
            onPress={() => setThemeMode('light')}
          />
          <ThemeOption
            styles={styles}
            label="Oscuro"
            icon="moon-outline"
            selected={themeMode === 'dark'}
            onPress={() => setThemeMode('dark')}
          />
        </View>

        <Text style={styles.sectionTitle}>IA local</Text>
        <View style={styles.card}>
          <SettingRow
            styles={styles}
            icon={e5Status === 'ready' ? 'checkmark-circle' : 'sparkles-outline'}
            iconColor={modelColors.color}
            iconBackground={modelColors.background}
            title="Estado de E5"
            value={e5Description(e5Status)}
          />
          <View style={styles.divider} />
          <SettingRow
            styles={styles}
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
            styles={styles}
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
            <Ionicons name="log-out-outline" size={21} color="#DC2626" />
          )}
          <Text style={styles.logoutText}>
            {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CurrencyPickerModal
        visible={currencyPicker !== null}
        title={
          currencyPicker === 'input'
            ? 'Moneda de entrada'
            : 'Moneda mostrada'
        }
        selected={
          currencyPicker === 'input' ? inputCurrency : displayCurrency
        }
        onSelect={chooseCurrency}
        onClose={() => setCurrencyPicker(null)}
      />
    </SafeAreaView>
  );
}

function SettingRow({
  styles,
  icon,
  iconColor,
  iconBackground,
  title,
  value,
  onPress,
}: {
  styles: typeof lightStyles;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      )}
    </>
  );

  return onPress ? (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {content}
    </TouchableOpacity>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

function ThemeOption({
  styles,
  label,
  icon,
  selected,
  onPress,
}: {
  styles: typeof lightStyles;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.themeOption, selected && styles.themeOptionSelected]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={21}
        color={selected ? '#4F46E5' : '#6B7280'}
      />
      <Text style={[styles.themeText, selected && styles.themeTextSelected]}>
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={19} color="#4F46E5" />
      )}
    </TouchableOpacity>
  );
}

function CurrencyPickerModal({
  visible,
  title,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  selected: CurrencyCode;
  onSelect: (currency: CurrencyCode) => void;
  onClose: () => void;
}) {
  const styles = useAppStyles(lightStyles);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>Elige una divisa habitual.</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.currencyList}>
          {CURRENCIES.map((currency) => {
            const active = currency.code === selected;
            return (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyRow,
                  active && styles.currencyRowSelected,
                ]}
                onPress={() => onSelect(currency.code)}
              >
                <View style={styles.currencySymbolBox}>
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                </View>
                <View style={styles.currencyText}>
                  <Text style={styles.currencyName}>{currency.name}</Text>
                  <Text style={styles.currencyCode}>{currency.code}</Text>
                </View>
                <Ionicons
                  name={active ? 'checkmark-circle' : 'chevron-forward'}
                  size={active ? 22 : 18}
                  color={active ? '#4F46E5' : '#D1D5DB'}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7F9' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  title: { marginTop: 12, fontSize: 30, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 5, fontSize: 14, lineHeight: 20, color: '#6B7280' },
  sectionTitle: {
    marginTop: 25,
    marginBottom: 9,
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { paddingHorizontal: 15, borderRadius: 18, backgroundColor: '#FFFFFF' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, paddingVertical: 12 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  rowValue: { marginTop: 3, fontSize: 12, lineHeight: 17, color: '#6B7280' },
  divider: { height: 1, marginLeft: 54, backgroundColor: '#F0F1F3' },
  rateRow: {
    minHeight: 82,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rateText: { flex: 1 },
  rateProvider: { marginTop: 5, fontSize: 11, color: '#9CA3AF' },
  themeControl: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    minHeight: 58,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  themeOptionSelected: { borderColor: '#818CF8', backgroundColor: '#EEF2FF' },
  themeText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#4B5563' },
  themeTextSelected: { color: '#4F46E5' },
  spacer: { flex: 1, minHeight: 42 },
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
  logoutButtonDisabled: { opacity: 0.55 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
  modalSafeArea: { flex: 1, backgroundColor: '#F6F7F9' },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 26, fontWeight: '700', color: '#111827' },
  modalSubtitle: { marginTop: 4, fontSize: 13, color: '#6B7280' },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyList: { paddingHorizontal: 20, paddingBottom: 40, gap: 9 },
  currencyRow: {
    minHeight: 64,
    padding: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyRowSelected: { borderColor: '#818CF8', backgroundColor: '#EEF2FF' },
  currencySymbolBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: { fontSize: 16, fontWeight: '800', color: '#374151' },
  currencyText: { flex: 1 },
  currencyName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  currencyCode: { marginTop: 3, fontSize: 12, color: '#6B7280' },
});

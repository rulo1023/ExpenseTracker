import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useConnectivity } from '../context/connectivity-context';
import { useE5Model } from '../context/e5-model-context';
import { useAppStyles } from '../lib/themed-styles';

function formatSize(bytes: number) {
  if (bytes <= 0) return '';
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
}

export default function AppStatusBanners() {
  const styles = useAppStyles(lightStyles);
  const connectivity = useConnectivity();
  const model = useE5Model();
  const showModel = ['checking', 'downloading', 'loading', 'error'].includes(model.status);

  if (connectivity.status !== 'offline' && !showModel) return null;

  const percentage = Math.round(model.progress * 100);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {connectivity.status === 'offline' && (
        <Pressable style={[styles.banner, styles.offline]} onPress={connectivity.retry}>
          <Ionicons name="cloud-offline-outline" size={21} color="#92400E" />
          <View style={styles.textBlock}>
            <Text style={styles.title}>Sin conexión</Text>
            <Text style={styles.message}>Comprueba Internet y toca para reintentar.</Text>
          </View>
          <Ionicons name="refresh" size={19} color="#92400E" />
        </Pressable>
      )}

      {showModel && (
        <Pressable
          disabled={model.status !== 'error'}
          style={[styles.banner, model.status === 'error' ? styles.modelError : styles.modelLoading]}
          onPress={model.retry}
        >
          <Ionicons
            name={model.status === 'error' ? 'alert-circle-outline' : 'sparkles-outline'}
            size={21}
            color={model.status === 'error' ? '#B91C1C' : '#4338CA'}
          />
          <View style={styles.textBlock}>
            <Text style={styles.title}>
              {model.status === 'error'
                ? 'La categorización inteligente no pudo iniciarse'
                : model.status === 'downloading'
                  ? `Descargando IA local · ${percentage}%`
                  : 'Preparando IA local'}
            </Text>
            <Text style={styles.message}>
              {model.status === 'error'
                ? 'La categorización básica sigue activa. Toca para reintentar.'
                : model.status === 'downloading' && model.downloadedBytes > 0
                  ? `${formatSize(model.downloadedBytes)}${model.totalBytes > 0 ? ` de ${formatSize(model.totalBytes)}` : ''}`
                  : 'Puedes seguir usando la aplicación.'}
            </Text>
            {model.status === 'downloading' && (
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percentage}%` }]} />
              </View>
            )}
          </View>
          {model.status === 'error' && <Ionicons name="refresh" size={19} color="#B91C1C" />}
        </Pressable>
      )}
    </View>
  );
}

const lightStyles = StyleSheet.create({
  container: {
    position: 'absolute', left: 14, right: 14, bottom: 82, zIndex: 30, gap: 8,
  },
  banner: {
    minHeight: 62, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 17,
    borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11,
    shadowColor: '#111827', shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 7,
  },
  offline: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  modelLoading: { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' },
  modelError: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  textBlock: { flex: 1 },
  title: { fontSize: 13, fontWeight: '800', color: '#111827' },
  message: { marginTop: 2, fontSize: 11, lineHeight: 15, color: '#4B5563' },
  progressTrack: {
    height: 4, marginTop: 7, overflow: 'hidden', borderRadius: 2, backgroundColor: '#C7D2FE',
  },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: '#4F46E5' },
});

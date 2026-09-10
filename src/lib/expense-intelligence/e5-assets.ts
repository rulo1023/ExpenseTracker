import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

const MODEL_URL =
  'https://huggingface.co/Xenova/multilingual-e5-small/resolve/main/onnx/model_int8.onnx?download=true';

const TOKENIZER_ASSET = require(
  '../../../assets/models/e5-small/tokenizer.jsonasset'
);

const TOKENIZER_CONFIG_ASSET = require(
  '../../../assets/models/e5-small/tokenizer_config.jsonasset'
);

// El modelo oficial pesa unos 118 MB.
// Este límite permite detectar descargas claramente incompletas.
const MIN_MODEL_SIZE = 100_000_000;

export type E5AssetState = {
  phase: 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  message?: string;
};

let assetState: E5AssetState = {
  phase: 'idle',
  progress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
};

const assetListeners = new Set<(state: E5AssetState) => void>();

function emitAssetState(next: E5AssetState) {
  assetState = next;
  assetListeners.forEach((listener) => listener(next));
}

export function subscribeE5AssetState(listener: (state: E5AssetState) => void) {
  assetListeners.add(listener);
  listener(assetState);
  return () => {
    assetListeners.delete(listener);
  };
}

let modelPromise: Promise<string> | null = null;

async function resolveAsset(
  moduleId: number
): Promise<string> {
  const asset =
    Asset.fromModule(moduleId);

  await asset.downloadAsync();

  const uri =
    asset.localUri ??
    asset.uri;

  if (!uri) {
    throw new Error(
      'No se pudo resolver un asset de E5.'
    );
  }

  return uri;
}

async function ensureModelDownloaded(): Promise<string> {
  emitAssetState({ phase: 'checking', progress: 0, downloadedBytes: 0, totalBytes: 0 });
  const root =
    FileSystem.documentDirectory;

  if (!root) {
    throw new Error(
      'No existe documentDirectory.'
    );
  }

  const directory =
    `${root}models/e5-small/`;

  const modelPath =
    `${directory}model_int8.onnx`;

  await FileSystem.makeDirectoryAsync(
    directory,
    {
      intermediates: true,
    }
  );

  const current =
    await FileSystem.getInfoAsync(
      modelPath
    );

  if (
    current.exists &&
    'size' in current &&
    typeof current.size ===
      'number' &&
    current.size >=
      MIN_MODEL_SIZE
  ) {
    emitAssetState({
      phase: 'downloaded',
      progress: 1,
      downloadedBytes: current.size,
      totalBytes: current.size,
    });
    if (__DEV__) {
      console.log(
        `[E5] modelo ya instalado (${(
          current.size /
          1024 /
          1024
        ).toFixed(1)} MB)`
      );
    }

    return modelPath;
  }

  // Android puede dejar un archivo parcial
  // si una descarga se interrumpe.
  if (current.exists) {
    await FileSystem.deleteAsync(
      modelPath,
      {
        idempotent: true,
      }
    );
  }

  console.log(
    '[E5] descargando modelo (~118 MB)...'
  );

  emitAssetState({ phase: 'downloading', progress: 0, downloadedBytes: 0, totalBytes: 0 });

  const download = FileSystem.createDownloadResumable(
    MODEL_URL,
    modelPath,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const progress = totalBytesExpectedToWrite > 0
        ? Math.min(totalBytesWritten / totalBytesExpectedToWrite, 1)
        : 0;
      emitAssetState({
        phase: 'downloading',
        progress,
        downloadedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite,
      });
    }
  );

  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error('La descarga del modelo E5 no devolvió ningún archivo.');
  }

  const downloaded =
    await FileSystem.getInfoAsync(
      result.uri
    );

  if (
    !downloaded.exists ||
    !('size' in downloaded) ||
    typeof downloaded.size !==
      'number' ||
    downloaded.size <
      MIN_MODEL_SIZE
  ) {
    await FileSystem.deleteAsync(
      modelPath,
      {
        idempotent: true,
      }
    );

    throw new Error(
      'La descarga del modelo E5 quedó incompleta.'
    );
  }

  console.log(
    `[E5] modelo instalado (${(
      downloaded.size /
      1024 /
      1024
    ).toFixed(1)} MB)`
  );

  emitAssetState({
    phase: 'downloaded',
    progress: 1,
    downloadedBytes: downloaded.size,
    totalBytes: downloaded.size,
  });

  return modelPath;
}

export async function getE5ModelPath() {
  if (!modelPromise) {
    modelPromise =
      ensureModelDownloaded();
  }

  try {
    return await modelPromise;
  } catch (error) {
    modelPromise = null;
    emitAssetState({
      phase: 'error',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      message: error instanceof Error ? error.message : 'No se pudo descargar E5.',
    });
    throw error;
  }
}

export async function prepareE5Model() {
  return getE5ModelPath();
}

async function readJsonAsset(
  moduleId: number
): Promise<unknown> {
  const uri =
    await resolveAsset(
      moduleId
    );

  const contents =
    await FileSystem.readAsStringAsync(
      uri
    );

  return JSON.parse(
    contents
  );
}

export async function loadTokenizerFiles() {
  const [
    tokenizerJson,
    tokenizerConfig,
  ] = await Promise.all([
    readJsonAsset(
      TOKENIZER_ASSET
    ),
    readJsonAsset(
      TOKENIZER_CONFIG_ASSET
    ),
  ]);

  return {
    tokenizerJson,
    tokenizerConfig,
  };
}

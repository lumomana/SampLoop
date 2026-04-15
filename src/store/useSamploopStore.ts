import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { ensureLibrarySchema, getAllLibraryItems, upsertLibraryItems } from '../db/libraryRepository';
import {
  assignSampleToTrackState,
  clampBpm,
  colorFromName,
  createEmptyTrack,
  estimateWaveformPreviewFromSeed,
  getAvailableLibraryItems,
  releaseTrackSample,
  sanitizeHexColor,
  SamploopLibraryItem,
  trackColors,
  TrackEffectsState,
  TrackState,
} from '../lib/samploop-core';
import { getSeededLibraryItems } from '../lib/seededSamples';

type StoreState = {
  booting: boolean;
  importing: boolean;
  query: string;
  library: SamploopLibraryItem[];
  tracks: TrackState[];
  selectedTrackId: number;
  error?: string;
  bootstrap: () => Promise<void>;
  setQuery: (query: string) => void;
  assignSampleToTrack: (trackId: number, sampleId: string) => void;
  clearTrack: (trackId: number) => void;
  setSelectedTrack: (trackId: number) => void;
  setTrackVolume: (trackId: number, volume: number) => void;
  setTrackBpm: (trackId: number, bpm: number) => void;
  setTrackColor: (trackId: number, color: string) => void;
  setTrackEffect: (trackId: number, effect: keyof TrackEffectsState, value: number) => void;
  toggleTrackLoop: (trackId: number) => void;
  setTrackPlaying: (trackId: number, playing: boolean) => void;
  importAudioFile: () => Promise<void>;
};

const APP_AUDIO_DIR = Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory ?? ''}samploop-audio/`;

function createInitialTracks() {
  return Array.from({ length: 9 }, (_, index) => createEmptyTrack(index + 1, trackColors[index]!));
}

async function ensureAudioDirectory() {
  if (Platform.OS === 'web') return;

  const info = await FileSystem.getInfoAsync(APP_AUDIO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(APP_AUDIO_DIR, { intermediates: true });
  }
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

async function buildImportedItem(asset: DocumentPicker.DocumentPickerAsset): Promise<SamploopLibraryItem> {
  const extension = asset.name.split('.').pop()?.toLowerCase() ?? 'wav';
  const safeBase = asset.name.replace(/\.[^.]+$/, '').trim() || 'Imported Sample';
  const timestamp = Date.now();
  const id = `user-${timestamp}`;

  let localUri = asset.uri;

  if (Platform.OS !== 'web') {
    await ensureAudioDirectory();
    const targetUri = `${APP_AUDIO_DIR}${id}.${extension}`;
    await FileSystem.copyAsync({ from: asset.uri, to: targetUri });
    localUri = targetUri;
  }

  return {
    id,
    name: safeBase,
    color: colorFromName(safeBase),
    category: 'User Import',
    bpm: 100,
    durationMs: 1000,
    localUri,
    sourceKind: 'user_import',
    isLoop: true,
    waveformPreview: estimateWaveformPreviewFromSeed(safeBase),
    originalFileName: asset.name,
    createdAt: timestamp,
  };
}

export const useSamploopStore = create<StoreState>((set, get) => ({
  booting: true,
  importing: false,
  query: '',
  library: [],
  tracks: createInitialTracks(),
  selectedTrackId: 1,
  error: undefined,

  bootstrap: async () => {
    try {
      set({ booting: true, error: undefined });
      await ensureLibrarySchema();
      await ensureAudioDirectory();

      const seeded = await getSeededLibraryItems();
      await upsertLibraryItems(seeded);
      const library = await getAllLibraryItems();

      set({ library, booting: false });
    } catch (error) {
      set({
        booting: false,
        error: error instanceof Error ? error.message : 'Bootstrap mobile impossible',
      });
    }
  },

  setQuery: (query) => set({ query }),

  assignSampleToTrack: (trackId, sampleId) => {
    const { library, tracks } = get();
    const sample = library.find((item) => item.id === sampleId);
    if (!sample) return;

    set({
      tracks: tracks.map((track) =>
        track.id === trackId ? assignSampleToTrackState(track, sample) : track,
      ),
      selectedTrackId: trackId,
    });
  },

  clearTrack: (trackId) => {
    const { tracks } = get();
    set({
      tracks: tracks.map((track, index) =>
        track.id === trackId ? releaseTrackSample(track, trackColors[index]!) : track,
      ),
    });
  },

  setSelectedTrack: (selectedTrackId) => set({ selectedTrackId }),

  setTrackVolume: (trackId, volume) => {
    set({
      tracks: get().tracks.map((track) =>
        track.id === trackId ? { ...track, volume: Math.max(0, Math.min(100, Math.round(volume))) } : track,
      ),
    });
  },

  setTrackBpm: (trackId, bpm) => {
    set({
      tracks: get().tracks.map((track) =>
        track.id === trackId ? { ...track, bpm: clampBpm(bpm) } : track,
      ),
    });
  },

  setTrackColor: (trackId, color) => {
    const fallback = get().tracks.find((track) => track.id === trackId)?.color ?? '#F59E0B';
    set({
      tracks: get().tracks.map((track) =>
        track.id === trackId ? { ...track, color: sanitizeHexColor(color, fallback) } : track,
      ),
    });
  },

  setTrackEffect: (trackId, effect, value) => {
    set({
      tracks: get().tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              effects: {
                ...track.effects,
                [effect]: clampUnit(value),
              },
            }
          : track,
      ),
    });
  },

  toggleTrackLoop: (trackId) => {
    set({
      tracks: get().tracks.map((track) =>
        track.id === trackId ? { ...track, loop: !track.loop } : track,
      ),
    });
  },

  setTrackPlaying: (trackId, playing) => {
    set({
      tracks: get().tracks.map((track) =>
        track.id === trackId ? { ...track, playing } : track,
      ),
    });
  },

  importAudioFile: async () => {
    try {
      set({ importing: true, error: undefined });
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        set({ importing: false });
        return;
      }

      const asset = result.assets?.[0];
      if (!asset) {
        set({ importing: false, error: 'Aucun fichier audio sélectionné' });
        return;
      }

      const item = await buildImportedItem(asset);
      await upsertLibraryItems([item]);
      const library = await getAllLibraryItems();

      set({ library, importing: false });
    } catch (error) {
      set({
        importing: false,
        error: error instanceof Error ? error.message : 'Import audio impossible',
      });
    }
  },
}));

export function selectAvailableLibrary() {
  const { library, tracks, query } = useSamploopStore.getState();
  return getAvailableLibraryItems(library, tracks, query);
}

export type LibrarySourceKind = "seeded" | "user_import";

export type SamploopLibraryItem = {
  id: string;
  name: string;
  color: string;
  category: string;
  bpm: number;
  durationMs: number;
  localUri: string;
  sourceKind: LibrarySourceKind;
  isLoop: boolean;
  waveformPreview?: string | null;
  originalFileName?: string | null;
  createdAt: number;
};

export type TrackEffectsState = {
  reverb: number;
  delay: number;
  delayFeedback: number;
  distortion: number;
  chorus: number;
  compressor: number;
};

export type TrackState = {
  id: number;
  name: string;
  color: string;
  playing: boolean;
  loop: boolean;
  volume: number;
  bpm: number;
  sampleId?: string;
  localUri?: string;
  sourceBpm?: number;
  waveformPreview?: string | null;
  effects: TrackEffectsState;
};

export const trackColors = [
  "#fb7185",
  "#facc15",
  "#67e8f9",
  "#c084fc",
  "#2dd4bf",
  "#f97316",
  "#60a5fa",
  "#4ade80",
  "#f59e0b",
] as const;

export const defaultEffects: TrackEffectsState = {
  reverb: 0.18,
  delay: 0.12,
  delayFeedback: 0.24,
  distortion: 0,
  chorus: 0.08,
  compressor: 0.28,
};

export const idleWaveform = [0.2, 0.34, 0.46, 0.58, 0.38, 0.22, 0.3, 0.52, 0.66, 0.44, 0.26, 0.18];

export function createEmptyTrack(id: number, color: string): TrackState {
  return {
    id,
    name: `Empty Slot ${id}`,
    color,
    playing: false,
    loop: true,
    volume: 72,
    bpm: 100,
    effects: { ...defaultEffects },
  };
}

export function assignSampleToTrackState(track: TrackState, sample: SamploopLibraryItem): TrackState {
  return {
    ...track,
    name: sample.name,
    bpm: sample.bpm || track.bpm,
    sourceBpm: sample.bpm || undefined,
    sampleId: sample.id,
    localUri: sample.localUri,
    waveformPreview: sample.waveformPreview ?? null,
    loop: sample.isLoop,
    color: sample.color,
  };
}

export function releaseTrackSample(track: TrackState, fallbackColor: string): TrackState {
  return {
    ...createEmptyTrack(track.id, fallbackColor),
    volume: track.volume,
    bpm: 100,
    effects: { ...track.effects },
  };
}

export function getAssignedSampleIds(tracks: TrackState[]) {
  return new Set(tracks.map((track) => track.sampleId).filter(Boolean) as string[]);
}

export function sortLibraryItems(items: SamploopLibraryItem[]) {
  return [...items].sort((left, right) => {
    if (left.sourceKind !== right.sourceKind) {
      return left.sourceKind === "user_import" ? -1 : 1;
    }
    return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
  });
}

export function getAvailableLibraryItems(allSamples: SamploopLibraryItem[], tracks: TrackState[], query: string) {
  const assigned = getAssignedSampleIds(tracks);
  const normalizedQuery = query.trim().toLowerCase();

  return sortLibraryItems(allSamples)
    .filter((sample) => !assigned.has(sample.id))
    .filter((sample) => `${sample.name} ${sample.category}`.toLowerCase().includes(normalizedQuery));
}

export function clampBpm(bpm: number) {
  return Math.max(40, Math.min(240, Math.round(bpm)));
}

export function computePlaybackRate(trackBpm: number, sourceBpm?: number) {
  if (!sourceBpm || sourceBpm <= 0) return 1;
  return Math.max(0.5, Math.min(2.5, trackBpm / sourceBpm));
}

export function parseWaveformPreview(preview?: string | null) {
  if (!preview) return idleWaveform;

  try {
    const parsed = JSON.parse(preview) as number[];
    if (!Array.isArray(parsed) || parsed.length === 0) return idleWaveform;
    return parsed.map((value) => Math.max(0.08, Math.min(1, Number(value) || 0.08)));
  } catch {
    return idleWaveform;
  }
}

export function smoothWaveformValues(previous: number[] | undefined, next: number[]) {
  if (!previous || previous.length === 0) return next;

  return next.map((value, index) => {
    const prior = previous[index] ?? value;
    const eased = value >= prior ? value : prior * 0.78 + value * 0.22;
    return Math.max(0.08, Math.min(1, Number(eased.toFixed(3))));
  });
}

export function estimateWaveformPreviewFromSeed(seed: string, count = 24) {
  const base = Array.from(seed).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);
  return JSON.stringify(
    Array.from({ length: count }, (_, index) => {
      const raw = Math.abs(Math.sin((index + 1) * 0.61 + base * 0.013) * Math.cos(index * 0.37 + base * 0.007));
      return Number(Math.max(0.14, Math.min(0.96, raw)).toFixed(2));
    }),
  );
}

export function sanitizeHexColor(value: string, fallback: string) {
  const normalized = value.trim();
  const shortHexMatch = /^#([0-9a-fA-F]{3})$/.exec(normalized);
  if (shortHexMatch) {
    const expanded = shortHexMatch[1]
      .split("")
      .map((character) => `${character}${character}`)
      .join("")
      .toUpperCase();
    return `#${expanded}`;
  }

  const longHexMatch = /^#([0-9a-fA-F]{6})$/.exec(normalized);
  if (longHexMatch) {
    return `#${longHexMatch[1].toUpperCase()}`;
  }

  return fallback;
}

export function getReadableTextColor(hexColor: string) {
  const safeHex = sanitizeHexColor(hexColor, "#111111").slice(1);
  const red = Number.parseInt(safeHex.slice(0, 2), 16);
  const green = Number.parseInt(safeHex.slice(2, 4), 16);
  const blue = Number.parseInt(safeHex.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62 ? "#111111" : "#FFF7ED";
}

export function withAlpha(hexColor: string, alphaHex: string) {
  const safeHex = sanitizeHexColor(hexColor, "#111111");
  const safeAlpha = /^[0-9a-fA-F]{2}$/.test(alphaHex) ? alphaHex.toUpperCase() : "FF";
  return `${safeHex}${safeAlpha}`;
}

export function colorFromName(name: string) {
  const palette = ["#f59e0b", "#60a5fa", "#fb7185", "#67e8f9", "#4ade80", "#facc15", "#c084fc", "#2dd4bf"];
  const total = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length] ?? "#f59e0b";
}

export function formatDuration(durationMs: number | null | undefined) {
  if (!durationMs || Number.isNaN(durationMs)) return "0:00";
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

import { Asset } from 'expo-asset';
import { SamploopLibraryItem, colorFromName, estimateWaveformPreviewFromSeed } from './samploop-core';

const amberKickModule = require('../assets/samples/amber-kick-loop.wav');
const crystalHatModule = require('../assets/samples/crystal-hat-loop.wav');
const bluePadModule = require('../assets/samples/blue-grain-pad.wav');
const goldenBassModule = require('../assets/samples/golden-pulse-bass.wav');

type SeedDefinition = {
  id: string;
  name: string;
  category: string;
  bpm: number;
  durationMs: number;
  isLoop: boolean;
  moduleId: number;
};

const seededDefinitions: SeedDefinition[] = [
  {
    id: 'seed-amber-kick-loop',
    name: 'Amber Kick Loop',
    category: 'Drums',
    bpm: 120,
    durationMs: 700,
    isLoop: true,
    moduleId: amberKickModule,
  },
  {
    id: 'seed-crystal-hat-loop',
    name: 'Crystal Hat Loop',
    category: 'Perc',
    bpm: 132,
    durationMs: 350,
    isLoop: true,
    moduleId: crystalHatModule,
  },
  {
    id: 'seed-blue-grain-pad',
    name: 'Blue Grain Pad',
    category: 'Texture',
    bpm: 84,
    durationMs: 1800,
    isLoop: true,
    moduleId: bluePadModule,
  },
  {
    id: 'seed-golden-pulse-bass',
    name: 'Golden Pulse Bass',
    category: 'Bass',
    bpm: 102,
    durationMs: 1100,
    isLoop: true,
    moduleId: goldenBassModule,
  },
];

export async function getSeededLibraryItems(): Promise<SamploopLibraryItem[]> {
  const assets = await Asset.loadAsync(
    seededDefinitions.map((definition) => definition.moduleId),
  );

  return seededDefinitions.map((definition, index) => {
    const asset = assets[index];
    return {
      id: definition.id,
      name: definition.name,
      color: colorFromName(definition.name),
      category: definition.category,
      bpm: definition.bpm,
      durationMs: definition.durationMs,
      localUri: asset.localUri ?? asset.uri,
      sourceKind: 'seeded',
      isLoop: definition.isLoop,
      waveformPreview: estimateWaveformPreviewFromSeed(definition.name),
      originalFileName: `${definition.name}.wav`,
      createdAt: 1_710_000_000_000 + index,
    } satisfies SamploopLibraryItem;
  });
}

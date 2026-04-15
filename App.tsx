import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSamploopPlayers } from './src/hooks/useSamploopPlayers';
import {
  defaultEffects,
  formatDuration,
  getReadableTextColor,
  idleWaveform,
  parseWaveformPreview,
  trackColors,
  withAlpha,
} from './src/lib/samploop-core';
import { selectAvailableLibrary, useSamploopStore } from './src/store/useSamploopStore';

const colorChoices = [...trackColors];
const effectsCopy = [
  { key: 'reverb', label: 'Reverb', description: 'Espace et longueur de la salle.' },
  { key: 'delay', label: 'Delay', description: 'Répétitions synchronisées autour du sample.' },
  { key: 'delayFeedback', label: 'Feedback', description: 'Durée de vie des répétitions du delay.' },
  { key: 'distortion', label: 'Drive', description: 'Saturation plus ou moins rugueuse.' },
  { key: 'chorus', label: 'Chorus', description: 'Largeur et mouvement latéral.' },
  { key: 'compressor', label: 'Comp', description: 'Contrôle de dynamique et cohésion.' },
] as const;

function WaveformRow({ bars, color }: { bars: number[]; color: string }) {
  return (
    <View style={styles.waveformRow}>
      {bars.map((value, index) => (
        <View
          key={`${color}-${index}`}
          style={[
            styles.waveformBar,
            {
              height: Math.max(12, value * 56),
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function App() {
  const booting = useSamploopStore((state) => state.booting);
  const importing = useSamploopStore((state) => state.importing);
  const error = useSamploopStore((state) => state.error);
  const tracks = useSamploopStore((state) => state.tracks);
  const query = useSamploopStore((state) => state.query);
  const selectedTrackId = useSamploopStore((state) => state.selectedTrackId);
  const setQuery = useSamploopStore((state) => state.setQuery);
  const bootstrap = useSamploopStore((state) => state.bootstrap);
  const assignSampleToTrack = useSamploopStore((state) => state.assignSampleToTrack);
  const clearTrack = useSamploopStore((state) => state.clearTrack);
  const setSelectedTrack = useSamploopStore((state) => state.setSelectedTrack);
  const setTrackVolume = useSamploopStore((state) => state.setTrackVolume);
  const setTrackBpm = useSamploopStore((state) => state.setTrackBpm);
  const setTrackColor = useSamploopStore((state) => state.setTrackColor);
  const setTrackEffect = useSamploopStore((state) => state.setTrackEffect);
  const toggleTrackLoop = useSamploopStore((state) => state.toggleTrackLoop);
  const setTrackPlaying = useSamploopStore((state) => state.setTrackPlaying);
  const importAudioFile = useSamploopStore((state) => state.importAudioFile);

  const availableLibrary = useMemo(() => selectAvailableLibrary(), [tracks, query, booting, importing]);
  const activeTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0];
  const { waveforms } = useSamploopPlayers(tracks);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (booting) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={styles.loadingTitle}>Initialisation de Samploop</Text>
        <Text style={styles.loadingCopy}>Préparation de la bibliothèque locale, des sons embarqués et du moteur hors ligne.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Samploop</Text>
          <Text style={styles.heroTitle}>9 pistes locales, bibliothèque hors ligne et imports utilisateur prioritaires. conception & réalisation : lumomana & manus</Text>
          <Text style={styles.heroCopy}>
            quelques sons embarqués sont disponibles dès l’installation ; l'essentiel de la place est laissée pour importer vos sons, copiés & stockés localement sur l’appareil. Pour vider votre bibliothèque de sons : vider le cache de l'application.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.primaryButton} onPress={() => void importAudioFile()}>
              <Text style={styles.primaryButtonText}>{importing ? 'Import en cours…' : 'Importer un son'}</Text>
            </Pressable>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Pistes actives</Text>
              <Text style={styles.statValue}>{tracks.filter((track) => track.playing).length}/9</Text>
            </View>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Banque de sons</Text>
          <Text style={styles.sectionCopy}>Les imports utilisateur remontent en priorité dans la bibliothèque, qui est classée par ordre alphabétique. Je vous conseille de nommer vos sons dans un dossier dédié sur votre appareil, avant de les importer dans la bibliothèque.</Text>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un sample"
          placeholderTextColor="#7C7A87"
          style={styles.searchInput}
        />

        <FlatList
          data={availableLibrary}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.libraryList}
          renderItem={({ item }) => {
            const textColor = getReadableTextColor(item.color);
            return (
              <Pressable
                onPress={() => assignSampleToTrack(activeTrack.id, item.id)}
                style={[styles.libraryCard, { backgroundColor: withAlpha(item.color, '22'), borderColor: withAlpha(item.color, '66') }]}
              >
                <View style={[styles.librarySwatch, { backgroundColor: item.color }]} />
                <Text style={[styles.librarySource, { color: textColor, backgroundColor: item.color }]}>
                  {item.sourceKind === 'user_import' ? 'Import utilisateur' : 'Son embarqué'}
                </Text>
                <Text style={styles.libraryName}>{item.name}</Text>
                <Text style={styles.libraryMeta}>{item.category} · {item.bpm} BPM · {formatDuration(item.durationMs)}</Text>
                <WaveformRow bars={parseWaveformPreview(item.waveformPreview)} color={item.color} />
              </Pressable>
            );
          }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Console 9 pistes</Text>
          <Text style={styles.sectionCopy}>Touchez une piste pour cibler l’assignation, la couleur et les réglages de lecture.</Text>
        </View>

        <View style={styles.trackList}>
          {tracks.map((track) => {
            const isSelected = track.id === activeTrack.id;
            const waveform = waveforms[track.id] ?? parseWaveformPreview(track.waveformPreview) ?? idleWaveform;

            return (
              <Pressable
                key={track.id}
                onPress={() => setSelectedTrack(track.id)}
                style={[
                  styles.trackCard,
                  isSelected && styles.trackCardSelected,
                  { borderColor: withAlpha(track.color, isSelected ? 'EE' : '4A') },
                ]}
              >
                <View style={styles.trackHeaderRow}>
                  <View>
                    <Text style={styles.trackIndex}>Piste {String(track.id).padStart(2, '0')}</Text>
                    <Text style={styles.trackName}>{track.name}</Text>
                  </View>
                  <View style={[styles.loopChip, { borderColor: track.color }]}>
                    <Text style={[styles.loopChipText, { color: track.color }]}>{track.loop ? 'Loop' : 'One shot'}</Text>
                  </View>
                </View>

                <WaveformRow bars={waveform} color={track.color} />

                <View style={styles.trackButtonRow}>
                  <Pressable style={[styles.smallButton, { backgroundColor: track.playing ? track.color : '#1E1D2A' }]} onPress={() => setTrackPlaying(track.id, !track.playing)}>
                    <Text style={[styles.smallButtonText, track.playing && { color: getReadableTextColor(track.color) }]}>{track.playing ? 'Stop' : 'Play'}</Text>
                  </Pressable>
                  <Pressable style={styles.smallButton} onPress={() => toggleTrackLoop(track.id)}>
                    <Text style={styles.smallButtonText}>{track.loop ? 'Boucle on' : 'Boucle off'}</Text>
                  </Pressable>
                  <Pressable style={styles.smallButton} onPress={() => clearTrack(track.id)}>
                    <Text style={styles.smallButtonText}>Vider</Text>
                  </Pressable>
                </View>

                <View style={styles.adjustRow}>
                  <Text style={styles.adjustLabel}>Volume</Text>
                  <View style={styles.adjustButtons}>
                    <Pressable style={styles.adjustButton} onPress={() => setTrackVolume(track.id, track.volume - 5)}>
                      <Text style={styles.adjustButtonText}>−</Text>
                    </Pressable>
                    <Text style={styles.adjustValue}>{track.volume}%</Text>
                    <Pressable style={styles.adjustButton} onPress={() => setTrackVolume(track.id, track.volume + 5)}>
                      <Text style={styles.adjustButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.adjustRow}>
                  <Text style={styles.adjustLabel}>BPM</Text>
                  <View style={styles.adjustButtons}>
                    <Pressable style={styles.adjustButton} onPress={() => setTrackBpm(track.id, track.bpm - 2)}>
                      <Text style={styles.adjustButtonText}>−</Text>
                    </Pressable>
                    <Text style={styles.adjustValue}>{track.bpm}</Text>
                    <Pressable style={styles.adjustButton} onPress={() => setTrackBpm(track.id, track.bpm + 2)}>
                      <Text style={styles.adjustButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.colorRow}>
                  {colorChoices.map((color) => {
                    const selected = track.color.toUpperCase() === color.toUpperCase();
                    return (
                      <Pressable
                        key={`${track.id}-${color}`}
                        onPress={() => setTrackColor(track.id, color)}
                        style={[
                          styles.colorDot,
                          { backgroundColor: color, borderColor: selected ? '#FFF7ED' : '#13111C', transform: [{ scale: selected ? 1.04 : 1 }] },
                        ]}
                      />
                    );
                  })}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.effectsPanel}>
          <Text style={styles.eyebrow}>Track focus</Text>
          <Text style={styles.effectsTitle}>Effets studio — piste {activeTrack.id}</Text>
          <Text style={styles.effectsCopy}>
            {activeTrack.sampleId
              ? 'Ajustez la profondeur, l’espace et la dynamique de la piste sélectionnée sans quitter la console tactile.'
              : 'Chargez d’abord un son sur la piste sélectionnée pour façonner sa couleur sonore.'}
          </Text>

          <View style={styles.effectsGrid}>
            {effectsCopy.map((effect) => {
              const amount = activeTrack.effects[effect.key] ?? defaultEffects[effect.key];
              return (
                <View key={effect.key} style={styles.effectCard}>
                  <View style={styles.effectHeader}>
                    <Text style={styles.effectLabel}>{effect.label}</Text>
                    <Text style={styles.effectValue}>{Math.round(amount * 100)}%</Text>
                  </View>
                  <Text style={styles.effectDescription}>{effect.description}</Text>
                  <View style={styles.effectAdjustRow}>
                    <Pressable style={styles.adjustButton} onPress={() => setTrackEffect(activeTrack.id, effect.key, amount - 0.05)}>
                      <Text style={styles.adjustButtonText}>−</Text>
                    </Pressable>
                    <View style={styles.effectMeterTrack}>
                      <View style={[styles.effectMeterFill, { width: `${Math.max(6, amount * 100)}%`, backgroundColor: activeTrack.color }]} />
                    </View>
                    <Pressable style={styles.adjustButton} onPress={() => setTrackEffect(activeTrack.id, effect.key, amount + 0.05)}>
                      <Text style={styles.adjustButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0D0C12',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0D0C12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  loadingTitle: {
    color: '#FFF7ED',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingCopy: {
    color: '#C9C4D3',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: '#151321',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2C2840',
    gap: 10,
  },
  eyebrow: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  heroTitle: {
    color: '#FFF7ED',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  heroCopy: {
    color: '#C8C2D4',
    fontSize: 14,
    lineHeight: 21,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#1C1404',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  statChip: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1C1A29',
  },
  statLabel: {
    color: '#988FA7',
    fontSize: 11,
  },
  statValue: {
    color: '#FFF7ED',
    fontSize: 18,
    fontWeight: '800',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: '#FFF7ED',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionCopy: {
    color: '#A79EB6',
    fontSize: 13,
    lineHeight: 18,
  },
  searchInput: {
    backgroundColor: '#151321',
    borderWidth: 1,
    borderColor: '#2B2740',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF7ED',
    fontSize: 15,
  },
  libraryList: {
    gap: 12,
    paddingRight: 12,
  },
  libraryCard: {
    width: 244,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  librarySwatch: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  librarySource: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  libraryName: {
    color: '#FFF7ED',
    fontSize: 17,
    fontWeight: '700',
  },
  libraryMeta: {
    color: '#B6AFC6',
    fontSize: 12,
  },
  trackList: {
    gap: 14,
  },
  trackCard: {
    backgroundColor: '#151321',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  trackCardSelected: {
    shadowColor: '#F59E0B',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  trackHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  trackIndex: {
    color: '#9C90B1',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  trackName: {
    color: '#FFF7ED',
    fontSize: 18,
    fontWeight: '700',
  },
  loopChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  loopChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  waveformRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingVertical: 4,
  },
  waveformBar: {
    flex: 1,
    minWidth: 4,
    borderRadius: 999,
    shadowOpacity: 0.45,
    shadowRadius: 4,
  },
  trackButtonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#1E1D2A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#302C42',
  },
  smallButtonText: {
    color: '#FFF7ED',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  adjustLabel: {
    color: '#CFC7DA',
    fontSize: 14,
    fontWeight: '700',
  },
  adjustButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#262235',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    color: '#FFF7ED',
    fontSize: 18,
    fontWeight: '800',
  },
  adjustValue: {
    color: '#FFF7ED',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 56,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
  },
  effectsPanel: {
    backgroundColor: '#151321',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2C2840',
    padding: 18,
    gap: 12,
  },
  effectsTitle: {
    color: '#FFF7ED',
    fontSize: 22,
    fontWeight: '800',
  },
  effectsCopy: {
    color: '#BFB7CE',
    fontSize: 14,
    lineHeight: 20,
  },
  effectsGrid: {
    gap: 10,
  },
  effectCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2D2942',
    backgroundColor: '#1A1827',
    padding: 14,
    gap: 10,
  },
  effectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  effectLabel: {
    color: '#FFF7ED',
    fontSize: 16,
    fontWeight: '700',
  },
  effectValue: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '800',
  },
  effectDescription: {
    color: '#AAA1BC',
    fontSize: 13,
    lineHeight: 18,
  },
  effectAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  effectMeterTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#262235',
    overflow: 'hidden',
  },
  effectMeterFill: {
    height: '100%',
    borderRadius: 999,
  },
});

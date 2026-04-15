import { useEffect, useMemo, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { computePlaybackRate, parseWaveformPreview, smoothWaveformValues, TrackState } from '../lib/samploop-core';

type PlayerMap = Map<number, ReturnType<typeof createAudioPlayer>>;

export function useSamploopPlayers(tracks: TrackState[]) {
  const playersRef = useRef<PlayerMap>(new Map());
  const [waveforms, setWaveforms] = useState<Record<number, number[]>>({});

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      interruptionModeAndroid: 'mixWithOthers',
    });
  }, []);

  useEffect(() => {
    for (const track of tracks) {
      if (!track.localUri) continue;

      let player = playersRef.current.get(track.id);
      if (!player) {
        player = createAudioPlayer(track.localUri, { updateInterval: 120 });
        playersRef.current.set(track.id, player);
      }

      player.loop = track.loop;
      player.volume = Math.max(0, Math.min(1, track.volume / 100));
      player.setPlaybackRate(computePlaybackRate(track.bpm, track.sourceBpm), 'medium');

      const currentUri = (player as unknown as { src?: string; uri?: string }).src ?? (player as unknown as { uri?: string }).uri;
      if (currentUri !== track.localUri) {
        player.replace(track.localUri);
      }

      if (track.playing) {
        player.play();
      } else {
        player.pause();
        player.seekTo(0);
      }
    }

    for (const [trackId, player] of playersRef.current.entries()) {
      const stillExists = tracks.some((track) => track.id === trackId && track.localUri);
      if (!stillExists) {
        player.pause();
        player.release();
        playersRef.current.delete(trackId);
      }
    }
  }, [tracks]);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaveforms((previous) => {
        const nextEntries = tracks.map((track) => {
          const base = parseWaveformPreview(track.waveformPreview);
          if (!track.playing) {
            return [track.id, smoothWaveformValues(previous[track.id], base)] as const;
          }

          const animated = base.map((value, index) => {
            const pulse = Math.sin(Date.now() / 180 + track.id * 0.7 + index * 0.45) * 0.12;
            const swing = Math.cos(Date.now() / 260 + track.id * 0.31 + index * 0.18) * 0.08;
            return Math.max(0.1, Math.min(1, value + pulse + swing));
          });

          return [track.id, smoothWaveformValues(previous[track.id], animated)] as const;
        });

        return Object.fromEntries(nextEntries);
      });
    }, 120);

    return () => clearInterval(timer);
  }, [tracks]);

  useEffect(() => {
    return () => {
      for (const player of playersRef.current.values()) {
        player.pause();
        player.release();
      }
      playersRef.current.clear();
    };
  }, []);

  return useMemo(() => ({ waveforms }), [waveforms]);
}

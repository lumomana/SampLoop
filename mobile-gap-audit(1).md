# Audit de parité mobile Samploop

## État validé dans le code actuel

| Domaine | État observé | Preuves dans le code |
| --- | --- | --- |
| Bibliothèque locale | Les sons importés remontent avant les sons embarqués, puis le tri est alphabétique avec locale française. | `sortLibraryItems()` classe `user_import` avant `seeded`, puis trie sur `name` via `localeCompare("fr", { sensitivity: "base" })` dans `samploop-core.ts`. |
| Lecture hors ligne | Chaque piste lit un `localUri` local avec lecture, pause, loop, volume et variation de vitesse selon le BPM. | `useSamploopPlayers.ts` configure `player.loop`, `player.volume`, `player.setPlaybackRate(...)`, `player.play()` et `player.pause()`. |
| Console 9 pistes | L'interface mobile expose 9 pistes avec sélection, assignation, lecture, boucle, volume, BPM, vidage et couleur. | `App.tsx` rend `tracks.map(...)` avec les commandes `Play/Stop`, `Boucle`, `Vider`, volume, BPM et couleur. |
| Imports locaux | Le fichier audio est copié dans `samploop-audio/` via `FileSystem.copyAsync`, stocké en base et rechargé au bootstrap. | `buildImportedItem()` dans `useSamploopStore.ts` ; `upsertLibraryItems` + `getAllLibraryItems` assurent la persistance SQLite. |
| Test terrain Android confirmé | Import local fonctionnel sur appareil réel, avec persistance, bonne capacité de stockage et tri alphabétique validé. | Confirmé par le mainteneur — mai 2025. |
| Visualisation colorée | Une waveform colorée est affichée pour chaque piste. | `WaveformRow` dessine les barres avec `backgroundColor: color` et `shadowColor: color`. |
| Effets : état et UI | Les six paramètres d'effets (`reverb`, `delay`, `delayFeedback`, `distortion`, `chorus`, `compressor`) sont persistés par piste, avec valeurs par défaut non nulles et UI de réglage fonctionnelle. | `defaultEffects` dans `samploop-core.ts` ; `setTrackEffect` avec `clampUnit` dans `useSamploopStore.ts` ; panneau d'effets dans `App.tsx`. |
| Internationalisation | L'application est disponible en 5 langues. | Rapporté par le mainteneur — fichiers i18n non inclus dans cet audit. |
| Préservation des effets au vidage | Vider une piste réinitialise le sample et la couleur, mais conserve les réglages d'effets de la piste. | `releaseTrackSample()` dans `samploop-core.ts` : `effects: { ...track.effects }`. |

---

## Écarts encore identifiés

| Sujet | Constat | Impact produit |
| --- | --- | --- |
| Effets audio réels | `track.effects` n'est jamais lu dans `useSamploopPlayers.ts`. Les six paramètres sont bien stockés et modifiables en UI, mais aucune valeur n'est injectée dans le moteur de lecture. | Le panneau d'effets est visuellement complet mais ne transforme pas encore le son réellement. |
| Waveform audio-réactive | L'animation repose sur `Math.sin(Date.now() / 180 + ...)` et `Math.cos(...)` — simulation mathématique, pas analyse du signal audio réel. | L'identité visuelle est présente, mais la waveform ne reflète pas la matière sonore jouée. |
| Durée des imports utilisateur | `durationMs` est codé à `1000` dans `buildImportedItem()` pour tous les fichiers importés. | La durée affichée en bibliothèque est systématiquement `0:01` pour les sons importés, quelle que soit leur durée réelle. |
| Lecture en arrière-plan | `shouldPlayInBackground: false` est passé à `setAudioModeAsync`. | L'audio s'arrête si l'application passe en arrière-plan — comportement à documenter ou à faire évoluer selon le cas d'usage. |

---

## Conclusion opérationnelle

La version mobile couvre bien la structure d'usage principale de Samploop en local-first : import, persistance, lecture multi-pistes hors ligne et console 9 pistes sont tous validés sur appareil réel. La parité fonctionnelle complète reste conditionnée à deux points techniques : le câblage des effets dans le moteur audio, et la récupération de la durée réelle des fichiers importés. La waveform audio-réactive reste un écart d'ordre identitaire plutôt que fonctionnel.

---

## Faisabilité technique pour des effets réels

| Option | Ce qu'elle permet | Contraintes identifiées | Conséquence pour Samploop |
| --- | --- | --- | --- |
| `expo-audio` actuel | Lecture locale, loop, volume, vitesse de lecture et pilotage d'état. | Pas de nœuds d'effets temps réel documentés (reverb, delay, chorus, compression). | La pile actuelle suffit pour la lecture locale, mais pas pour une vraie chaîne d'effets studio. |
| `react-native-audio-api` | Nœuds audio temps réel, effets, routage modulaire et analyseur de signal. | Requiert un Expo development build — non disponible dans Expo Go. | Piste réaliste pour une parité musicale avec le web, mais implique un changement de stratégie de build et de test. |

En l'état, le portage mobile est fonctionnel comme lecteur multi-pistes local-first. Une parité musicale stricte avec effets audibles suppose soit une montée de stack vers une API audio bas niveau, soit une redéfinition explicite du périmètre mobile actuel.

---

*Dernière mise à jour : mai 2025 — basée sur `useSamploopPlayers.ts`, `App.tsx`, `samploop-core.ts`, `useSamploopStore.ts` et confirmation terrain mainteneur.*

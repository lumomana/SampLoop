# Audit de parité mobile Samploop

## État validé dans le code actuel

| Domaine | État observé | Preuves dans le code |
| --- | --- | --- |
| Bibliothèque locale | Les sons importés passent avant les sons embarqués, puis le tri est alphabétique. | `sortLibraryItems()` classe `user_import` avant `seeded`, puis trie sur `name` dans `samploop-core.ts`. |
| Lecture hors ligne | Chaque piste lit un `localUri` local avec lecture, pause, loop, volume et variation de vitesse selon le BPM. | `useSamploopPlayers.ts` configure `player.loop`, `player.volume`, `player.setPlaybackRate(...)`, `player.play()` et `player.pause()`. |
| Console 9 pistes | L’interface mobile expose 9 pistes avec sélection, assignation, lecture, boucle, volume, BPM, vidage et couleur. | `App.tsx` rend `tracks.map(...)` avec les commandes `Play/Stop`, `Boucle`, `Vider`, volume, BPM et couleur. |
| Imports locaux | Le projet mobile expose un bouton d’import et l’état applicatif possède une action `importAudioFile`. | `App.tsx` appelle `importAudioFile()` depuis l’action principale. |
| Visualisation colorée | Une waveform colorée est affichée pour chaque piste. | `WaveformRow` dessine les barres avec `backgroundColor: color`. |

## Écarts encore identifiés

| Sujet | Constat | Impact produit |
| --- | --- | --- |
| Effets audio réels | Les paramètres `reverb`, `delay`, `delayFeedback`, `distortion`, `chorus` et `compressor` existent dans l’état et l’interface, mais ne sont jamais injectés dans le moteur de lecture de `useSamploopPlayers.ts`. | Le panneau d’effets ressemble à la version web, mais ne transforme pas encore le son réellement. |
| Waveform réellement audio-réactive | L’animation de waveform repose sur une simulation sinus/cosinus sur base du `waveformPreview`, pas sur une analyse en temps réel du signal lu. | L’identité visuelle est présente, mais la visualisation n’est pas encore fidèle à la matière sonore jouée. |
| Validation Android sur appareil réel | Le flux critique d’import local hors ligne reste à confirmer sur téléphone réel. | La promesse Android local-first n’est pas encore clôturée tant que le test terrain n’est pas confirmé. |

## Conclusion opérationnelle

La version mobile actuelle couvre bien la structure d’usage principale de Samploop en local-first, mais la parité fonctionnelle ne peut pas encore être considérée comme complète tant que les effets ne modifient pas le rendu audio réel et que le test d’import Android hors ligne n’a pas été confirmé sur appareil.

## Faisabilité technique pour des effets réels

| Option | Ce qu’elle permet | Contraintes identifiées | Conséquence pour Samploop |
| --- | --- | --- | --- |
| `expo-audio` actuel | Lecture locale, loop, volume, vitesse de lecture et pilotage d’état. | La documentation consultée ne décrit pas de nœuds d’effets temps réel intégrés de type reverb, delay, chorus ou compression. | La pile actuelle suffit pour la lecture locale, mais pas pour une vraie chaîne d’effets studio. |
| `react-native-audio-api` | Nœuds audio temps réel, effets, routage modulaire et analyseur de signal. | Exige du code natif et n’est pas disponible dans Expo Go ; la documentation indique qu’un Expo development build est nécessaire. | C’est une piste réaliste pour rapprocher la version mobile de la richesse audio du web, mais cela change la stratégie de build et de test. |

En l’état, le portage mobile est fonctionnel comme lecteur multi-pistes local-first, mais une parité musicale stricte avec des effets réellement audibles suppose soit une montée de stack vers une API audio plus bas niveau, soit une redéfinition explicite du périmètre mobile actuel.

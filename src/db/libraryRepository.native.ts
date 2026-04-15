import * as SQLite from 'expo-sqlite';
import { SamploopLibraryItem } from '../lib/samploop-core';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('samploop-mobile.db');
  }
  return databasePromise;
}

export async function ensureLibrarySchema() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS library_sample (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      category TEXT NOT NULL,
      bpm INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      local_uri TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      is_loop INTEGER NOT NULL,
      waveform_preview TEXT,
      original_file_name TEXT,
      created_at INTEGER NOT NULL
    );
  `);
}

export async function upsertLibraryItems(items: SamploopLibraryItem[]) {
  if (items.length === 0) return;
  const db = await getDatabase();

  for (const item of items) {
    await db.runAsync(
      `INSERT OR REPLACE INTO library_sample (
        id, name, color, category, bpm, duration_ms, local_uri, source_kind, is_loop, waveform_preview, original_file_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.name,
      item.color,
      item.category,
      item.bpm,
      item.durationMs,
      item.localUri,
      item.sourceKind,
      item.isLoop ? 1 : 0,
      item.waveformPreview ?? null,
      item.originalFileName ?? null,
      item.createdAt,
    );
  }
}

export async function getAllLibraryItems(): Promise<SamploopLibraryItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    color: string;
    category: string;
    bpm: number;
    duration_ms: number;
    local_uri: string;
    source_kind: 'seeded' | 'user_import';
    is_loop: number;
    waveform_preview: string | null;
    original_file_name: string | null;
    created_at: number;
  }>('SELECT * FROM library_sample ORDER BY CASE WHEN source_kind = "user_import" THEN 0 ELSE 1 END, name ASC');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    category: row.category,
    bpm: row.bpm,
    durationMs: row.duration_ms,
    localUri: row.local_uri,
    sourceKind: row.source_kind,
    isLoop: Boolean(row.is_loop),
    waveformPreview: row.waveform_preview,
    originalFileName: row.original_file_name,
    createdAt: row.created_at,
  }));
}

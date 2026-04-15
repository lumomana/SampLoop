import { SamploopLibraryItem } from '../lib/samploop-core';

const WEB_STORAGE_KEY = 'samploop-mobile-library';

function readWebStorage(): SamploopLibraryItem[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(WEB_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SamploopLibraryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWebStorage(items: SamploopLibraryItem[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(items));
}

function sortLibrary(items: SamploopLibraryItem[]) {
  return [...items].sort((a, b) => {
    if (a.sourceKind !== b.sourceKind) {
      return a.sourceKind === 'user_import' ? -1 : 1;
    }

    return a.name.localeCompare(b.name, 'fr');
  });
}

export async function ensureLibrarySchema() {
  if (typeof localStorage !== 'undefined' && !localStorage.getItem(WEB_STORAGE_KEY)) {
    writeWebStorage([]);
  }
}

export async function upsertLibraryItems(items: SamploopLibraryItem[]) {
  if (items.length === 0) return;

  const existing = readWebStorage();
  const merged = new Map(existing.map((item) => [item.id, item]));
  for (const item of items) merged.set(item.id, item);
  writeWebStorage(sortLibrary([...merged.values()]));
}

export async function getAllLibraryItems(): Promise<SamploopLibraryItem[]> {
  return sortLibrary(readWebStorage());
}

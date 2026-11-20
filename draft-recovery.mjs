import { normalizeNote, MAX_NOTES, createNote } from './core.mjs';

export const DRAFT_PREFIX = 'notely.recovery.v1.';
const MAX_RECOVERY_DRAFTS = 30;

export function isDraftKey(key) { return typeof key === 'string' && key.startsWith(DRAFT_PREFIX); }
export function parseRecoveryDraft(key, value) {
  if (!isDraftKey(key) || !value || value.version !== 1 || !Number.isFinite(value.timestamp)) return null;
  const note = normalizeNote(value.note);
  return note ? { key, timestamp: value.timestamp, note } : null;
}
export function pendingRecovery(entries, notes) {
  const stored = new Map(notes.map(note => [note.id, note]));
  return Object.entries(entries).filter(([key]) => isDraftKey(key))
    .map(([key, value]) => parseRecoveryDraft(key, value)).filter(Boolean)
    .filter(draft => { const saved = stored.get(draft.note.id); return !saved || saved.title !== draft.note.title || saved.body !== draft.note.body; })
    .sort((a,b) => b.timestamp - a.timestamp).slice(0, MAX_RECOVERY_DRAFTS);
}
export function recoverAsCopy(notes, draft, id, now = Date.now()) {
  if (notes.length >= MAX_NOTES) throw new Error('Notebook is full. Export a backup before recovering.');
  if (notes.some(note => note.id === id)) throw new Error('Recovery ID already exists.');
  const recovered = { ...createNote(id, now), title:draft.note.title, body:draft.note.body,
    tags:[...draft.note.tags], favorite:draft.note.favorite, pinned:false };
  return [recovered, ...notes];
}
/** Repeated recovery attempts reuse the same copy after a failed write. */
export function recoverOrReuseCopy(notes, draft, id, now = Date.now()) {
  const existing = notes.find(note => note.id === id);
  if (existing) {
    // A retry may reuse the same recovery copy, but must not treat an unrelated
    // note with the same ID as successfully recovered.
    if (existing.title !== draft.note.title || existing.body !== draft.note.body ||
        existing.favorite !== draft.note.favorite ||
        JSON.stringify(existing.tags) !== JSON.stringify(draft.note.tags)) {
      throw new Error('Recovery ID belongs to a different note. No changes were made.');
    }
    return notes;
  }
  return recoverAsCopy(notes, draft, id, now);
}
/** Each open editor has a distinct key so independent windows cannot overwrite each other's drafts. */
export function createDraftJournal(storage, id) {
  const key = `${DRAFT_PREFIX}${id}`;
  let sequence = Promise.resolve();
  let generation = 0;
  const enqueue = action => { const next = sequence.catch(() => {}).then(action); sequence = next; return next; };
  return {
    key,
    record(note) {
      const version = ++generation;
      return enqueue(() => storage.set({[key]:{version:1,timestamp:Date.now(),note:structuredClone(note)}}))
        .then(() => version);
    },
    acknowledged() {
      const saved = generation;
      return enqueue(async () => {
        if (saved === generation) await storage.remove(key);
      });
    },
    idle() { return sequence; },
  };
}

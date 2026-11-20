import { validSourceUrl } from './source-url.mjs';
import { MAX_NOTES, MAX_TITLE_LENGTH, MAX_BODY_LENGTH, MAX_TAGS, MAX_TAG_LENGTH, isValidTimestamp } from './core.mjs';

export const BACKUP_FORMAT = 'notely-backup';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Validate without lossy normalization. Invalid archives must never modify user data. */
export function validateBackup(input) {
  if (!object(input) || input.format !== BACKUP_FORMAT || input.version !== BACKUP_VERSION || !Array.isArray(input.notes)) throw new Error('Unsupported Notely backup format or version.');
  if (input.notes.length > MAX_NOTES) throw new Error('Backup exceeds the 1,000-note limit.');
  const seen = new Set();
  const notes = input.notes.map((raw, index) => {
    const error = message => { throw new Error(`Note ${index + 1}: ${message}`); };
    if (!object(raw)) error('invalid note object.');
    if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 128) error('invalid ID.');
    if (seen.has(raw.id)) error('duplicate note ID.');
    seen.add(raw.id);
    if (typeof raw.title !== 'string' || raw.title.length > MAX_TITLE_LENGTH) error('invalid title.');
    if (typeof raw.body !== 'string' || raw.body.length > MAX_BODY_LENGTH) error('invalid content.');
    if (typeof raw.pinned !== 'boolean' || typeof raw.favorite !== 'boolean') error('invalid flags.');
    if (!Array.isArray(raw.tags) || raw.tags.length > MAX_TAGS) error('invalid tags.');
    const tags = new Set();
    for (const tag of raw.tags) {
      if (typeof tag !== 'string' || !tag.trim() || tag.trim() !== tag || tag.length > MAX_TAG_LENGTH || /\s{2}/u.test(tag) || tags.has(tag.toLocaleLowerCase())) error('invalid tag value.');
      tags.add(tag.toLocaleLowerCase());
    }
    if (!isValidTimestamp(raw.createdAt) || !isValidTimestamp(raw.updatedAt)) error('invalid timestamps.');
    if (raw.source !== undefined && (!object(raw.source) || typeof raw.source.title !== 'string' || raw.source.title.length > MAX_TITLE_LENGTH || typeof raw.source.url !== 'string' || raw.source.url.length > 4096 || !validSourceUrl(raw.source.url))) error('invalid source.');
    return { id: raw.id, title: raw.title, body: raw.body, pinned: raw.pinned, favorite: raw.favorite, tags: [...raw.tags], createdAt: raw.createdAt, updatedAt: raw.updatedAt, ...(raw.source ? {source:{title:raw.source.title,url:raw.source.url}} : {}) };
  });
  return notes;
}

export function createBackup(notes, exportedAt = new Date().toISOString()) {
  const archive = { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt, notes: structuredClone(notes) };
  validateBackup(archive);
  return archive;
}

export function parseBackup(json) {
  if (typeof json !== 'string' || new TextEncoder().encode(json).length > MAX_BACKUP_BYTES) throw new Error('Backup exceeds the 25 MB limit.');
  let parsed;
  try { parsed = JSON.parse(json); } catch { throw new Error('File is not valid JSON.'); }
  return validateBackup(parsed);
}

export function planImport(currentNotes, importedNotes, mode) {
  if (!['merge', 'replace'].includes(mode)) throw new Error('Invalid import mode.');
  const incoming = validateBackup({ format: BACKUP_FORMAT, version: BACKUP_VERSION, notes: importedNotes });
  if (mode === 'replace') return { notes: incoming, added: incoming.length, skipped: 0, conflicts: 0, replaced: currentNotes.length };
  const existing = new Map(currentNotes.map(n => [n.id, n]));
  const added = incoming.filter(note => !existing.has(note.id));
  const duplicates = incoming.filter(note => existing.has(note.id));
  const conflicts = duplicates.filter(note => !sameNote(existing.get(note.id), note)).length;
  if (currentNotes.length + added.length > MAX_NOTES) throw new Error('Import would exceed the 1,000-note limit.');
  return { notes: [...currentNotes, ...added], added: added.length, skipped: duplicates.length, conflicts, replaced: 0 };
}
function sameNote(a, b) {
  return a.id === b.id && a.title === b.title && a.body === b.body && a.pinned === b.pinned && a.favorite === b.favorite && a.createdAt === b.createdAt && a.updatedAt === b.updatedAt && a.tags.length === b.tags.length && a.tags.every((tag, i) => tag === b.tags[i]) && JSON.stringify(a.source || null) === JSON.stringify(b.source || null);
}

export function exportNote(note, extension) {
  if (!['txt', 'md'].includes(extension)) throw new Error('Unsupported export type.');
  const safe = (note.title.trim() || 'Untitled note').replace(/[\\/:*?"<>|\x00-\x1f]/g, '-').replace(/\.+$/g, '').slice(0, 80) || 'Untitled note';
  return { filename: `${safe}.${extension}`, content: note.body, mime: 'text/plain;charset=utf-8' };
}

/** Persist the planned snapshot before allowing the popup to adopt it. */
export async function persistImport(queue, currentNotes, importedNotes, mode) {
  await queue.whenIdle();
  if (queue.getState().failed) throw new Error('Save current changes first using Retry.');
  const plan = planImport(currentNotes, importedNotes, mode);
  if (mode === 'merge' && plan.added === 0) return plan;
  queue.enqueue(plan.notes);
  await queue.whenIdle();
  if (queue.getState().failed) {
    // Ensure an explicit Retry can never accidentally apply the failed import.
    queue.enqueue(currentNotes);
    await queue.whenIdle();
    throw new Error('Import failed to save. Previous notes were retained; check storage status.');
  }
  return plan;
}

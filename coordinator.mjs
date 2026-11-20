import { validSourceUrl } from './source-url.mjs';
import { STORAGE_KEY, MAX_NOTES, MAX_BODY_LENGTH, MAX_TITLE_LENGTH, createNote, normalizeNotes } from './core.mjs';
import { planImport, validateBackup, BACKUP_FORMAT, BACKUP_VERSION } from './backup.mjs';

export const CAPTURE_SOURCE_KEY = 'notely.captureSource.v1';
export const CAPTURE_MENU_ID = 'notely-save-selection';
const copy = value => structuredClone(value);
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const indexById = notes => new Map(notes.map(n => [n.id,n]));

/** Apply only changes relative to the popup's last acknowledged snapshot. Never replace unrelated captures. */
export function mergeEdits(current, base, desired) {
  const prior = indexById(normalizeNotes(base));
  const requested = indexById(normalizeNotes(desired));
  const live = indexById(normalizeNotes(current));
  for (const [id, old] of prior) {
    const next = requested.get(id);
    if (next && same(old,next)) continue;
    if (!live.has(id) || !same(live.get(id),old)) throw new Error('This note changed in another window. Reload Notely before saving.');
    if (!next) live.delete(id);
    else live.set(id,copy(next));
  }
  for (const [id,next] of requested) {
    if (prior.has(id)) continue;
    if (live.has(id)) throw new Error('Note ID conflict. Reload Notely.');
    live.set(id,copy(next));
  }
  if (live.size > MAX_NOTES) throw new Error('The notebook has reached its 1,000-note limit.');
  return [...live.values()];
}

export function captureNote(selection, {title = '',url = '',includeSource = true,id,now = Date.now()} = {}) {
  if (typeof selection !== 'string' || !selection.trim()) throw new Error('Select some text before capturing.');
  if (selection.length > MAX_BODY_LENGTH) throw new Error('Selection exceeds the 100,000-character limit.');
  const note=createNote(id || crypto.randomUUID(),now);
  note.title=typeof title==='string'?title.slice(0,MAX_TITLE_LENGTH):'';
  note.body=selection;
  const sourceUrl = safeSourceUrl(url);
  if (includeSource && sourceUrl) note.source={title:note.title,url:sourceUrl};
  return note;
}

export function safeSourceUrl(url) { return validSourceUrl(url) ? url : ''; }

/** Validate persisted notes without silently dropping or truncating user records. */
export function validateStoredNotes(stored) {
  if (stored === undefined) return [];
  if (!Array.isArray(stored)) throw new Error('Stored notes are not an array. Export or repair your data before editing.');
  if (stored.length > MAX_NOTES) throw new Error('Stored notes exceed the 1,000-note limit. Editing is disabled to protect your data.');
  if (stored.some(item => item && typeof item === 'object' &&
      (typeof item.id === 'string' && item.id.length > 128 ||
       typeof item.title === 'string' && item.title.length > MAX_TITLE_LENGTH ||
       typeof item.body === 'string' && item.body.length > MAX_BODY_LENGTH))) {
    throw new Error('Stored notes exceed supported field limits. Editing is disabled to protect your data.');
  }
  const normalized = normalizeNotes(stored);
  if (normalized.length !== stored.length) throw new Error('Stored notes contain invalid or duplicate IDs. Editing is disabled to protect your data.');
  return normalized;
}

/** External additions must not reset the cursor in an unchanged active note. */
export function activeNoteChanged(before, after, activeId) {
  if (!activeId) return true;
  const oldNote = before.find(note => note.id === activeId);
  const newNote = after.find(note => note.id === activeId);
  return JSON.stringify(oldNote ?? null) !== JSON.stringify(newNote ?? null);
}

/** One writer owns the legacy array. All mutations are queued, including captures and imports. */
export function createCoordinator(read, write) {
  let sequence=Promise.resolve();
  const serialize=fn=>{
    const result=sequence.then(fn);
    sequence=result.catch(()=>{});
    return result;
  };
  const load=async()=>validateStoredNotes(await read());
  const persist=async notes=>{await write(copy(notes));return copy(notes)};
  return {
    read:()=>serialize(load),
    edit:(base,desired)=>serialize(async()=>persist(mergeEdits(await load(),base,desired))),
    capture:(selection,metadata)=>serialize(async()=>{
      const existing=await load();
      if(existing.length>=MAX_NOTES) throw new Error('Notebook is full.');
      const note=captureNote(selection,metadata);
      if(existing.some(n=>n.id===note.id)) throw new Error('Duplicate note ID.');
      const notes=[note,...existing];await persist(notes);return note;
    }),
    quick:()=>serialize(async()=>{
      const existing=await load();
      if(existing.length>=MAX_NOTES) throw new Error('Notebook is full.');
      const note=createNote(crypto.randomUUID());
      await persist([note,...existing]);return note;
    }),
    import:(incoming,mode,expected)=>serialize(async()=>{
      const current=await load();
      // Replace must not silently erase a capture or other edit made after the preview.
      if(mode==='replace' && !same(current,normalizeNotes(expected))) throw new Error('Notes changed since preview. Reload and confirm again.');
      const valid=validateBackup({format:BACKUP_FORMAT,version:BACKUP_VERSION,notes:incoming});
      const plan=planImport(current,valid,mode);
      if(mode==='replace' || plan.added) await persist(plan.notes);
      return {...plan,notes:copy(plan.notes)};
    })
  };
}

export function chromeCoordinator(storage) {
  return createCoordinator(
    async()=> (await storage.get(STORAGE_KEY))[STORAGE_KEY],
    async notes=>storage.set({[STORAGE_KEY]:notes})
  );
}

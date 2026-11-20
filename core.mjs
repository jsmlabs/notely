import { validSourceUrl } from './source-url.mjs';
export const STORAGE_KEY = 'notely.notes.v1';
export const THEME_KEY = 'notely.theme.v1';
export const MAX_NOTES = 1000;
export const MAX_TITLE_LENGTH = 120;
export const MAX_BODY_LENGTH = 100000;
export const MAX_TAGS = 12;
export const MAX_TAG_LENGTH = 32;
export const SORT_MODES = ['updated', 'created', 'alpha'];
export const SEARCH_FIELDS = ['all', 'title', 'body', 'tags'];
const VALID_DATE_MAX = 8640000000000000;
export const isValidTimestamp = value => Number.isSafeInteger(value) && value >= 0 && value <= VALID_DATE_MAX;

export function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

export function normalizeTags(raw) {
  if (!Array.isArray(raw)) return [];
  const tags = [];
  const seen = new Set();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const tag = item.trim().replace(/\s+/gu, ' ').slice(0, MAX_TAG_LENGTH).trim();
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === MAX_TAGS) break;
  }
  return tags;
}

export function normalizeNote(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id) return null;
  return {
    id: raw.id.slice(0, 128),
    title: cleanText(raw.title, MAX_TITLE_LENGTH),
    body: cleanText(raw.body, MAX_BODY_LENGTH),
    pinned: raw.pinned === true,
    favorite: raw.favorite === true,
    tags: normalizeTags(raw.tags),
    ...(raw.source && typeof raw.source === 'object' && validSourceUrl(raw.source.url) ? {source:{title:cleanText(raw.source.title,MAX_TITLE_LENGTH),url:raw.source.url.slice(0,4096)}} : {}),
    createdAt: isValidTimestamp(raw.createdAt) ? raw.createdAt : Date.now(),
    updatedAt: isValidTimestamp(raw.updatedAt) ? raw.updatedAt : Date.now(),
  };
}

export function normalizeNotes(raw) {
  if (!Array.isArray(raw)) return [];
  const used = new Set();
  const result = [];
  for (const item of raw) {
    const note = normalizeNote(item);
    if (!note || used.has(note.id)) continue;
    used.add(note.id);
    result.push(note);
    if (result.length >= MAX_NOTES) break;
  }
  return result;
}

export function createNote(id, now = Date.now()) {
  if (typeof id !== 'string' || !id) throw new TypeError('A note ID is required');
  return { id, title: '', body: '', pinned: false, favorite: false, tags: [], createdAt: now, updatedAt: now };
}

export function updateNote(notes, id, patch, now = Date.now()) {
  return notes.map(note => {
    if (note.id !== id) return note;
    const next = { ...note };
    if (Object.hasOwn(patch, 'title')) next.title = cleanText(patch.title, MAX_TITLE_LENGTH);
    if (Object.hasOwn(patch, 'body')) next.body = cleanText(patch.body, MAX_BODY_LENGTH);
    if (Object.hasOwn(patch, 'pinned')) next.pinned = patch.pinned === true;
    if (Object.hasOwn(patch, 'favorite')) next.favorite = patch.favorite === true;
    if (Object.hasOwn(patch, 'tags')) next.tags = normalizeTags(patch.tags);
    if (next.title === note.title && next.body === note.body && next.pinned === note.pinned &&
        next.favorite === note.favorite && next.tags.length === note.tags.length && next.tags.every((tag, i) => tag === note.tags[i])) return note;
    next.updatedAt = now;
    return next;
  });
}

/** Backwards-compatible query string, or filters object. Pinned notes lead in every sort mode. */
export function sortAndFilter(notes, filters = '') {
  const opts = typeof filters === 'string' ? { query: filters } : (filters || {});
  const q = String(opts.query || '').trim().toLocaleLowerCase();
  const field = SEARCH_FIELDS.includes(opts.field) ? opts.field : 'all';
  const sort = SORT_MODES.includes(opts.sort) ? opts.sort : 'updated';
  const tag = typeof opts.tag === 'string' ? opts.tag.toLocaleLowerCase() : '';
  const matched = notes.filter(note => {
    if (opts.favoritesOnly && !note.favorite) return false;
    if (tag && !note.tags.some(t => t.toLocaleLowerCase() === tag)) return false;
    if (!q) return true;
    const terms = {
      title: note.title,
      body: note.body,
      tags: note.tags.join(' '),
    };
    return (field === 'all' ? Object.values(terms).join('\n') : terms[field]).toLocaleLowerCase().includes(q);
  });
  return matched.sort((a,b) => Number(b.pinned) - Number(a.pinned) ||
    (sort === 'alpha' ? displayTitle(a).localeCompare(displayTitle(b), undefined, {sensitivity:'base'}) :
     sort === 'created' ? b.createdAt - a.createdAt : b.updatedAt - a.updatedAt) || a.id.localeCompare(b.id));
}

export function allTags(notes) {
  const tags = new Map();
  for (const note of notes) for (const tag of note.tags) {
    const key = tag.toLocaleLowerCase();
    if (!tags.has(key)) tags.set(key, tag);
  }
  return [...tags.values()].sort((a,b) => a.localeCompare(b, undefined, {sensitivity:'base'}));
}

export function displayTitle(note) {
  return note.title.trim() || note.body.trim().split('\n')[0].slice(0, 60) || 'Untitled note';
}

// List cards display a short excerpt: never normalize the entire (up to 100k) note.
export function preview(note) {
  const body = note.body.trimStart();
  const excerpt = body.slice(0, 240).replace(/\s+/gu, ' ').trim();
  if (!excerpt) return 'No additional text';
  return excerpt.length > 180 ? `${excerpt.slice(0, 179).trimEnd()}…` : excerpt;
}

export function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

import { createDraftJournal, pendingRecovery, recoverOrReuseCopy } from './draft-recovery.mjs';
import { openNotelySidePanel } from './sidepanel.mjs';
import { STORAGE_KEY, THEME_KEY, MAX_NOTES, createNote, normalizeNotes, sortAndFilter, allTags, normalizeTags, MAX_TAGS, updateNote, displayTitle, preview, wordCount } from './core.mjs';
import { createStorageQueue } from './storage-queue.mjs';
import { renderMarkdown, toggleTask } from './markdown.mjs';
import { formatSelection } from './editor-format.mjs';
import { createBackup, parseBackup, planImport, exportNote, MAX_BACKUP_BYTES } from './backup.mjs';
import { CAPTURE_SOURCE_KEY, mergeEdits, validateStoredNotes, activeNoteChanged } from './coordinator.mjs';
import { nextFocusIndex } from './navigation.mjs';
import { captureNoteListFocus, restoreNoteListFocus } from './note-list-focus.mjs';
import { createImportSelection } from './import-selection.mjs';
import { captureImportBaseline, importPreviewIsCurrent } from './import-preview-guard.mjs';

const isWorkspace = new URLSearchParams(location.search).get('workspace') === '1';
if (isWorkspace) document.body.classList.add('workspace');
const $ = id => document.getElementById(id);
const elements = Object.fromEntries(['app','new-note','empty-create','search','note-list','notes-count','filtered-count','editor','editor-empty','title-input','body-input','note-date','word-count','save-status','pin-button','delete-button','back-button','theme-button','confirm-dialog','notice','notice-message','undo-button','retry-button','list-save-status','list-retry-button','search-field','sort-mode','tag-filter','favorites-filter','favorite-button','tag-input','tag-chips','markdown-preview','preview-toggle','backup-open','backup-close','backup-dialog','support-open','support-close','support-dialog','support-address','support-copy','support-copy-result','support-done','backup-download','import-file','import-summary','import-mode','replace-confirm-row','replace-confirm','import-apply','import-result','export-txt','export-md','quick-note','capture-source','source-info','workspace-open','sidepanel-open','clear-filters','focus-toggle','sidebar-resize','recovery-banner','recovery-description','recovery-restore','recovery-discard'].map(id => [id, $(id)]));
let notes = [];
let activeId = null;
let selectedView = 'list';
let noticeTimer = null;
let undoNote = null;
let deletingId = null;
let favoritesOnly = false;
let previewActive = false;
let importedNotes = null;
let importPreviewBase = null;
let importing = false;
const importSelection = createImportSelection(parseBackup);
let baseline = [];
const draftJournal = createDraftJournal(chrome.storage.local, crypto.randomUUID());
let recoveryCandidates = [];
let recoveryAttempt = null;
let recoveryInProgress = false;
let focusMode = false;
let focusBeforeMode = null;
const isWideWorkspace = () => isWorkspace && matchMedia('(min-width: 701px)').matches;
function setFocusMode(enabled) {
  if (enabled && (!isWorkspace || !activeId)) return;
  const next = Boolean(enabled && isWorkspace);
  if (next === focusMode) return;
  if (next) focusBeforeMode = document.activeElement;
  focusMode = next;
  document.body.classList.toggle('focus-mode', focusMode);
  elements['focus-toggle'].setAttribute('aria-pressed', String(focusMode));
  elements['focus-toggle'].textContent = focusMode ? 'Exit focus' : 'Focus';
  if (focusMode) {
    switchView('editor');
    elements['body-input'].focus();
  } else if (focusBeforeMode?.isConnected && !focusBeforeMode.closest('.sidebar')?.matches('[hidden]')) {
    focusBeforeMode.focus();
    focusBeforeMode = null;
  } else {
    elements['focus-toggle'].focus();
    focusBeforeMode = null;
  }
}
function setSidebarWidth(value) {
  const workspaceLimit = isWideWorkspace() ? Math.max(260, window.innerWidth - 320) : 520;
  const width = Math.max(260, Math.min(520, workspaceLimit, Number(value) || 340));
  document.body.style.setProperty('--sidebar-width', `${width}px`);
  elements['sidebar-resize'].setAttribute('aria-valuenow', String(width));
  elements['sidebar-resize'].setAttribute('aria-valuemax', String(Math.max(260, Math.min(520, workspaceLimit))));
  return width;
}
async function refreshRecovery() {
  const entries = await chrome.storage.local.get(null);
  recoveryCandidates = pendingRecovery(entries, notes).filter(d => d.key !== draftJournal.key);
  const candidate = recoveryCandidates[0];
  elements['recovery-banner'].hidden = !candidate;
  if (candidate) elements['recovery-description'].textContent = `${recoveryCandidates.length} recoverable draft(s). Latest: ${candidate.note.title || 'Untitled note'}. Restore creates a new note.`;
}
async function discardRecovery() {
  if (importing || recoveryInProgress) return;
  const candidate = recoveryCandidates[0]; if (!candidate) return;
  try { await chrome.storage.local.remove(candidate.key); await refreshRecovery(); }
  catch { showNotice('Could not discard the draft. Try again.'); }
}
async function restoreRecovery() {
  const candidate = recoveryCandidates[0];
  if (importing || !candidate || recoveryInProgress) return;
  recoveryInProgress = true;
  elements['recovery-restore'].disabled = true;
  elements['recovery-discard'].disabled = true;
  elements['import-apply'].disabled = true;
  try {
    if (!recoveryAttempt || recoveryAttempt.key !== candidate.key) {
      recoveryAttempt = {key:candidate.key, id:crypto.randomUUID()};
    }
    notes = recoverOrReuseCopy(notes, candidate, recoveryAttempt.id);
    storageQueue.enqueue(notes);
    openNote(recoveryAttempt.id, true);
    // Keep the source on failure. Retrying reuses the same new note.
    await storageQueue.whenIdle();
    if (storageQueue.getState().failed) throw new Error('Save did not complete. Use Retry or restore again.');
    await chrome.storage.local.remove(candidate.key);
    recoveryAttempt = null;
    await refreshRecovery();
    showNotice('Recovered as a separate note.');
  } catch (error) { showNotice(`Recovery could not finish: ${error.message}`); }
  finally {
    recoveryInProgress = false;
    elements['recovery-restore'].disabled = false;
    elements['recovery-discard'].disabled = false;
    refreshImportPreview();
  }
}
async function request(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({type,...payload});
  if (!response?.ok) throw new Error(response?.error || 'Service worker unavailable.');
  return response.data;
}
function absorbRemote(remote,snapshot) {
  // Preserve unsaved local edits while adding captures that arrived from the worker.
  try { notes = mergeEdits(remote,snapshot,notes); }
  catch { /* conflict is surfaced by the next authoritative write; retain local edits */ }
  renderList();
}
const storageQueue = createStorageQueue(
  async snapshot => {
    const remote=await request('NOTES_EDIT',{base:baseline,notes:snapshot});
    baseline=structuredClone(remote);
    absorbRemote(remote,snapshot);
  },
  state => {
    setSaveStatus(state === 'saving' ? 'Saving...' : state === 'saved' ? 'Saved' : 'Not saved - retry', state);
    if (state === 'saved') void draftJournal.acknowledged().catch(() => showNotice('Draft cleanup failed. Your saved note remains available.'));
    if (state === 'error') showNotice('Saving failed. A recovery draft may be available when you reopen Notely. Retry saving.');
  }
);

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : new Intl.DateTimeFormat('en', {month:'long', day:'numeric', year:'numeric'}).format(date);
}
function relativeDate(timestamp) {
  const delta = Date.now() - timestamp;
  if (delta >= 0 && delta < 86400000) return 'Today';
  if (delta >= 0 && delta < 172800000) return 'Yesterday';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : new Intl.DateTimeFormat('en', {month:'short', day:'numeric'}).format(date);
}
function showNotice(message, { undo = false } = {}) {
  elements['notice-message'].textContent = message;
  elements.notice.hidden = false;
  elements['undo-button'].hidden = !undo;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    elements.notice.hidden = true;
    undoNote = null;
  }, undo ? 9000 : 6000);
}
function setSaveStatus(message, state = 'saved') {
  for (const id of ['save-status','list-save-status']) {
    const el = elements[id];
    el.dataset.state = state;
    el.querySelector('span').textContent = message;
  }
  for (const id of ['retry-button','list-retry-button']) elements[id].hidden = state !== 'error';
}
function scheduleSave() { if (!importing) storageQueue.enqueue(notes); }
// The import request is asynchronous. Keep the local editor immutable until its
// authoritative result arrives, so it cannot replace unsaved in-flight edits.
function lockEditingForImport(locked) {
  const ids=['title-input','body-input','tag-input','new-note','quick-note','empty-create',
    'pin-button','favorite-button','delete-button','undo-button',
    'recovery-restore','recovery-discard'];
  for (const id of ids) {
    const el=elements[id];
    if (locked) {
      el.dataset.importWasDisabled=String(el.disabled);
      el.disabled=true;
    } else {
      el.disabled=el.dataset.importWasDisabled === 'true';
      delete el.dataset.importWasDisabled;
    }
  }
}
function retrySave() { if (storageQueue.getState().failed) storageQueue.retry(); }
function restoreDeleted() {
  if (importing || !undoNote) return;
  const { note, index } = undoNote;
  undoNote = null;
  if (notes.length >= MAX_NOTES || notes.some(n => n.id === note.id)) return;
  notes.splice(Math.min(index, notes.length), 0, note);
  scheduleSave();
  openNote(note.id, true);
  elements.notice.hidden = true;
  showNotice('Note restored.');
}
function deleteActive() {
  if (importing || !deletingId) return;
  const index = notes.findIndex(note => note.id === deletingId);
  deletingId = null;
  if (index < 0) return;
  undoNote = { note: structuredClone(notes[index]), index };
  notes.splice(index, 1);
  activeId = null;
  switchView('list'); renderList(); renderEditor(); scheduleSave();
  elements['new-note'].focus();
  showNotice('Note deleted.', { undo: true });
}
function renderList({resetScroll = false} = {}) {
  const tagSelect = elements['tag-filter'];
  const previousTag = tagSelect.value;
  const available = allTags(notes);
  tagSelect.replaceChildren(new Option('All tags', ''));
  for (const tag of available) tagSelect.add(new Option(tag, tag.toLocaleLowerCase()));
  tagSelect.value = available.some(t => t.toLocaleLowerCase() === previousTag) ? previousTag : '';
  const selectedTag = tagSelect.value;
  const list = sortAndFilter(notes, {
    query: elements.search.value,
    field: elements['search-field'].value,
    sort: elements['sort-mode'].value,
    tag: selectedTag,
    favoritesOnly,
  });
  elements['notes-count'].textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
  const filtered = Boolean(elements.search.value.trim() || selectedTag || favoritesOnly || elements['search-field'].value !== 'all' || elements['sort-mode'].value !== 'updated');
  elements['filtered-count'].textContent = filtered ? `(${list.length})` : '';
  elements['clear-filters'].hidden = !filtered;
  const container = elements['note-list'];
  const previousScroll = container.scrollTop;
  const keyboardLocation = captureNoteListFocus(container, document.activeElement);
  container.replaceChildren();
  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'list-empty';
    empty.textContent = notes.length ? 'No matching notes. Try adjusting your filters.' : 'Nothing here yet. Create a note to get started.';
    container.append(empty);
  }
  const fragment = document.createDocumentFragment();
  for (const note of list) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `note-card${note.id === activeId ? ' active' : ''}`;
    button.dataset.noteId = note.id; button.setAttribute('aria-label', `Open ${displayTitle(note)}`);
    if (note.id === activeId) button.setAttribute('aria-current', 'true');
    const top = document.createElement('div'); top.className = 'note-card-top';
    const title = document.createElement('span'); title.className = 'note-card-title'; title.textContent = displayTitle(note);
    top.append(title);
    if (note.pinned) {const pin=document.createElementNS('http://www.w3.org/2000/svg','svg');pin.classList.add('note-card-pin');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-pin');pin.append(use);top.append(pin)}
    if (note.favorite) {const star=document.createElementNS('http://www.w3.org/2000/svg','svg');star.classList.add('note-card-favorite');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-star');star.append(use);top.append(star)}
    const desc = document.createElement('div');desc.className='note-card-preview';desc.textContent=preview(note);
    const meta = document.createElement('div');meta.className='note-card-meta';meta.textContent=relativeDate(note.updatedAt);
    button.append(top,desc,meta);
    if (note.tags.length) {
      const badges = document.createElement('div'); badges.className='card-tags';
      for (const tag of note.tags.slice(0,3)) { const chip=document.createElement('span');chip.textContent=tag;badges.append(chip); }
      if (note.tags.length>3) {const more=document.createElement('span');more.textContent=`+${note.tags.length-3}`;badges.append(more);}
      button.append(badges);
    }
    button.addEventListener('click', () => openNote(note.id));
    fragment.append(button);
  }
  container.append(fragment);
  container.scrollTop = resetScroll ? 0 : previousScroll;
  restoreNoteListFocus(container, keyboardLocation);
  if (importedNotes) refreshImportPreview();
}
function clearFilters() {
  elements.search.value = '';
  elements['search-field'].value = 'all';
  elements['sort-mode'].value = 'updated';
  elements['tag-filter'].value = '';
  favoritesOnly = false;
  elements['favorites-filter'].setAttribute('aria-pressed','false');
  renderList();
  elements.search.focus();
}
function moveNoteFocus(event) {
  if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  const buttons = [...elements['note-list'].querySelectorAll('.note-card')];
  const index = buttons.indexOf(document.activeElement);
  if (index < 0) return;
  const next = nextFocusIndex(event.key,index,buttons.length);
  if (next < 0) return;
  event.preventDefault();
  buttons[next].focus();
}
function updateWordCount(body) {
  const count = wordCount(body);
  elements['word-count'].textContent = `${count} ${count === 1 ? 'word' : 'words'}`;
}
function renderEditor({focus = false} = {}) {
  const note = notes.find(item => item.id === activeId);
  elements.editor.hidden = !note;
  elements['editor-empty'].hidden = Boolean(note);
  elements['focus-toggle'].disabled = !note;
  if (!note) {
    const empty = elements['editor-empty'];
    const hasNotes = notes.length > 0;
    empty.querySelector('h1').textContent = hasNotes ? 'Select a note to begin.' : 'Room for your thoughts.';
    empty.querySelector('p').textContent = hasNotes
      ? 'Choose a note from the sidebar, or create a new one.'
      : 'A simple place to capture ideas, plans, and everything in between.';
    elements['empty-create'].lastChild.textContent = hasNotes ? ' Create a note' : ' Create your first note';
    return;
  }
  elements['title-input'].value = note.title;
  elements['body-input'].value = note.body;
  if (previewActive) refreshPreview();
  elements['note-date'].textContent = `UPDATED ${formatDate(note.updatedAt)}`;
  elements['pin-button'].setAttribute('aria-pressed', String(note.pinned));
  elements['pin-button'].setAttribute('aria-label', note.pinned ? 'Unpin note' : 'Pin note');
  elements['pin-button'].title = note.pinned ? 'Unpin note' : 'Pin note';
  elements['favorite-button'].setAttribute('aria-pressed', String(note.favorite));
  elements['favorite-button'].setAttribute('aria-label', note.favorite ? 'Remove from favorites' : 'Add to favorites');
  elements['favorite-button'].title = note.favorite ? 'Remove from favorites' : 'Add to favorites';
  renderTags(note);
  elements['source-info'].hidden = !note.source;
  elements['source-info'].textContent = note.source ? `Source: ${note.source.title || note.source.url} (${note.source.url})` : '';
  updateWordCount(note.body);
  if (focus) elements['title-input'].focus();
}
function renderTags(note) {
  const target = elements['tag-chips'];
  target.replaceChildren();
  for (const tag of note.tags) {
    const chip=document.createElement('span'); chip.className='tag-chip';
    const label=document.createElement('span');label.textContent=tag;
    const remove=document.createElement('button');remove.type='button';remove.className='remove-tag';
    remove.setAttribute('aria-label',`Remove tag ${tag}`); remove.title=`Remove ${tag}`;
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
    const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-x');icon.append(use);remove.append(icon);
    remove.addEventListener('click',()=>{const active=notes.find(n=>n.id===activeId);if(!active)return;changeActive({tags:active.tags.filter(t=>t!==tag)});renderTags(notes.find(n=>n.id===activeId));elements['tag-input'].focus();});
    chip.append(label,remove);target.append(chip);
  }
  elements['tag-input'].disabled = note.tags.length >= MAX_TAGS;
  elements['tag-input'].placeholder = note.tags.length >= MAX_TAGS ? 'Tag limit reached' : 'Add tag + Enter';
}
function addTag() {
  if (importing) return;
  const note=notes.find(n=>n.id===activeId);if(!note)return;
  const entry=elements['tag-input'];
  const tag=normalizeTags([entry.value])[0];
  if (!tag) {entry.value='';return;}
  if (note.tags.length>=MAX_TAGS) {showNotice('Maximum 12 tags per note.');return;}
  if (note.tags.some(t=>t.toLocaleLowerCase()===tag.toLocaleLowerCase())) {showNotice('Tag already exists.');entry.value='';return;}
  changeActive({tags:[...note.tags,tag]});entry.value='';renderTags(notes.find(n=>n.id===activeId));
}
function switchView(view) {
  if (view === 'list' && focusMode) setFocusMode(false);
  selectedView = view;
  elements.app.dataset.view = view;
}
function openNote(id, focus = false) {
  if (!notes.some(note => note.id === id)) return;
  activeId = id;
  elements['focus-toggle'].disabled = false;
  previewActive = false;
  elements['markdown-preview'].hidden = true;
  elements['body-input'].hidden = false;
  elements['preview-toggle'].setAttribute('aria-pressed','false');
  elements['preview-toggle'].textContent='Preview';
  document.querySelectorAll('[data-format]').forEach(button=>button.disabled=false);
  switchView('editor');
  renderList();renderEditor({focus});
}
function newNote({focusBody = false} = {}) {
  if (importing) return;
  if (notes.length >= MAX_NOTES) {showNotice('The notebook has reached its 1,000-note limit.');return}
  const note = createNote(crypto.randomUUID());
  notes.unshift(note);
  scheduleSave();
  openNote(note.id,!focusBody);
  if (focusBody) elements['body-input'].focus();
}
function changeActive(patch) {
  if (importing || !activeId) return;
  notes = updateNote(notes,activeId,patch);
  const note = notes.find(n=>n.id===activeId);
  elements['note-date'].textContent = `UPDATED ${formatDate(note.updatedAt)}`;
  updateWordCount(note.body);
  renderList();
  if (Object.hasOwn(patch,'body') && previewActive) refreshPreview();
  if (Object.hasOwn(patch,'title') || Object.hasOwn(patch,'body')) {
    void draftJournal.record(note).catch(() => {showNotice('Recovery draft could not be written. Keep Notely open until Saved.');});
  }
  scheduleSave();
}
function toggleFavorite() {
  const note=notes.find(n=>n.id===activeId);if(!note)return;
  changeActive({favorite:!note.favorite});
  elements['favorite-button'].setAttribute('aria-pressed',String(!note.favorite));
  elements['favorite-button'].setAttribute('aria-label',note.favorite ? 'Add to favorites' : 'Remove from favorites');
  elements['favorite-button'].title = note.favorite ? 'Add to favorites' : 'Remove from favorites';
}
function togglePin() {
  const note = notes.find(n=>n.id===activeId);if(!note)return;
  changeActive({pinned:!note.pinned});
  renderEditor();
}
function updateTheme(theme) {
  document.body.dataset.theme = theme;
  const use = elements['theme-button'].querySelector('use');
  use.setAttribute('href',theme==='dark'?'#i-sun':'#i-moon');
  const themeAction = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  elements['theme-button'].title = themeAction;
  elements['theme-button'].setAttribute('aria-label', themeAction);
}

function refreshPreview() {
  const note = notes.find(item => item.id === activeId);
  if (!note) {elements['markdown-preview'].replaceChildren();return;}
  const shownId = note.id;
  renderMarkdown(elements['markdown-preview'], note.body, line => {
    const current = notes.find(item => item.id === activeId);
    if (importing || !current || current.id !== shownId) return;
    const updated = toggleTask(current.body, line);
    if (updated === current.body) return;
    elements['body-input'].value = updated;
    changeActive({body:updated});
  });
}
function setPreview(active) {
  previewActive = Boolean(active);
  elements['markdown-preview'].hidden = !previewActive;
  elements['body-input'].hidden = previewActive;
  elements['preview-toggle'].setAttribute('aria-pressed', String(previewActive));
  elements['preview-toggle'].textContent = previewActive ? 'Edit' : 'Preview';
  for (const button of document.querySelectorAll('[data-format]')) button.disabled = previewActive;
  if (previewActive) { refreshPreview(); elements['preview-toggle'].focus(); }
  else if (active === false && selectedView === 'editor') elements['body-input'].focus();
}
function applyFormatting(action) {
  if (previewActive || selectedView !== 'editor' || !activeId) return;
  const textarea = elements['body-input'];
  const result = formatSelection(textarea.value,textarea.selectionStart,textarea.selectionEnd,action);
  if (result.value === textarea.value) return;
  textarea.value = result.value;
  changeActive({body:result.value});
  textarea.focus();
  textarea.setSelectionRange(result.start,result.end);
}


function downloadFile(filename, content, mime) {
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function downloadBackup() {
  try {
    const content = JSON.stringify(createBackup(notes), null, 2);
    downloadFile(`notely-backup-${new Date().toISOString().slice(0,10)}.json`, content, 'application/json;charset=utf-8');
    elements['import-result'].textContent = 'Backup download requested. Verify the file in Downloads.';
  } catch(error) { showNotice(`Backup unavailable: ${error.message}`); }
}
function downloadCurrentNote(extension) {
  const note = notes.find(item => item.id === activeId);
  if (!note) return;
  const file = exportNote(note, extension);
  downloadFile(file.filename, file.content, file.mime);
}
function importResult(message, error = false) {
  elements['import-result'].textContent = message;
  elements['import-result'].dataset.error = String(error);
}
function resetImportPreviewOnClose() {
  // A File.text() read can resolve after the dialog has closed. Invalidate its
  // revision so it cannot silently prepare an import on the next open.
  importSelection.invalidate();
  importedNotes = null;
  importPreviewBase = null;
  elements['import-file'].value = '';
  elements['replace-confirm'].checked = false;
  elements['import-result'].textContent = '';
  elements['import-summary'].textContent = 'Choose a JSON backup file.';
  refreshImportPreview();
}
function refreshImportPreview() {
  const mode = elements['import-mode'].value;
  elements['replace-confirm-row'].hidden = mode !== 'replace';
  const staleReplace = mode === 'replace' && !importPreviewIsCurrent(importPreviewBase, notes);
  elements['import-apply'].disabled = importing || !importedNotes || staleReplace || (mode === 'replace' && !elements['replace-confirm'].checked);
  if (!importedNotes) return;
  try {
    const plan = planImport(notes, importedNotes, mode);
    if (staleReplace) {
      elements['import-summary'].textContent = 'Notes changed since the backup preview. Select the backup again before replacing your notes.';
      return;
    }
    elements['import-summary'].textContent = mode === 'replace'
      ? `${importedNotes.length} notes in backup. ${notes.length} current notes will be replaced.`
      : `${importedNotes.length} notes in backup. ${plan.added} new, ${plan.skipped} existing IDs skipped${plan.conflicts ? ` (${plan.conflicts} different content)` : ''}.`;
  } catch(error) {
    elements['import-apply'].disabled = true;
    elements['import-summary'].textContent = error.message;
  }
}
async function readBackupFile() {
  if (importing) return;
  const revision = importSelection.invalidate();
  importedNotes = null;
  importPreviewBase = null;
  elements['replace-confirm'].checked = false;
  importResult('');
  const file = elements['import-file'].files?.[0];
  if (!file) { elements['import-summary'].textContent = 'Choose a JSON backup file.'; refreshImportPreview(); return; }
  if (file.size > MAX_BACKUP_BYTES) { elements['import-summary'].textContent = 'File exceeds the 25 MB limit.'; refreshImportPreview(); return; }
  try {
    const result = await importSelection.read(file, revision);
    if (!result.current) return;
    importedNotes = result.notes;
    importPreviewBase = captureImportBaseline(notes);
    refreshImportPreview();
  } catch(error) {
    if (revision !== importSelection.currentRevision) return;
    elements['import-summary'].textContent = error.message;
    refreshImportPreview();
  }
}
async function applyImport() {
  if (importing || recoveryInProgress || !importedNotes) return;
  const mode = elements['import-mode'].value;
  if (mode === 'replace' && (!elements['replace-confirm'].checked || !importPreviewIsCurrent(importPreviewBase, notes))) {
    refreshImportPreview();
    return;
  }
  const candidate = structuredClone(importedNotes);
  importing = true;
  lockEditingForImport(true);
  elements['import-apply'].disabled = true;
  for (const id of ['import-file','import-mode','replace-confirm']) elements[id].disabled = true;
  try {
    await storageQueue.whenIdle();
    if (storageQueue.getState().failed) throw new Error('Save current changes first using Retry.');
    const plan = await request('NOTES_IMPORT',{notes:candidate,mode,expected:mode === 'replace' ? importPreviewBase : notes});
    if (mode === 'merge' && plan.added === 0) {
      importResult(`No new notes. ${plan.skipped} existing IDs were preserved.`);
      return;
    }
    notes = plan.notes;
    baseline = structuredClone(notes);
    storageQueue.seed(notes);
    activeId = null;
    importedNotes = null;
    importPreviewBase = null;
    elements['import-file'].value = '';
    elements['replace-confirm'].checked = false;
    renderList(); renderEditor(); switchView('list');
    importResult(mode === 'replace' ? `Restored ${plan.added} notes.` : `Imported ${plan.added} notes. Skipped ${plan.skipped} existing IDs.`);
  } catch(error) { importResult(error.message, true); }
  finally { importing = false;
    lockEditingForImport(false);
    for (const id of ['import-file','import-mode','replace-confirm']) elements[id].disabled = false;
    refreshImportPreview();
  }
}

function bindings() {
  elements['focus-toggle'].addEventListener('click', () => setFocusMode(!focusMode));
  elements['recovery-restore'].addEventListener('click', restoreRecovery);
  elements['recovery-discard'].addEventListener('click', discardRecovery);
  const resize = elements['sidebar-resize'];
  const resizeWidth = delta => setSidebarWidth(parseFloat(getComputedStyle(document.body).getPropertyValue('--sidebar-width')) + delta);
  resize.addEventListener('keydown', event => {
    if (!isWideWorkspace() || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') setSidebarWidth(260);
    else if (event.key === 'End') setSidebarWidth(520);
    else resizeWidth(event.key === 'ArrowLeft' ? -20 : 20);
  });
  resize.addEventListener('pointerdown', event => {
    if (!isWideWorkspace() || focusMode || event.button !== 0) return;
    event.preventDefault();
    resize.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = parseFloat(getComputedStyle(document.body).getPropertyValue('--sidebar-width')) || 340;
    const move = moveEvent => setSidebarWidth(startWidth + moveEvent.clientX - startX);
    const stop = () => { if (resize.hasPointerCapture(event.pointerId)) resize.releasePointerCapture(event.pointerId); resize.removeEventListener('pointermove',move);resize.removeEventListener('pointerup',stop);resize.removeEventListener('pointercancel',stop); };
    resize.addEventListener('pointermove',move);resize.addEventListener('pointerup',stop);resize.addEventListener('pointercancel',stop);
  });
  const clear = elements['clear-filters'];
  clear.addEventListener('click', clearFilters);
  elements['note-list'].addEventListener('keydown',moveNoteFocus);
  elements['sidepanel-open'].addEventListener('click', async () => {
    try { await openNotelySidePanel(chrome); }
    catch (error) { console.error('Notely side panel:', error); showNotice('Could not open the side panel. Check Chrome compatibility and try again.'); }
  });
  elements['workspace-open'].addEventListener('click', async () => {
    if (isWorkspace) return;
    try { await chrome.tabs.create({url:chrome.runtime.getURL('popup.html?workspace=1')}); }
    catch { showNotice('Could not open the workspace tab.'); }
  });
  // One-shot support dialog motion. Never retain GPU layers or animate dialog dimensions.
  let supportSession = 0;
  let supportCloseAnimation = null;
  const supportDialog = elements['support-dialog'];
  const reduceSupportMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const closeSupportDialog = () => {
    if (!supportDialog.open || supportCloseAnimation) return;
    // Preserve native close behavior when motion is reduced or Web Animations is unavailable.
    if (reduceSupportMotion() || typeof supportDialog.animate !== 'function') {
      supportDialog.close();
      return;
    }
    let animation;
    try {
      animation = supportDialog.animate([{opacity:1},{opacity:0}], {
        duration:110, easing:'ease-in', fill:'forwards'
      });
    } catch {
      // An exposed but unusable Web Animations API must never trap the dialog.
      supportDialog.close();
      return;
    }
    supportCloseAnimation = animation;
    const finish = () => {
      if (supportCloseAnimation !== animation) return;
      // Clear fill:forwards before another open, even when animation completion fails.
      try { animation.cancel(); } catch { /* native close must still proceed */ }
      supportCloseAnimation = null;
      if (supportDialog.open) supportDialog.close();
    };
    try { Promise.resolve(animation.finished).then(finish, finish); }
    catch { finish(); }
  };
  elements['support-open'].addEventListener('click', () => {
    if (supportDialog.open) return;
    supportSession += 1;
    elements['support-copy-result'].textContent = '';
    elements['support-copy'].textContent = 'Copy';
    elements['support-copy'].disabled = false;
    supportDialog.showModal();
    elements['support-copy'].focus();
  });
  for (const id of ['support-close', 'support-done']) {
    elements[id].addEventListener('click', closeSupportDialog);
  }
  supportDialog.addEventListener('cancel', event => {
    if (supportCloseAnimation) { event.preventDefault(); return; }
    if (!reduceSupportMotion() && typeof supportDialog.animate === 'function') {
      event.preventDefault();
      closeSupportDialog();
    }
  });
  supportDialog.addEventListener('close', () => {
    supportCloseAnimation?.cancel();
    supportCloseAnimation = null;
    supportSession += 1;
    elements['support-copy'].disabled = false;
    elements['support-copy'].textContent = 'Copy';
    elements['support-open'].focus();
  });
  elements['support-copy'].addEventListener('click', async () => {
    const session = supportSession;
    const copy = elements['support-copy'];
    copy.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(elements['support-address'].value);
      if (session !== supportSession || !elements['support-dialog'].open) return;
      copy.textContent = 'Copied';
      elements['support-copy-result'].textContent = 'Address copied. Verify it before sending.';
    } catch {
      if (session !== supportSession || !elements['support-dialog'].open) return;
      elements['support-address'].focus();
      elements['support-address'].select();
      elements['support-copy-result'].textContent = 'Copy unavailable. Select and copy the address manually.';
    } finally {
      if (session === supportSession && elements['support-dialog'].open) copy.disabled = false;
    }
  });
  elements['backup-open'].addEventListener('click', () => { if (recoveryInProgress) return; elements['backup-dialog'].showModal(); elements['backup-download'].focus(); });
  elements['backup-close'].addEventListener('click', () => { if (!importing) elements['backup-dialog'].close(); });
  elements['backup-dialog'].addEventListener('cancel', event => { if (importing) event.preventDefault(); });
  elements['backup-dialog'].addEventListener('close', () => { if (!importing) resetImportPreviewOnClose(); });
  elements['backup-download'].addEventListener('click', downloadBackup);
  elements['export-md'].addEventListener('click', () => downloadCurrentNote('md'));
  elements['export-txt'].addEventListener('click', () => downloadCurrentNote('txt'));
  elements['import-file'].addEventListener('change', readBackupFile);
  elements['import-mode'].addEventListener('change', () => {elements['replace-confirm'].checked = false; refreshImportPreview();});
  elements['replace-confirm'].addEventListener('change', refreshImportPreview);
  elements['import-apply'].addEventListener('click', applyImport);
  elements['new-note'].addEventListener('click',()=>newNote());
  elements['quick-note'].addEventListener('click',()=>newNote({focusBody:true}));
  elements['capture-source'].addEventListener('change', async event => {
    const input = event.target;
    const desired = input.checked;
    input.disabled = true;
    try { await chrome.storage.local.set({[CAPTURE_SOURCE_KEY]:desired}); }
    catch { input.checked = !desired; showNotice('Capture setting could not be saved.'); }
    finally { input.disabled = false; }
  });
  elements['empty-create'].addEventListener('click',()=>newNote());
  elements.search.addEventListener('input',()=>renderList({resetScroll:true}));
  for (const id of ['search-field','sort-mode','tag-filter']) elements[id].addEventListener('change',()=>renderList({resetScroll:true}));
  elements['favorites-filter'].addEventListener('click',()=>{favoritesOnly=!favoritesOnly;elements['favorites-filter'].setAttribute('aria-pressed',String(favoritesOnly));renderList({resetScroll:true});});
  elements['favorite-button'].addEventListener('click',toggleFavorite);
  elements['tag-input'].addEventListener('keydown',event=>{
    if (event.key==='Enter' || event.key===',') {event.preventDefault();addTag();}
  });
  elements['tag-input'].addEventListener('blur',()=>{if(elements['tag-input'].value.trim())addTag();});
  elements['title-input'].addEventListener('input',event=>changeActive({title:event.target.value}));
  elements['body-input'].addEventListener('input',event=>changeActive({body:event.target.value}));
  document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click',()=>applyFormatting(button.dataset.format)));
  elements['preview-toggle'].addEventListener('click',()=>setPreview(!previewActive));
  elements['pin-button'].addEventListener('click',togglePin);
  elements['back-button'].addEventListener('click',returnToList);
  elements['delete-button'].addEventListener('click',()=>{deletingId = activeId; elements['confirm-dialog'].returnValue='cancel'; elements['confirm-dialog'].showModal();});
  elements['confirm-dialog'].addEventListener('close',()=>{
    if (elements['confirm-dialog'].returnValue === 'delete') deleteActive();
    else deletingId = null;
  });
  elements['undo-button'].addEventListener('click', restoreDeleted);
  elements['retry-button'].addEventListener('click', retrySave);
  elements['list-retry-button'].addEventListener('click', retrySave);
  elements['theme-button'].addEventListener('click',async()=>{
    const previous = document.body.dataset.theme;
    const next = previous === 'dark' ? 'light' : 'dark';
    const button = elements['theme-button'];
    button.disabled = true;
    updateTheme(next);
    try { await chrome.storage.local.set({[THEME_KEY]:next}); }
    catch { updateTheme(previous); showNotice('Theme preference could not be saved.'); }
    finally { button.disabled = false; }
  });
  document.addEventListener('keydown',event=>{
    if (elements['confirm-dialog'].open || elements['backup-dialog'].open || elements['support-dialog'].open) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (selectedView === 'editor' && document.activeElement === elements['body-input'] && mod) {
      const action = !event.shiftKey && key === 'b' ? 'bold' : !event.shiftKey && key === 'i' ? 'italic' : !event.shiftKey && key === 'k' ? 'link' : event.shiftKey && key === 'c' ? 'code' : null;
      if (action) {event.preventDefault();applyFormatting(action);return;}
    }
    if (isWorkspace && mod && event.shiftKey && key === 'f') {event.preventDefault();setFocusMode(!focusMode);return;}
    if (selectedView === 'editor' && mod && event.shiftKey && key === 'p') {event.preventDefault();setPreview(!previewActive);return;}
    if (mod && !event.shiftKey && key === 'n') { event.preventDefault(); newNote(); return; }
    if (mod && key === 's') { event.preventDefault(); retrySave(); return; }
    if ((mod && key === 'k') || (event.key === '/' && !mod && !event.altKey && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))) {
      event.preventDefault(); switchView('list'); elements.search.focus(); elements.search.select(); return;
    }
    if (mod && event.key === 'Enter' && document.activeElement === elements['title-input']) {
      event.preventDefault(); elements['body-input'].focus(); return;
    }
    if (event.key === 'Escape' && selectedView === 'editor') { event.preventDefault(); returnToList(); }
  });
}
function returnToList() {
  const previousId = activeId;
  switchView('list'); renderList();
  const match = Array.from(elements['note-list'].querySelectorAll('.note-card')).find(el => el.dataset.noteId === previousId);
  (match || elements.search).focus();
}
async function init() {
  bindings();
  try {
    const result = await chrome.storage.local.get([THEME_KEY,CAPTURE_SOURCE_KEY]);
    notes = validateStoredNotes(await request('NOTES_GET'));
    baseline = structuredClone(notes);
    elements['capture-source'].checked = result[CAPTURE_SOURCE_KEY] !== false;
    const preferred = result[THEME_KEY] === 'light' || result[THEME_KEY] === 'dark' ? result[THEME_KEY] : (matchMedia('(prefers-color-scheme: light)').matches ? 'light':'dark');
    updateTheme(preferred);
  } catch (error) {
    setSaveStatus('Storage unavailable','error');
    showNotice('Could not load stored notes. Changes are disabled to protect existing data.');
    document.querySelectorAll('button,input,textarea').forEach(el => el.disabled = true);
    console.error('Notely startup error:',error);
    return;
  }
  chrome.storage.onChanged.addListener((changes,area)=>{
    if (area !== 'local' || !changes[STORAGE_KEY] || storageQueue.getState().pending || storageQueue.getState().failed || importing) return;
    let remote;
    try { remote = validateStoredNotes(changes[STORAGE_KEY].newValue); }
    catch (error) {
      // Keep the visible and acknowledged state untouched; a future write
      // also fails closed at the service-worker coordinator boundary.
      setSaveStatus('Storage changed unexpectedly - reload', 'error');
      showNotice(`Stored notes require attention: ${error.message}`);
      return;
    }
    const refreshActive = activeNoteChanged(notes, remote, activeId);
    notes = remote;
    baseline = structuredClone(notes);
    storageQueue.seed(notes);
    if (activeId && !notes.some(n=>n.id===activeId)) {activeId=null;switchView('list');}
    renderList();
    // Reassigning textarea.value for an unrelated capture resets the caret
    // and text selection. Only refresh the editor if its note actually changed.
    if (refreshActive) renderEditor();
  });
  renderList();renderEditor();
  setSidebarWidth(340);
  window.addEventListener('resize', () => {
    if (isWorkspace) setSidebarWidth(parseFloat(getComputedStyle(document.body).getPropertyValue('--sidebar-width')) || 340);
  });
  setFocusMode(false);
  try { await refreshRecovery(); } catch { showNotice('Recovery drafts could not be checked.'); }
  const save = storageQueue.getState();
  if (save.failed) setSaveStatus('Not saved - retry', 'error');
  else if (save.pending) setSaveStatus('Saving...', 'saving');
  else setSaveStatus('Saved', 'saved');
}
init();

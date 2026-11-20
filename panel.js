import { STORAGE_KEY, THEME_KEY, MAX_NOTES, createNote, normalizeNotes, sortAndFilter, updateNote, displayTitle, preview, wordCount } from './core.mjs';

const $ = id => document.getElementById(id);
const elements = Object.fromEntries(['app','new-note','empty-create','search','note-list','notes-count','filtered-count','editor','editor-empty','title-input','body-input','note-date','word-count','save-status','pin-button','delete-button','back-button','theme-button','confirm-dialog','notice'].map(id => [id, $(id)]));
let notes = [];
let activeId = null;
let selectedView = 'list';
let writeTail = Promise.resolve();
let pendingTimer = null;
let revision = 0;
let savedRevision = 0;
let noticeTimer = null;
let storageFailure = false;

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('en', {month:'long', day:'numeric', year:'numeric'}).format(new Date(timestamp));
}
function relativeDate(timestamp) {
  const delta = Date.now() - timestamp;
  if (delta >= 0 && delta < 86400000) return 'Today';
  if (delta >= 0 && delta < 172800000) return 'Yesterday';
  return new Intl.DateTimeFormat('en', {month:'short', day:'numeric'}).format(new Date(timestamp));
}
function showNotice(message) {
  elements.notice.textContent = message;
  elements.notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {elements.notice.hidden = true}, 5500);
}
function status(message, state = 'ok') {
  elements['save-status'].dataset.state = state;
  elements['save-status'].querySelector('span').textContent = message;
}
function scheduleSave(immediate = false) {
  revision++;
  status('Saving...');
  clearTimeout(pendingTimer);
  if (immediate) flushSave();
  else pendingTimer = setTimeout(flushSave, 320);
}
function flushSave() {
  clearTimeout(pendingTimer);
  pendingTimer = null;
  const snapshot = structuredClone(notes);
  const writingRevision = revision;
  writeTail = writeTail.catch(() => {}).then(async () => {
    await chrome.storage.local.set({ [STORAGE_KEY]: snapshot });
    savedRevision = writingRevision;
    storageFailure = false;
    if (revision === savedRevision) status('Saved');
  }).catch(err => {
    storageFailure = true;
    status('Not saved', 'error');
    showNotice('Could not save your notes. Please check available Chrome storage and try Ctrl+S.');
    console.error('Notely storage error:', err);
  });
  return writeTail;
}
function renderList() {
  const list = sortAndFilter(notes, elements.search.value);
  elements['notes-count'].textContent = `${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`;
  elements['filtered-count'].textContent = elements.search.value.trim() ? `(${list.length})` : '';
  const container = elements['note-list'];
  container.replaceChildren();
  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'list-empty';
    empty.textContent = notes.length ? 'No matching notes.' : 'Nothing here yet. Create a note to get started.';
    container.append(empty);
  }
  const fragment = document.createDocumentFragment();
  for (const note of list) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `note-card${note.id === activeId ? ' active' : ''}`;
    button.setAttribute('role', 'listitem'); button.setAttribute('aria-label', `Open ${displayTitle(note)}`);
    const top = document.createElement('div'); top.className = 'note-card-top';
    const title = document.createElement('span'); title.className = 'note-card-title'; title.textContent = displayTitle(note);
    top.append(title);
    if (note.pinned) {const pin=document.createElementNS('http://www.w3.org/2000/svg','svg');pin.classList.add('note-card-pin');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-pin');pin.append(use);top.append(pin)}
    const desc = document.createElement('div');desc.className='note-card-preview';desc.textContent=preview(note);
    const meta = document.createElement('div');meta.className='note-card-meta';meta.textContent=relativeDate(note.updatedAt);
    button.append(top,desc,meta);
    button.addEventListener('click', () => openNote(note.id));
    fragment.append(button);
  }
  container.append(fragment);
}
function renderEditor({focus = false} = {}) {
  const note = notes.find(item => item.id === activeId);
  elements.editor.hidden = !note;
  elements['editor-empty'].hidden = Boolean(note);
  if (!note) return;
  elements['title-input'].value = note.title;
  elements['body-input'].value = note.body;
  elements['note-date'].textContent = `UPDATED ${formatDate(note.updatedAt)}`;
  elements['pin-button'].setAttribute('aria-pressed', String(note.pinned));
  elements['pin-button'].setAttribute('aria-label', note.pinned ? 'Unpin note' : 'Pin note');
  elements['pin-button'].title = note.pinned ? 'Unpin note' : 'Pin note';
  elements['word-count'].textContent = `${wordCount(note.body)} ${wordCount(note.body) === 1 ? 'word' : 'words'}`;
  if (focus) elements['title-input'].focus();
}
function switchView(view) {selectedView = view;elements.app.dataset.view = view}
function openNote(id, focus = false) {
  if (!notes.some(note => note.id === id)) return;
  activeId = id;
  switchView('editor');
  renderList();renderEditor({focus});
}
function newNote() {
  if (notes.length >= MAX_NOTES) {showNotice('The notebook has reached its 1,000-note limit.');return}
  const note = createNote(crypto.randomUUID());
  notes.unshift(note);
  scheduleSave(true);
  openNote(note.id,true);
}
function changeActive(patch) {
  if (!activeId) return;
  notes = updateNote(notes,activeId,patch);
  const note = notes.find(n=>n.id===activeId);
  elements['note-date'].textContent = `UPDATED ${formatDate(note.updatedAt)}`;
  elements['word-count'].textContent = `${wordCount(note.body)} ${wordCount(note.body) === 1 ? 'word' : 'words'}`;
  renderList();
  scheduleSave();
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
  elements['theme-button'].title = theme==='dark'?'Switch to light theme':'Switch to dark theme';
}
function bindings() {
  elements['new-note'].addEventListener('click',newNote);
  elements['empty-create'].addEventListener('click',newNote);
  elements.search.addEventListener('input',renderList);
  elements['title-input'].addEventListener('input',event=>changeActive({title:event.target.value}));
  elements['body-input'].addEventListener('input',event=>changeActive({body:event.target.value}));
  elements['pin-button'].addEventListener('click',togglePin);
  elements['back-button'].addEventListener('click',()=>{switchView('list');renderList()});
  elements['delete-button'].addEventListener('click',()=>elements['confirm-dialog'].showModal());
  elements['confirm-dialog'].addEventListener('close',()=>{
    if(elements['confirm-dialog'].returnValue!=='delete'||!activeId)return;
    notes=notes.filter(note=>note.id!==activeId);
    activeId = null;
    switchView('list');renderList();renderEditor();scheduleSave(true);
  });
  elements['theme-button'].addEventListener('click',async()=>{
    const next=document.body.dataset.theme==='dark'?'light':'dark';updateTheme(next);
    try {await chrome.storage.local.set({[THEME_KEY]:next})} catch {showNotice('Theme preference could not be saved.')}
  });
  document.addEventListener('keydown',event=>{
    const mod=event.ctrlKey||event.metaKey;
    if(mod&&event.key.toLowerCase()==='n'){event.preventDefault();newNote()}
    if(mod&&event.key.toLowerCase()==='s'){event.preventDefault();flushSave()}
    if(event.key==='/'&&!mod&&!event.altKey&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)&&!elements['confirm-dialog'].open){event.preventDefault();switchView('list');elements.search.focus()}
    if(event.key==='Escape'&&!elements['confirm-dialog'].open&&selectedView==='editor'&&window.matchMedia('(max-width:680px)').matches){switchView('list')}
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&pendingTimer)flushSave()});
  window.addEventListener('pagehide',()=>{if(pendingTimer)flushSave()});
}
async function init() {
  bindings();
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY,THEME_KEY]);
    notes = normalizeNotes(result[STORAGE_KEY]);
    const preferred = result[THEME_KEY] === 'light' || result[THEME_KEY] === 'dark' ? result[THEME_KEY] : (matchMedia('(prefers-color-scheme: light)').matches ? 'light':'dark');
    updateTheme(preferred);
  } catch (error) {
    status('Storage unavailable','error');
    showNotice('Could not load stored notes. Changes are disabled to protect existing data.');
    document.querySelectorAll('button,input,textarea').forEach(el => el.disabled = true);
    console.error('Notely startup error:',error);
    return;
  }
  renderList();renderEditor();
}
init();

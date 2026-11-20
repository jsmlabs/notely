/** Preserve keyboard location across keyed note-list re-renders. */
export function captureNoteListFocus(container, activeElement) {
  if (!container || !activeElement || !container.contains(activeElement)) return null;
  const cards = [...container.querySelectorAll('.note-card')];
  const index = cards.indexOf(activeElement);
  return index < 0 ? null : { id: activeElement.dataset.noteId, index };
}

export function restoreNoteListFocus(container, snapshot) {
  if (!snapshot) return false;
  const cards = [...container.querySelectorAll('.note-card')];
  if (!cards.length) return false;
  const target = cards.find(card => card.dataset.noteId === snapshot.id)
    ?? cards[Math.min(Math.max(snapshot.index, 0), cards.length - 1)];
  target.focus({ preventScroll: true });
  return true;
}

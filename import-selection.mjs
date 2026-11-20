/** A later file choice invalidates any earlier asynchronous file read. */
export function createImportSelection(parse) {
  if (typeof parse !== 'function') throw new TypeError('parse must be a function');
  let revision = 0;
  return {
    get currentRevision() { return revision; },
    invalidate() { return ++revision; },
    async read(file, selectedRevision) {
      try {
        const parsed = parse(await file.text());
        return selectedRevision === revision ? { current: true, notes: parsed } : { current: false };
      } catch (error) {
        if (selectedRevision !== revision) return { current: false };
        throw error;
      }
    },
  };
}

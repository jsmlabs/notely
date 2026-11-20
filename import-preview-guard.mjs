/** Bind destructive replacement to the exact notes seen when the backup was previewed. */
export function captureImportBaseline(notes) {
  return structuredClone(notes);
}
export function importPreviewIsCurrent(baseline, notes) {
  return Array.isArray(baseline) && Array.isArray(notes) &&
    JSON.stringify(baseline) === JSON.stringify(notes);
}

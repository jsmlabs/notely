/** Keep source links parseable, bounded, and safe to display/open. */
export function validSourceUrl(value) {
  if (typeof value !== 'string' || !value || value.length > 4096) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

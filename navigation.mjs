// Pure keyboard index resolution, shared by popup and regression tests.
export function nextFocusIndex(key, current, count) {
  if (!Number.isInteger(count) || count <= 0) return -1;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return Math.min(current + 1, count - 1);
  if (key === 'ArrowUp') return current < 0 ? count - 1 : Math.max(0, current - 1);
  return -1;
}

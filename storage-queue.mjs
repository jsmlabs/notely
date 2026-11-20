/** Single-flight, last-snapshot-wins persistence. Only acknowledged writes are marked saved. */
export function createStorageQueue(write, onState = () => {}) {
  if (typeof write !== 'function') throw new TypeError('write must be a function');
  let latest = null;
  let pending = null;
  let running = false;
  let revision = 0;
  let savedRevision = 0;
  let failed = false;
  let idleResolvers = [];

  function emit(state) { onState(state, { revision, savedRevision }); }
  function settleIdle() {
    if (running || pending) return;
    for (const resolve of idleResolvers.splice(0)) resolve();
  }
  async function pump() {
    if (running) return;
    running = true;
    while (pending) {
      const current = pending;
      pending = null;
      try {
        await write(current.snapshot);
        savedRevision = current.revision;
        failed = false;
        if (!pending) emit('saved');
      } catch (error) {
        failed = true;
        if (!pending) emit('error');
      }
    }
    running = false;
    settleIdle();
  }
  return {
    enqueue(snapshot) {
      latest = structuredClone(snapshot);
      pending = { snapshot: latest, revision: ++revision };
      emit('saving');
      void pump();
    },
    seed(snapshot) {
      if (running || pending) throw new Error('Cannot reset a pending save.');
      latest = structuredClone(snapshot);
      failed = false;
      savedRevision = ++revision;
      emit('saved');
    },
    retry() {
      if (latest === null) return;
      pending = { snapshot: structuredClone(latest), revision: ++revision };
      emit('saving');
      void pump();
    },
    whenIdle() { return !running && !pending ? Promise.resolve() : new Promise(resolve => idleResolvers.push(resolve)); },
    getState() { return { revision, savedRevision, failed, pending: running || Boolean(pending) }; },
  };
}

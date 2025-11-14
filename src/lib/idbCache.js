import { get as idbGet, set as idbSet } from 'idb-keyval';

// Generic helpers around idb-keyval so the rest of the code stays clean.
// Each entry looks like: { data: <any>, timestamp: <string|null> }
//   data      – whatever array / object you want to persist
//   timestamp – ISO string of the newest record in `data`

export const readCache = async (key) => {
  try {
    return await idbGet(key);
  } catch {
    return null;
  }
};

export const writeCache = async (key, payload) => {
  try {
    await idbSet(key, payload);
  } catch (e) {
    // Failing silently keeps the app functional even if persistence breaks
    console.error('IndexedDB write error', e);
  }
}; 
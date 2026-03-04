const DB_NAME = 'VidaMixeTV_DB';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

export interface SavedRecording {
  id: string;
  blob: Blob;
  date: Date;
  duration: number; // in seconds
  name: string;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveRecording = async (blob: Blob, duration: number, customName?: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const recording: SavedRecording = {
    id: crypto.randomUUID(),
    blob,
    date: new Date(),
    duration,
    name: customName || `Transmisión ${new Date().toLocaleString()}`
  };

  await new Promise<void>((resolve, reject) => {
    const request = store.add(recording);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getRecordings = async (): Promise<SavedRecording[]> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.reverse()); // Newest first
    request.onerror = () => reject(request.error);
  });
};

export const deleteRecording = async (id: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

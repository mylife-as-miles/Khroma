const DB_NAME = "csv-data-store";
const STORE_NAME = "csv-files";
const DB_VERSION = 1;

interface CsvData {
  id: string;
  headers: string[];
  rows: { [key: string]: string }[];
  fileName: string;
}

let db: IDBDatabase | null = null;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject("Error opening IndexedDB");
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveCsvToDB(data: CsvData): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject("Error saving data to IndexedDB");
    };
  });
}

export async function getCsvFromDB(id: string): Promise<CsvData | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve((request.result as CsvData) || null);
    };

    request.onerror = () => {
      reject("Error getting data from IndexedDB");
    };
  });
}

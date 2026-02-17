/**
 * IndexedDB utilities for offline answer storage
 * 
 * Stores answers locally when offline, syncs with server when online.
 */

const DB_NAME = 'OL5_OLYMPIAD';
const DB_VERSION = 1;
const STORE_NAME = 'answers';

/**
 * Open IndexedDB database
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('olympiadId', 'olympiadId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save answers for an olympiad
 * @param {String} olympiadId - Olympiad ID
 * @param {Object} answers - Answers object
 */
export async function saveAnswers(olympiadId, answers) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const data = {
      key: `answers_${olympiadId}`,
      olympiadId,
      answers,
      timestamp: new Date().toISOString()
    };

    await store.put(data);
    return true;
  } catch (error) {
    console.error('Error saving answers to IndexedDB:', error);
    return false;
  }
}

/**
 * Get saved answers for an olympiad
 * @param {String} olympiadId - Olympiad ID
 * @returns {Object|null} - Saved answers or null
 */
export async function getSavedAnswers(olympiadId) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const key = `answers_${olympiadId}`;
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.answers : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting saved answers from IndexedDB:', error);
    return null;
  }
}

/**
 * Delete saved answers for an olympiad
 * @param {String} olympiadId - Olympiad ID
 */
export async function deleteSavedAnswers(olympiadId) {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const key = `answers_${olympiadId}`;
    await store.delete(key);
    return true;
  } catch (error) {
    console.error('Error deleting saved answers from IndexedDB:', error);
    return false;
  }
}

/**
 * Get all saved answers (for sync purposes)
 * @returns {Array} - Array of saved answer entries
 */
export async function getAllSavedAnswers() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting all saved answers from IndexedDB:', error);
    return [];
  }
}

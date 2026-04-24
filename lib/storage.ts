// ============================================================
// Tyren — IndexedDB Storage Layer
// Zero-dependency IndexedDB wrapper for chat history persistence.
// Replaces localStorage to avoid 5MB quota limits and main-thread blocking.
// ============================================================

import { Message } from './types';

const DB_NAME = 'tyren_db';
const DB_VERSION = 1;
const STORE_NAME = 'chat_history';
const HISTORY_KEY = 'current_session';

// Legacy localStorage key for migration
const LEGACY_STORAGE_KEY = 'tyren_chat_history';

/**
 * Opens (or creates) the IndexedDB database.
 * Returns a promise that resolves with the database instance.
 */
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Save chat messages to IndexedDB.
 * Strips base64 image data before persisting to keep storage lean.
 */
export async function saveChatHistory(messages: Message[]): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Strip base64 images to avoid bloating the database
        const safeMessages = messages.map(msg => ({ ...msg, images: undefined }));
        store.put(safeMessages, HISTORY_KEY);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
        });
    } catch (e) {
        console.warn('[Storage] Failed to save to IndexedDB:', e);
    }
}

/**
 * Load chat messages from IndexedDB.
 * On first load, automatically migrates any existing localStorage data.
 */
export async function loadChatHistory(): Promise<Message[]> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(HISTORY_KEY);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                db.close();
                const data = request.result as Message[] | undefined;

                if (data && data.length > 0) {
                    resolve(data);
                    return;
                }

                // No IndexedDB data — attempt migration from localStorage
                const migrated = migrateFromLocalStorage();
                if (migrated.length > 0) {
                    // Save migrated data to IndexedDB asynchronously, then resolve
                    saveChatHistory(migrated).catch(() => { /* best effort */ });
                }
                resolve(migrated);
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch (e) {
        console.warn('[Storage] IndexedDB load failed, falling back to localStorage:', e);
        return migrateFromLocalStorage();
    }
}

/**
 * Clear chat history from IndexedDB (and clean up any legacy localStorage data).
 */
export async function clearChatHistory(): Promise<void> {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(HISTORY_KEY);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                db.close();
                // Also clean up legacy localStorage if present
                try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (_) { /* noop */ }
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
        });
    } catch (e) {
        console.warn('[Storage] Failed to clear IndexedDB:', e);
        // Fallback: try to clear localStorage at least
        try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch (_) { /* noop */ }
    }
}

/**
 * Migrate data from legacy localStorage to the new system.
 * Returns the parsed messages (or empty array if none found).
 * Cleans up localStorage after successful read.
 */
function migrateFromLocalStorage(): Message[] {
    try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw) as Message[];
        // Clean up legacy storage after successful migration read
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        console.log(`[Storage] Migrated ${parsed.length} messages from localStorage to IndexedDB`);
        return parsed;
    } catch (e) {
        console.warn('[Storage] localStorage migration failed:', e);
        return [];
    }
}

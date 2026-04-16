// src/services/offlineQueue.js

import { openDB } from "idb";
import { createIncident } from "./incidentService";

const DB_NAME = "crisis-db";
const STORE_NAME = "incident-queue";

/**
 * Initialize IndexedDB
 */
async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });
      }
    }
  });
}

/**
 * Add incident to offline queue
 */
export async function addToQueue(data) {
  try {
    const db = await initDB();

    await db.add(STORE_NAME, {
      ...data,
      timestamp: Date.now()
    });

    console.log("[OfflineQueue] Added to queue");
  } catch (err) {
    console.error("[OfflineQueue] Add error:", err);
  }
}

/**
 * Sync queued incidents when back online
 */
export async function syncQueue(onProgress) {
  try {
    const db = await initDB();
    const allItems = await db.getAll(STORE_NAME);

    if (!allItems.length) {
      return { total: 0, synced: 0 };
    }

    let synced = 0;

    for (let item of allItems) {
      try {
        await createIncident({
          type: item.type,
          location: item.location,
          mode: "offline"
        });

        synced++;

        // 🔄 progress callback
        if (onProgress) {
          onProgress({
            total: allItems.length,
            synced
          });
        }

      } catch (err) {
        console.error("[OfflineQueue] Sync failed for item:", item);
      }
    }

    // Clear queue after sync
    await db.clear(STORE_NAME);

    console.log("[OfflineQueue] Sync complete");

    return {
      total: allItems.length,
      synced
    };

  } catch (err) {
    console.error("[OfflineQueue] Sync error:", err);
    return { total: 0, synced: 0 };
  }
}

/**
 * Register network listeners
 * (Compatible with your existing App.jsx)
 */
export function registerNetworkListeners(onStatusChange, onProgress) {

  const handleOnline = async () => {
    onStatusChange({ online: true });

    const result = await syncQueue(onProgress);

    return result;
  };

  const handleOffline = () => {
    onStatusChange({ online: false });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Initial trigger
  onStatusChange({ online: navigator.onLine });

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
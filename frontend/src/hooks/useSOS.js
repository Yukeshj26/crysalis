// src/hooks/useSOS.js

import { useState, useCallback } from 'react';
import { createIncident } from '../services/incidentService';
import { addToQueue } from '../services/offlineQueue';
import { LORA_GATEWAY_URL } from '../utils/constants';

export function useSOS() {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const sendSOS = useCallback(async (type, location, options = {}) => {
    const { forceLoRa = false } = options;
    setSending(true);

    let result;

    try {
      const isOnline = navigator.onLine;

      // ── ONLINE MODE ─────────────────────────
      if (isOnline && !forceLoRa) {
        try {
          const id = await createIncident({
            type,
            location,
            mode: 'online',
          });

          result = { success: true, mode: 'online', id };
          console.log('[useSOS] Sent via Firebase');

        } catch (err) {
          console.warn('[useSOS] Firebase failed → LoRa fallback');
          result = await sendViaLoRa(type, location);
        }

      // ── FORCE LORA MODE ─────────────────────
      } else if (forceLoRa) {
        result = await sendViaLoRa(type, location);

      // ── OFFLINE MODE ────────────────────────
      } else {
        await addToQueue({ type, location, mode: 'offline' });

        result = {
          success: true,
          mode: 'offline',
          id: `offline_${Date.now()}`
        };

        console.log('[useSOS] Queued offline');
      }

    } catch (err) {
      console.error('[useSOS] All methods failed:', err);

      // Final fallback → queue
      try {
        await addToQueue({ type, location, mode: 'offline' });

        result = {
          success: true,
          mode: 'offline',
          id: `offline_${Date.now()}`
        };

      } catch {
        result = {
          success: false,
          mode: 'error',
          error: err.message
        };
      }
    }

    setLastResult(result);
    setSending(false);

    return result;
  }, []);

  return { sendSOS, sending, lastResult };
}

// ─────────────────────────────────────────────
// LoRa Gateway Relay
// ─────────────────────────────────────────────

async function sendViaLoRa(type, location) {
  try {
    const res = await fetch(`${LORA_GATEWAY_URL}/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        location,
        mode: 'lora',
        timestamp: Date.now(),
      }),
    });

    if (!res.ok) throw new Error(`LoRa error: ${res.status}`);

    const data = await res.json();

    console.log('[useSOS] Sent via LoRa:', data);

    return {
      success: true,
      mode: 'lora',
      id: data.incidentId,
    };

  } catch (err) {
    console.warn('[useSOS] LoRa failed → queue');

    await addToQueue({
      type,
      location,
      mode: 'lora_fallback',
    });

    return {
      success: true,
      mode: 'offline',
      id: `offline_${Date.now()}`,
    };
  }
}
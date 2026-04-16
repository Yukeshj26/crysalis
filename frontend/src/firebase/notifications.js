// src/firebase/notifications.js
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { messaging } from './firebase';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

/**
 * Request notification permission and get FCM token.
 * Returns the token string, or null if unsupported/denied.
 */
export async function initNotifications() {
  try {
    const supported = await isSupported();
    if (!supported || !messaging) {
      console.warn('[FCM] Not supported in this environment.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      console.log('[FCM] Token:', token);
      // In production: save token to Firestore for targeting specific staff
      return token;
    } else {
      console.warn('[FCM] No token received. Check VAPID key.');
      return null;
    }
  } catch (err) {
    console.error('[FCM] initNotifications error:', err);
    return null;
  }
}

/**
 * Listen for foreground (in-app) FCM messages.
 * Calls onMessageCallback({ title, body, data }) when a message arrives.
 */
export function listenForegroundMessages(onMessageCallback) {
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);
    const title = payload.notification?.title || 'RESPOND Alert';
    const body  = payload.notification?.body  || 'New incident reported.';
    const data  = payload.data || {};
    onMessageCallback({ title, body, data });
  });

  return unsubscribe; // call this to stop listening
}

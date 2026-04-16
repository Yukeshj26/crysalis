// public/firebase-messaging-sw.js
// FCM Background Message Handler

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Must match your firebase.js config
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "your_api_key",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "your_project.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "your_project_id",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "your_project.appspot.com",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "your_sender_id",
  appId: self.FIREBASE_APP_ID || "your_app_id"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || 'RESPOND Alert';
  const notificationOptions = {
    body: body || 'New emergency incident reported.',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.incidentId || 'respond-alert',
    vibrate: [200, 100, 200, 100, 400],
    data: payload.data || {},
    actions: [
      { action: 'view', title: 'View Incident' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

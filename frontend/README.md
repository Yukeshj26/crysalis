# 🚨 RESPOND — Crisis Response System

A mobile-first PWA for real-time emergency coordination, built for hackathon teams.

## Stack
| Layer | Tech |
|---|---|
| Frontend | React.js + CSS (mobile-first PWA) |
| Database | Firebase Firestore (real-time + offline) |
| Notifications | Firebase Cloud Messaging (FCM) |
| Offline | localStorage queue + Firestore IndexedDB persistence |
| LoRa Sim | Node.js + Express gateway |
| Maps | Google Maps API + Places |

---

## Quick Start

### 1. Frontend (React PWA)

```bash
# Install deps
npm install

# Copy env and fill in your keys
cp .env .env.local
# Edit .env.local with your Firebase + Google Maps keys

# Start dev server
npm start
```

### 2. LoRa Gateway (Node.js)

```bash
cd lora-gateway
npm install

# Add your Firebase service account key
# Download from: Firebase Console → Project Settings → Service Accounts
cp serviceAccount.json.example serviceAccount.json  # add your key file

npm start
# Gateway runs on http://localhost:3001
```

### 3. Run API Tests

```bash
# With gateway running:
node tests/api.test.js
```

---

## Firebase Setup

### Firestore Collections

**`incidents`**
```json
{
  "id": "auto",
  "type": "fire | medical | security",
  "location": "Room 204",
  "status": "active | assigned | in_progress | resolved",
  "assignedTo": null,
  "timestamp": 1700000000000,
  "mode": "online | offline | lora"
}
```

**`staff`**
```json
{
  "id": "staff_01",
  "name": "John",
  "floor": "2",
  "available": true
}
```

### Firestore Rules (for dev)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // CHANGE FOR PRODUCTION
    }
  }
}
```

### Seed Staff Data

In the browser console (once Firebase is connected):

```js
import { seedStaff } from './src/services/incidentService';
seedStaff();
```

---

## Architecture

```
User (Mobile PWA)
      │
      ├── Online?  ──→ Firebase Firestore ──→ onSnapshot ──→ Staff Dashboard
      │
      ├── Offline? ──→ localStorage Queue ──→ (reconnect) ──→ Firebase
      │
      └── LoRa?    ──→ localhost:3001/send ──→ Firebase ──→ Staff Dashboard
```

## Core Flow

1. User presses SOS → selects type + location
2. **Online** → `createIncident()` → Firestore → auto-assign staff
3. **Offline** → `enqueue()` → localStorage → auto-sync on reconnect
4. **LoRa** → POST to gateway → gateway writes to Firestore
5. Staff sees real-time updates via `onSnapshot` listener
6. Staff advances status: `active → assigned → in_progress → resolved`
7. Resolved incidents free up assigned staff

---

## Team Roles

| Person | File(s) |
|---|---|
| SOS UI | `src/screens/SOSScreen.jsx` |
| Backend/Firestore | `src/services/incidentService.js` |
| Offline Queue | `src/services/offlineQueue.js` |
| LoRa Gateway | `lora-gateway/server.js` |
| Maps | `src/screens/NearbyServices.jsx` |
| Notifications | `src/firebase/notifications.js` |

---

## Environment Variables

### Frontend (`.env`)
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_VAPID_KEY=
REACT_APP_GOOGLE_MAPS_API_KEY=
REACT_APP_LORA_GATEWAY_URL=http://localhost:3001
```

### Gateway (`lora-gateway/.env`)
```
PORT=3001
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json
```

---

## LoRa Gateway API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/send` | Relay LoRa incident to Firestore |
| `GET` | `/status` | Health check |
| `GET` | `/incidents` | List (simulation mode only) |

**POST `/send` body:**
```json
{
  "type": "fire",
  "location": "Room 204",
  "mode": "lora",
  "timestamp": 1700000000000
}
```

---

## PWA Features

- Installable (manifest.json)
- Offline Firestore persistence (IndexedDB)
- Background FCM notifications (service worker)
- Auto-sync queue on reconnect
- Mobile viewport, no zoom, safe-area insets

---

## Demo Script (Hackathon)

1. Open app on mobile → show SOS screen
2. Send a **Fire** SOS from "Room 204" (online) → watch dashboard update live
3. Toggle airplane mode → send **Medical** SOS → show offline queue badge
4. Re-enable network → show auto-sync
5. Send via LoRa toggle → show gateway relay
6. Open dashboard → advance status through all stages
7. Show Nearby Services map with hospitals/police

---

*Built for hackathon by Team RESPOND 🚨*

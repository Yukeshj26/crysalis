// src/services/incidentService.js

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';

import { db } from '../firebase/firebase';

const INCIDENTS_COL = 'incidents';
const STAFF_COL     = 'staff';

// ─────────────────────────────────────────────
// INCIDENT CRUD
// ─────────────────────────────────────────────

export async function createIncident({ type, location, mode = 'online' }) {
  const incident = {
    type,
    location,
    status:     'active',
    assignedTo: null,
    timestamp:  Date.now(),
    mode,
  };

  const docRef = await addDoc(collection(db, INCIDENTS_COL), incident);

  console.log('[incidentService] Created:', docRef.id);

  // ❌ REMOVED autoAssignStaff (handled by backend)

  return docRef.id;
}

export async function updateIncidentStatus(incidentId, status) {
  const ref = doc(db, INCIDENTS_COL, incidentId);
  await updateDoc(ref, { status });

  console.log(`[incidentService] ${incidentId} → ${status}`);
}

export async function resolveIncident(incidentId, staffId) {
  const incidentRef = doc(db, INCIDENTS_COL, incidentId);

  await updateDoc(incidentRef, { status: 'resolved' });

  // Backend function will free staff automatically
}

// ─────────────────────────────────────────────
// REAL-TIME LISTENERS (KEEP THIS — VERY GOOD)
// ─────────────────────────────────────────────

export function subscribeToIncidents(callback) {
  const q = query(
    collection(db, INCIDENTS_COL),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const incidents = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    callback(incidents);
  });
}

export function subscribeToActiveIncidents(callback) {
  const q = query(
    collection(db, INCIDENTS_COL),
    where('status', '!=', 'resolved'),
    orderBy('status'),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const incidents = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    callback(incidents);
  });
}

export function subscribeToIncident(incidentId, callback) {
  return onSnapshot(doc(db, INCIDENTS_COL, incidentId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
}

export function subscribeToStaff(callback) {
  return onSnapshot(collection(db, STAFF_COL), (snap) => {
    const staff = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    callback(staff);
  });
}

// ─────────────────────────────────────────────
// SEED DATA (KEEP THIS — GOOD FOR DEMO)
// ─────────────────────────────────────────────

export async function seedStaff() {
  const staffData = [
    { id: 'staff_01', name: 'John',  floor: '2', available: true },
    { id: 'staff_02', name: 'Maria', floor: '3', available: true },
    { id: 'staff_03', name: 'Ravi',  floor: '1', available: true },
    { id: 'staff_04', name: 'Priya', floor: '4', available: true },
  ];

  for (const staff of staffData) {
    const { id, ...data } = staff;

    const ref = doc(db, STAFF_COL, id);

    try {
      await updateDoc(ref, data);
    } catch {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, data);
    }
  }

  console.log('[seedStaff] Done');
}
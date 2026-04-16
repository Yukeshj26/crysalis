// src/services/sosService.js

import { createIncident } from "./incidentService";
import { sendViaLora } from "./loraClient";
import { addToQueue } from "./offlineQueue";

export const triggerSOS = async ({ type, location }) => {
  const data = { type, location };

  // ✅ ONLINE
  if (navigator.onLine) {
    try {
      await createIncident({ ...data, mode: "online" });
      console.log("[SOS] Sent via Firebase");
    } catch (err) {
      console.warn("[SOS] Firebase failed, fallback to LoRa");
      await sendViaLora(data);
    }
  }

  // ❌ OFFLINE
  else {
    console.warn("[SOS] Offline → queued");
    await addToQueue(data);
  }
};
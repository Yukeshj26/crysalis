// src/services/loraClient.js

import axios from "axios";

const LORA_URL = "http://localhost:5000/incident";

export const sendViaLora = async ({ type, location }) => {
  await axios.post(LORA_URL, {
    type,
    location
  });

  console.log("[LoRa] Sent");
};
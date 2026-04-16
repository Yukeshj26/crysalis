// src/screens/SOSScreen.jsx

import React, { useState, useRef } from 'react';
import { useSOS } from '../hooks/useSOS';
import { SOS_TYPES, MODE_CONFIG } from '../utils/constants';

const LOCATIONS = [
  'Room 101', 'Room 202', 'Room 204', 'Room 305', 'Room 410',
  'Lobby', 'Cafeteria', 'Parking Lot', 'Stairwell A', 'Stairwell B',
  'Roof', 'Basement', 'Server Room', 'Conference Hall',
];

export default function SOSScreen({ isOnline, showToast }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [loraMode, setLoraMode] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  const holdInterval = useRef(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const HOLD_DURATION = 1500;

  const { sendSOS, sending } = useSOS();

  const location = customLocation.trim() || selectedLocation;

  // ── HOLD LOGIC (FIXED: no memory leak) ─────────────────────
  const startHold = () => {
    if (!selectedType || !location || sending) return;

    setHoldProgress(0);
    const startTime = Date.now();

    clearInterval(holdInterval.current);

    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);

      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdInterval.current);
        triggerSOS();
      }
    }, 30);
  };

  const cancelHold = () => {
    clearInterval(holdInterval.current);
    setHoldProgress(0);
  };

  // ── TRIGGER SOS (FIXED FLOW) ───────────────────────────────
  const triggerSOS = async () => {
    setHoldProgress(0);

    const result = await sendSOS(selectedType, location, {
      forceLoRa: loraMode, // ✅ critical
    });

    if (result.success) {
      const modeInfo = MODE_CONFIG[result.mode] || MODE_CONFIG.online;

      showToast(`SOS sent via ${modeInfo.label}`, 'success');

      setLastSent({
        ...result,
        type: selectedType,
        location,
        sentAt: Date.now(),
      });

      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 4000);
    } else {
      showToast('Failed to send SOS. Try again.', 'error');
    }
  };

  const typeInfo = selectedType ? SOS_TYPES[selectedType] : null;
  const canSend = !!selectedType && !!location && !sending;

  return (
    <div style={{
      padding: '24px 20px',
      paddingBottom: 'calc(var(--nav-height) + 24px)',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      animation: 'fade-in 0.4s ease',
    }}>

      {/* Header */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
          marginBottom: '4px',
        }}>
          <h1 style={{ fontSize: '28px' }}>RESPOND</h1>

          <span style={{
            fontSize: '11px',
            color: isOnline ? '#00ff88' : '#ffc300',
          }}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* TYPE */}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {Object.entries(SOS_TYPES).map(([key, info]) => {
            const isSelected = selectedType === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(isSelected ? null : key)}
                style={{
                  border: isSelected ? `2px solid ${info.color}` : '1px solid gray',
                  padding: 16,
                }}
              >
                {info.emoji}
                <div>{info.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LOCATION */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setSelectedLocation(loc);
                setCustomLocation('');
              }}
            >
              {loc}
            </button>
          ))}
        </div>

        <input
          value={customLocation}
          onChange={(e) => {
            setCustomLocation(e.target.value);
            setSelectedLocation('');
          }}
          placeholder="Custom location"
        />
      </div>

      {/* LORA */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={loraMode}
            onChange={() => setLoraMode(!loraMode)}
          />
          LoRa Mode
        </label>
      </div>

      {/* SOS BUTTON */}
      <div>
        <button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          disabled={!canSend}
        >
          {sending
            ? 'Sending...'
            : holdProgress > 0
              ? `${Math.round(holdProgress)}%`
              : 'HOLD'}
        </button>
      </div>

      {/* STATUS */}
      {confirmed && <p>✅ SOS Sent</p>}

      {/* LAST SENT */}
      {lastSent && (
        <div>
          <p>{lastSent.type} — {lastSent.location}</p>
          <p>{lastSent.mode}</p>
        </div>
      )}
    </div>
  );
}
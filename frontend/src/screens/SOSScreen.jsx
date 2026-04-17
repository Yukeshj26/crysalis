// src/screens/SOSScreen.jsx

import React, { useState, useRef } from 'react';
import { useSOS } from '../hooks/useSOS';
import { SOS_TYPES, MODE_CONFIG } from '../utils/constants';

const LOCATIONS = [
  'Room 101', 'Room 202', 'Room 204', 'Room 305', 'Room 410',
  'Lobby', 'Cafeteria', 'Parking Lot', 'Stairwell A', 'Stairwell B',
  'Roof', 'Basement', 'Server Room', 'Conference Hall',
];

// Group locations in rows of 3 for the box layout
const LOCATION_ROWS = [];
for (let i = 0; i < LOCATIONS.length; i += 3) {
  LOCATION_ROWS.push(LOCATIONS.slice(i, i + 3));
}

export default function SOSScreen({ isOnline, showToast }) {
  const [selectedType, setSelectedType]       = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocation, setCustomLocation]   = useState('');
  const [loraMode, setLoraMode]               = useState(false);
  const [confirmed, setConfirmed]             = useState(false);
  const [lastSent, setLastSent]               = useState(null);

  const holdInterval   = useRef(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const HOLD_DURATION  = 1500;

  const { sendSOS, sending } = useSOS();

  const location = customLocation.trim() || selectedLocation;

  const startHold = () => {
    if (!selectedType || !location || sending) return;
    setHoldProgress(0);
    const startTime = Date.now();
    clearInterval(holdInterval.current);
    holdInterval.current = setInterval(() => {
      const elapsed  = Date.now() - startTime;
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

  const triggerSOS = async () => {
    setHoldProgress(0);
    const result = await sendSOS(selectedType, location, { forceLoRa: loraMode });
    if (result.success) {
      const modeInfo = MODE_CONFIG[result.mode] || MODE_CONFIG.online;
      showToast(`SOS sent via ${modeInfo.label}`, 'success');
      window.dispatchEvent(new CustomEvent('sos:triggered', { detail: { type: selectedType } }));
      setLastSent({ ...result, type: selectedType, location, sentAt: Date.now() });
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 4000);
    } else {
      showToast('Failed to send SOS. Try again.', 'error');
    }
  };

  const typeInfo = selectedType ? SOS_TYPES[selectedType] : null;
  const canSend  = !!selectedType && !!location && !sending;

  // Progress circle params
  const R  = 68;
  const C  = 2 * Math.PI * R;
  const strokeDash = C - (holdProgress / 100) * C;

  return (
    <div style={{
      padding: '32px 32px',
      paddingBottom: '40px',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      animation: 'fade-in 0.4s ease',
      maxWidth: '680px',
    }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '32px', letterSpacing: '-0.02em' }}>RESPOND</h1>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: isOnline ? '#00e87a' : '#ffc300',
            background: isOnline ? 'rgba(0,232,122,0.08)' : 'rgba(255,195,0,0.08)',
            border: `1px solid ${isOnline ? 'rgba(0,232,122,0.2)' : 'rgba(255,195,0,0.2)'}`,
            padding: '3px 8px',
            borderRadius: '4px',
          }}>
            {isOnline ? '● ONLINE' : '◌ OFFLINE'}
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
          Emergency crisis response system
        </p>
      </div>

      {/* ── INCIDENT TYPE ── */}
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          01 — SELECT INCIDENT TYPE
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
          {Object.entries(SOS_TYPES).map(([key, info]) => {
            const isSelected = selectedType === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(isSelected ? null : key)}
                style={{
                  background: isSelected ? `${info.color}10` : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? info.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 12px',
                  transition: '0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${info.color}, transparent)`,
                  }} />
                )}
                <div style={{ fontSize: '28px', lineHeight: 1 }}>{info.emoji}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.1em',
                  color: isSelected ? info.color : 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  {info.label.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LOCATION GRID ── */}
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          02 — YOUR LOCATION
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {LOCATION_ROWS.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {row.map((loc) => {
                const isSel = selectedLocation === loc;
                return (
                  <button
                    key={loc}
                    onClick={() => { setSelectedLocation(isSel ? '' : loc); setCustomLocation(''); }}
                    style={{
                      background: isSel ? 'rgba(0,194,255,0.08)' : 'var(--bg-surface)',
                      border: `1px solid ${isSel ? 'rgba(0,194,255,0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: isSel ? '#00c2ff' : 'var(--text-secondary)',
                      letterSpacing: '0.04em',
                      transition: '0.15s',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <input
          value={customLocation}
          onChange={(e) => { setCustomLocation(e.target.value); setSelectedLocation(''); }}
          placeholder="Custom location..."
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            outline: 'none',
            transition: '0.2s',
          }}
        />
      </div>

      {/* ── LORA TOGGLE ── */}
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          03 — TRANSMISSION MODE
        </p>
        <button
          onClick={() => setLoraMode(!loraMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: loraMode ? 'rgba(192,132,252,0.06)' : 'var(--bg-surface)',
            border: `1px solid ${loraMode ? 'rgba(192,132,252,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px 18px',
            width: '100%',
            transition: '0.2s',
          }}
        >
          {/* LoRa antenna icon */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: loraMode ? 'rgba(192,132,252,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${loraMode ? 'rgba(192,132,252,0.4)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}>
            {loraMode && (
              <>
                <span style={{
                  position: 'absolute', inset: '-6px',
                  border: '1px solid rgba(192,132,252,0.25)',
                  borderRadius: '50%',
                  animation: 'sos-hold-ring 1.5s ease-out infinite',
                }} />
                <span style={{
                  position: 'absolute', inset: '-12px',
                  border: '1px solid rgba(192,132,252,0.12)',
                  borderRadius: '50%',
                  animation: 'sos-hold-ring 1.5s ease-out infinite 0.5s',
                }} />
              </>
            )}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={loraMode ? '#c084fc' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <circle cx="12" cy="20" r="1" fill={loraMode ? '#c084fc' : 'var(--text-muted)'}/>
            </svg>
          </div>

          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: loraMode ? '#c084fc' : 'var(--text-secondary)',
              marginBottom: '3px',
            }}>
              LoRa Radio
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {loraMode ? 'Offline radio mode active — bypasses internet' : 'Use offline radio mesh for backup transmission'}
            </div>
          </div>

          {/* Toggle pill */}
          <div style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            background: loraMode ? 'rgba(192,132,252,0.3)' : 'var(--bg-raised)',
            border: `1px solid ${loraMode ? '#c084fc' : 'var(--border)'}`,
            position: 'relative',
            transition: '0.25s',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute',
              top: '3px',
              left: loraMode ? '23px' : '3px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: loraMode ? '#c084fc' : 'var(--text-muted)',
              transition: '0.25s',
              boxShadow: loraMode ? '0 0 8px #c084fc' : 'none',
            }} />
          </div>
        </button>
      </div>

      {/* ── SOS BUTTON ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Outer ambient rings — always visible when active */}
          {canSend && (
            <>
              <div style={{
                position: 'absolute',
                width: '200px', height: '200px',
                borderRadius: '50%',
                border: '1px solid rgba(255,69,0,0.12)',
                animation: 'sos-hold-ring 3s ease-out infinite',
              }} />
              <div style={{
                position: 'absolute',
                width: '200px', height: '200px',
                borderRadius: '50%',
                border: '1px solid rgba(255,69,0,0.08)',
                animation: 'sos-hold-ring 3s ease-out infinite 1s',
              }} />
            </>
          )}

          {/* SVG progress ring */}
          <svg
            width="180" height="180"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-90deg)' }}
          >
            {/* Track */}
            <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,69,0,0.08)" strokeWidth="3"/>
            {/* Progress */}
            {holdProgress > 0 && (
              <circle
                cx="90" cy="90" r={R}
                fill="none"
                stroke="#ff4500"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={strokeDash}
                style={{ transition: 'stroke-dashoffset 0.03s linear', filter: 'drop-shadow(0 0 6px #ff4500)' }}
              />
            )}
          </svg>

          {/* The button itself */}
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            disabled={!canSend}
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: canSend
                ? `radial-gradient(circle at 40% 35%, #ff6633, #cc2200)`
                : 'var(--bg-raised)',
              border: `2px solid ${canSend ? 'rgba(255,69,0,0.5)' : 'var(--border)'}`,
              color: canSend ? '#fff' : 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              position: 'relative',
              zIndex: 1,
              boxShadow: canSend
                ? `0 0 40px rgba(255,69,0,0.35), 0 0 80px rgba(255,69,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)`
                : 'none',
              animation: canSend && holdProgress === 0 ? 'glow-fire 3s ease infinite' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {sending ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={canSend ? 'white' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: holdProgress > 0 ? '16px' : '11px',
                  fontWeight: 700,
                  letterSpacing: holdProgress > 0 ? '0' : '0.12em',
                  color: canSend ? 'white' : 'var(--text-muted)',
                }}>
                  {holdProgress > 0 ? `${Math.round(holdProgress)}%` : 'SOS'}
                </span>
              </>
            )}
          </button>
        </div>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: canSend ? 'var(--text-secondary)' : 'var(--text-muted)',
          letterSpacing: '0.08em',
          textAlign: 'center',
        }}>
          {!selectedType
            ? 'Select incident type to enable'
            : !location
              ? 'Select a location to enable'
              : sending
                ? 'Sending alert...'
                : holdProgress > 0
                  ? 'Keep holding...'
                  : 'Hold to send SOS'}
        </p>
      </div>

      {/* ── CONFIRMATION ── */}
      {confirmed && (
        <div style={{
          background: 'rgba(0,232,122,0.06)',
          border: '1px solid rgba(0,232,122,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slide-up 0.3s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#00e87a', fontWeight: 600 }}>
            SOS alert dispatched successfully
          </span>
        </div>
      )}

      {/* ── LAST SENT ── */}
      {lastSent && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>{SOS_TYPES[lastSent.type]?.emoji}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {lastSent.type} — {lastSent.location}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {new Date(lastSent.sentAt).toLocaleTimeString()} · {lastSent.mode}
              </p>
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: '#00e87a',
            background: 'rgba(0,232,122,0.08)',
            border: '1px solid rgba(0,232,122,0.2)',
            padding: '4px 8px',
            borderRadius: '4px',
            letterSpacing: '0.08em',
          }}>SENT</span>
        </div>
      )}
    </div>
  );
}
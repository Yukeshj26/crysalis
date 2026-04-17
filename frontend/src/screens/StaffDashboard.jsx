// src/screens/StaffDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  subscribeToIncidents,
  subscribeToStaff,
  updateIncidentStatus,
  resolveIncident,
} from '../services/incidentService';
import { SOS_TYPES, STATUS_CONFIG, MODE_CONFIG } from '../utils/constants';

const STATUS_ORDER = { active: 0, assigned: 1, in_progress: 2, resolved: 3 };

export default function StaffDashboard({ showToast }) {
  const [incidents, setIncidents] = useState([]);
  const [staff,     setStaff]     = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsubIncidents = subscribeToIncidents((data) => { setIncidents(data); setLoading(false); });
    const unsubStaff = subscribeToStaff(setStaff);
    return () => { unsubIncidents(); unsubStaff(); };
  }, []);

  const handleStatusUpdate = async (incident, nextStatus) => {
    try {
      if (nextStatus === 'resolved') {
        await resolveIncident(incident.id, incident.assignedTo);
        showToast(`Incident resolved ✓`, 'success');
      } else {
        await updateIncidentStatus(incident.id, nextStatus);
        showToast(`Status → ${nextStatus}`, 'info');
      }
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const filtered = incidents
    .filter((i) => filter === 'all' || i.status === filter)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.timestamp - a.timestamp);

  const counts = {
    active:      incidents.filter((i) => i.status === 'active').length,
    assigned:    incidents.filter((i) => i.status === 'assigned').length,
    in_progress: incidents.filter((i) => i.status === 'in_progress').length,
    resolved:    incidents.filter((i) => i.status === 'resolved').length,
  };

  const availableStaff = staff.filter((s) => s.available).length;

  return (
    <div style={{
      padding: '32px',
      paddingBottom: '40px',
      minHeight: '100dvh',
      animation: 'fade-in 0.4s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
    }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '6px' }}>
            COMMAND CENTER
          </p>
          <h1 style={{ fontSize: '30px', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Staff Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            Real-time incident coordination
          </p>
        </div>
        {/* Live pulse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff4500', animation: 'pulse-dot 1.5s ease infinite', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {[
          { label: 'Active',      value: counts.active,      color: '#ff4500', bg: 'rgba(255,69,0,0.06)',   border: 'rgba(255,69,0,0.2)' },
          { label: 'Assigned',   value: counts.assigned,    color: '#ffc300', bg: 'rgba(255,195,0,0.06)',  border: 'rgba(255,195,0,0.2)' },
          { label: 'In Progress',value: counts.in_progress, color: '#00c2ff', bg: 'rgba(0,194,255,0.06)',  border: 'rgba(0,194,255,0.2)' },
          { label: 'Staff Ready',value: availableStaff,     color: '#00e87a', bg: 'rgba(0,232,122,0.06)',  border: 'rgba(0,232,122,0.2)' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: stat.bg,
            border: `1px solid ${stat.border}`,
            borderRadius: 'var(--radius-md)',
            padding: '18px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)`,
            }} />
            <p style={{ fontSize: '34px', fontWeight: 800, color: stat.color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '6px' }}>
              {stat.value}
            </p>
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {stat.label.toUpperCase()}
            </p>
          </div>
        ))}
      </div>

      {/* ── STAFF GRID ── */}
      <div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '12px' }}>
          STAFF AVAILABILITY
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {staff.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No staff data</p>
          ) : staff.map((s) => (
            <div key={s.id} style={{
              background: s.available ? 'rgba(0,232,122,0.06)' : 'rgba(255,69,0,0.06)',
              border: `1px solid ${s.available ? 'rgba(0,232,122,0.2)' : 'rgba(255,69,0,0.15)'}`,
              borderRadius: 'var(--radius-full)',
              padding: '7px 14px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: s.available ? '#00e87a' : '#ff4500',
                flexShrink: 0,
                animation: s.available ? 'none' : 'pulse-dot 1.5s ease infinite',
              }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{s.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>F{s.floor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['all', 'active', 'assigned', 'in_progress', 'resolved'].map((f) => {
          const isActive = filter === f;
          const cfg = STATUS_CONFIG[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: isActive ? (cfg?.color ? `${cfg.color}18` : 'rgba(255,255,255,0.08)') : 'var(--bg-surface)',
                border: `1px solid ${isActive ? (cfg?.color || 'var(--border-active)') : 'var(--border)'}`,
                borderRadius: 'var(--radius-full)',
                padding: '7px 16px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: isActive ? (cfg?.color || 'var(--text-primary)') : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                letterSpacing: '0.06em',
              }}
            >
              {f === 'all' ? `ALL · ${incidents.length}` : `${f.replace('_', ' ').toUpperCase()}${counts[f] > 0 ? ` · ${counts[f]}` : ''}`}
            </button>
          );
        })}
      </div>

      {/* ── INCIDENT LIST ── */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              staff={staff}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident, staff, onStatusUpdate }) {
  const typeInfo      = SOS_TYPES[incident.type]   || { emoji: '❓', label: 'Unknown', color: '#888', bg: '#111' };
  const statusInfo    = STATUS_CONFIG[incident.status] || STATUS_CONFIG.active;
  const modeInfo      = MODE_CONFIG[incident.mode]   || MODE_CONFIG.online;
  const assignedStaff = staff.find((s) => s.id === incident.assignedTo);

  const nextStatuses = ({
    active:      ['assigned', 'in_progress'],
    assigned:    ['in_progress'],
    in_progress: ['resolved'],
    resolved:    [],
  })[incident.status] || [];

  const age    = Math.floor((Date.now() - incident.timestamp) / 1000);
  const ageStr = age < 60 ? `${age}s` : age < 3600 ? `${Math.floor(age / 60)}m` : `${Math.floor(age / 3600)}h`;

  const isActive = incident.status === 'active';

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${isActive ? `${typeInfo.color}30` : 'var(--border)'}`,
      borderLeft: `2px solid ${typeInfo.color}`,
      borderRadius: 'var(--radius-md)',
      padding: '16px 18px',
      animation: 'slide-up 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top glow for active */}
      {isActive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: `linear-gradient(90deg, transparent, ${typeInfo.color}60, transparent)`,
        }} />
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: `${typeInfo.color}10`,
            border: `1px solid ${typeInfo.color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>
            {typeInfo.emoji}
          </div>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '3px', color: 'var(--text-primary)' }}>
              {typeInfo.label}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2"/></svg>
              {incident.location}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
            color: statusInfo.color,
            background: `${statusInfo.color}12`,
            border: `1px solid ${statusInfo.color}28`,
            padding: '3px 9px', borderRadius: '4px',
            letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {statusInfo.pulse && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusInfo.color, display: 'inline-block', animation: 'pulse-dot 1.5s ease infinite' }} />}
            {incident.status.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
            {ageStr} ago · #{incident.id.slice(-5)}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: nextStatuses.length ? '14px' : '0', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: modeInfo.color, background: `${modeInfo.color}10`,
          border: `1px solid ${modeInfo.color}22`,
          padding: '3px 8px', borderRadius: '4px',
        }}>
          {modeInfo.icon} {modeInfo.label}
        </span>
        {assignedStaff && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: '#00e87a', background: 'rgba(0,232,122,0.06)',
            border: '1px solid rgba(0,232,122,0.18)',
            padding: '3px 8px', borderRadius: '4px',
          }}>
            ↗ {assignedStaff.name}
          </span>
        )}
      </div>

      {/* Actions */}
      {nextStatuses.length > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {nextStatuses.map((nextStatus) => {
            const nextCfg   = STATUS_CONFIG[nextStatus];
            const isResolve = nextStatus === 'resolved';
            return (
              <button
                key={nextStatus}
                onClick={() => onStatusUpdate(incident, nextStatus)}
                style={{
                  flex: isResolve ? 1 : 'none',
                  background: isResolve ? `${nextCfg?.color}12` : 'var(--bg-raised)',
                  border: `1px solid ${nextCfg?.color || 'var(--border)'}40`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 16px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: nextCfg?.color || 'var(--text-primary)',
                  letterSpacing: '0.08em',
                  transition: 'all 0.15s ease',
                }}
              >
                → {nextStatus.replace('_', ' ').toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {incident.status === 'resolved' && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#00e87a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e87a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Incident resolved
        </p>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 16px' }}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em' }}>
        LOADING INCIDENTS
      </p>
    </div>
  );
}

function EmptyState({ filter }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px', fontSize: '24px', opacity: 0.5,
      }}>
        {filter === 'resolved' ? '✓' : '◉'}
      </div>
      <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>
        {filter === 'all' ? 'No incidents reported' : `No ${filter.replace('_', ' ')} incidents`}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
        All clear for now
      </p>
    </div>
  );
}
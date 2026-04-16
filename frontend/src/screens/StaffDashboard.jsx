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

  // Subscribe to real-time data
  useEffect(() => {
    const unsubIncidents = subscribeToIncidents((data) => {
      setIncidents(data);
      setLoading(false);
    });
    const unsubStaff = subscribeToStaff(setStaff);
    return () => { unsubIncidents(); unsubStaff(); };
  }, []);

  // ── Handlers ──────────────────────────────
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

  // ── Derived data ───────────────────────────
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
      padding:       '24px 20px',
      paddingBottom: 'calc(var(--nav-height) + 24px)',
      minHeight:     '100dvh',
      animation:     'fade-in 0.4s ease',
    }}>

      {/* Header */}
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', letterSpacing:'-0.02em', marginBottom:'4px' }}>
          Staff Dashboard
        </h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'13px' }}>
          Real-time incident coordination
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(2,1fr)',
        gap:                 '10px',
        marginBottom:        '24px',
      }}>
        {[
          { label:'Active',   value: counts.active,      color:'#ff4500', icon:'🔴' },
          { label:'Assigned', value: counts.assigned,    color:'#ffc300', icon:'🟡' },
          { label:'Progress', value: counts.in_progress, color:'#00c2ff', icon:'🔵' },
          { label:'Available Staff', value: availableStaff, color:'#00ff88', icon:'👤' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding:      '14px 16px',
            display:      'flex',
            justifyContent:'space-between',
            alignItems:   'center',
          }}>
            <div>
              <p style={{ fontSize:'22px', fontWeight:800, color: stat.color, lineHeight:1.1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>
                {stat.label}
              </p>
            </div>
            <span style={{ fontSize:'24px', opacity:0.7 }}>{stat.icon}</span>
          </div>
        ))}
      </div>

      {/* Staff pills */}
      <div style={{ marginBottom:'20px' }}>
        <p style={{
          fontSize:'11px', fontFamily:'var(--font-mono)', color:'var(--text-muted)',
          letterSpacing:'0.12em', marginBottom:'10px',
        }}>
          STAFF AVAILABILITY
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
          {staff.map((s) => (
            <div key={s.id} style={{
              background:   s.available ? 'rgba(0,255,136,0.08)' : 'rgba(255,69,0,0.08)',
              border:       `1px solid ${s.available ? 'rgba(0,255,136,0.25)' : 'rgba(255,69,0,0.25)'}`,
              borderRadius: 'var(--radius-full)',
              padding:      '6px 12px',
              fontSize:     '13px',
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
            }}>
              <span style={{
                width:'7px', height:'7px', borderRadius:'50%',
                background: s.available ? '#00ff88' : '#ff4500',
                flexShrink: 0,
                animation:  s.available ? 'none' : 'pulse-dot 1.5s ease infinite',
              }} />
              <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{s.name}</span>
              <span style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                F{s.floor}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display:       'flex',
        gap:           '6px',
        marginBottom:  '16px',
        overflowX:     'auto',
        paddingBottom: '4px',
      }}>
        {['all', 'active', 'assigned', 'in_progress', 'resolved'].map((f) => {
          const isActive = filter === f;
          const cfg      = STATUS_CONFIG[f];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background:   isActive ? (cfg?.color ? `${cfg.color}22` : 'rgba(255,255,255,0.1)') : 'transparent',
                border:       `1px solid ${isActive ? (cfg?.color || 'var(--border-active)') : 'var(--border)'}`,
                borderRadius: 'var(--radius-full)',
                padding:      '6px 14px',
                fontSize:     '12px',
                fontWeight:   700,
                color:        isActive ? (cfg?.color || 'var(--text-primary)') : 'var(--text-muted)',
                whiteSpace:   'nowrap',
                transition:   'all 0.15s ease',
                letterSpacing:'0.04em',
              }}
            >
              {f === 'all' ? `ALL (${incidents.length})` : f.replace('_', ' ').toUpperCase()}
              {f !== 'all' && counts[f] > 0 && ` · ${counts[f]}`}
            </button>
          );
        })}
      </div>

      {/* Incident list */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
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

// ─────────────────────────────────────────────
// Incident Card
// ─────────────────────────────────────────────
function IncidentCard({ incident, staff, onStatusUpdate }) {
  const typeInfo   = SOS_TYPES[incident.type]   || { emoji:'❓', label:'Unknown', color:'#888', bg:'#111' };
  const statusInfo = STATUS_CONFIG[incident.status] || STATUS_CONFIG.active;
  const modeInfo   = MODE_CONFIG[incident.mode]   || MODE_CONFIG.online;
  const assignedStaff = staff.find((s) => s.id === incident.assignedTo);

  const nextStatuses = {
    active:      ['assigned', 'in_progress'],
    assigned:    ['in_progress'],
    in_progress: ['resolved'],
    resolved:    [],
  }[incident.status] || [];

  const age = Math.floor((Date.now() - incident.timestamp) / 1000);
  const ageStr = age < 60 ? `${age}s ago`
    : age < 3600 ? `${Math.floor(age/60)}m ago`
    : `${Math.floor(age/3600)}h ago`;

  return (
    <div style={{
      background:   'var(--bg-surface)',
      border:       `1px solid ${incident.status === 'active' ? typeInfo.color + '44' : 'var(--border)'}`,
      borderLeft:   `3px solid ${typeInfo.color}`,
      borderRadius: 'var(--radius-md)',
      padding:      '16px',
      animation:    'slide-up 0.3s ease',
      ...(incident.status === 'active' ? {
        boxShadow: `0 0 20px ${typeInfo.color}22`,
      } : {}),
    }}>
      {/* Top row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{
            fontSize:'24px',
            filter: incident.status === 'active' ? `drop-shadow(0 0 6px ${typeInfo.color})` : 'none',
          }}>
            {typeInfo.emoji}
          </span>
          <div>
            <p style={{ fontSize:'16px', fontWeight:800, marginBottom:'2px' }}>
              {typeInfo.label}
            </p>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>
              📍 {incident.location}
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display:      'flex',
          flexDirection:'column',
          alignItems:   'flex-end',
          gap:          '4px',
        }}>
          <span style={{
            fontSize:     '11px',
            fontFamily:   'var(--font-mono)',
            fontWeight:   700,
            color:        statusInfo.color,
            background:   `${statusInfo.color}18`,
            border:       `1px solid ${statusInfo.color}33`,
            padding:      '3px 8px',
            borderRadius: '6px',
            letterSpacing:'0.06em',
            display:      'flex',
            alignItems:   'center',
            gap:          '5px',
          }}>
            {statusInfo.pulse && (
              <span style={{
                width:'5px', height:'5px', borderRadius:'50%',
                background: statusInfo.color,
                display:'inline-block',
                animation: 'pulse-dot 1.5s ease infinite',
              }} />
            )}
            {incident.status.replace('_',' ').toUpperCase()}
          </span>
          <span style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
            {ageStr}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
        <span style={{
          fontSize:'11px', fontFamily:'var(--font-mono)',
          color: modeInfo.color,
          background:`${modeInfo.color}12`,
          border:`1px solid ${modeInfo.color}25`,
          padding:'2px 8px', borderRadius:'4px',
        }}>
          {modeInfo.icon} {modeInfo.label}
        </span>
        {assignedStaff && (
          <span style={{
            fontSize:'11px', fontFamily:'var(--font-mono)',
            color:'#00ff88', background:'rgba(0,255,136,0.08)',
            border:'1px solid rgba(0,255,136,0.2)',
            padding:'2px 8px', borderRadius:'4px',
          }}>
            👤 {assignedStaff.name} (F{assignedStaff.floor})
          </span>
        )}
        <span style={{
          fontSize:'11px', fontFamily:'var(--font-mono)',
          color:'var(--text-muted)',
        }}>
          #{incident.id.slice(-6)}
        </span>
      </div>

      {/* Action buttons */}
      {nextStatuses.length > 0 && (
        <div style={{ display:'flex', gap:'8px' }}>
          {nextStatuses.map((nextStatus) => {
            const nextCfg = STATUS_CONFIG[nextStatus];
            const isResolve = nextStatus === 'resolved';
            return (
              <button
                key={nextStatus}
                onClick={() => onStatusUpdate(incident, nextStatus)}
                style={{
                  flex:         isResolve ? 1 : 'none',
                  background:   isResolve ? `${nextCfg?.color}22` : 'var(--bg-raised)',
                  border:       `1px solid ${nextCfg?.color || 'var(--border)'}55`,
                  borderRadius: 'var(--radius-sm)',
                  padding:      '8px 14px',
                  fontSize:     '12px',
                  fontWeight:   700,
                  color:        nextCfg?.color || 'var(--text-primary)',
                  letterSpacing:'0.06em',
                  transition:   'all 0.15s ease',
                }}
              >
                → {nextStatus.replace('_',' ').toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {incident.status === 'resolved' && (
        <p style={{ fontSize:'12px', color:'#00ff88', fontFamily:'var(--font-mono)', textAlign:'center' }}>
          ✓ Incident resolved
        </p>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign:'center', padding:'60px 0' }}>
      <span style={{ fontSize:'32px', animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span>
      <p style={{ color:'var(--text-muted)', marginTop:'16px', fontFamily:'var(--font-mono)', fontSize:'13px' }}>
        Loading incidents...
      </p>
    </div>
  );
}

function EmptyState({ filter }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 0' }}>
      <span style={{ fontSize:'48px', display:'block', marginBottom:'16px', opacity:0.4 }}>
        {filter === 'resolved' ? '✓' : '📭'}
      </span>
      <p style={{ color:'var(--text-secondary)', fontWeight:600, marginBottom:'6px' }}>
        {filter === 'all' ? 'No incidents reported' : `No ${filter.replace('_',' ')} incidents`}
      </p>
      <p style={{ color:'var(--text-muted)', fontSize:'13px' }}>
        All clear for now
      </p>
    </div>
  );
}

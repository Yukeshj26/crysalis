// src/utils/constants.js

export const LORA_GATEWAY_URL = process.env.REACT_APP_LORA_GATEWAY_URL || 'http://localhost:3001';

export const SOS_TYPES = {
  fire:     { label: 'Fire',     emoji: '🔥', color: '#ff4500', bg: '#1a0800' },
  medical:  { label: 'Medical',  emoji: '🚑', color: '#00c2ff', bg: '#001a24' },
  security: { label: 'Security', emoji: '🚨', color: '#ff0040', bg: '#1a0010' },
};

export const STATUS_CONFIG = {
  active:      { label: 'Active',      color: '#ff4500', pulse: true  },
  assigned:    { label: 'Assigned',    color: '#ffc300', pulse: true  },
  in_progress: { label: 'In Progress', color: '#00c2ff', pulse: false },
  resolved:    { label: 'Resolved',    color: '#00ff88', pulse: false },
};

export const MODE_CONFIG = {
  online:        { label: 'Online',        icon: '📶', color: '#00ff88' },
  offline:       { label: 'Offline Queue', icon: '💾', color: '#ffc300' },
  lora:          { label: 'LoRa',          icon: '📡', color: '#c084fc' },
  lora_fallback: { label: 'LoRa→Queue',    icon: '📡', color: '#ffc300' },
};

export const FLOORS = ['1', '2', '3', '4', '5'];

export const STATUS_TRANSITIONS = {
  active:      ['assigned', 'in_progress'],
  assigned:    ['in_progress'],
  in_progress: ['resolved'],
  resolved:    [],
};

// tests/api.test.js
// Integration tests for the LoRa gateway API
// Run with: node tests/api.test.js  (requires gateway running on localhost:3001)

const GATEWAY = 'http://localhost:3001';

async function request(method, path, body) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ── Test runner ─────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ── Tests ───────────────────────────────────────

async function testHealthCheck() {
  console.log('\n📡 [1] Health Check');
  const { status, data } = await request('GET', '/status');
  assert('Status 200',             status === 200);
  assert('Status is online',       data.status === 'online');
  assert('Has firestore field',    typeof data.firestore === 'string');
  assert('Has uptime',             typeof data.uptime === 'number');
}

async function testSendValidIncident() {
  console.log('\n🔥 [2] Send Valid Fire Incident');
  const { status, data } = await request('POST', '/send', {
    type:      'fire',
    location:  'Room 204',
    mode:      'lora',
    timestamp: Date.now(),
  });
  assert('Status 201',           status === 201);
  assert('success is true',      data.success === true);
  assert('Has incidentId',       typeof data.incidentId === 'string');
  assert('Mode is lora variant', data.mode.startsWith('lora'));
}

async function testSendMedicalIncident() {
  console.log('\n🚑 [3] Send Medical Incident');
  const { status, data } = await request('POST', '/send', {
    type:      'medical',
    location:  'Lobby',
    timestamp: Date.now(),
  });
  assert('Status 201',      status === 201);
  assert('success is true', data.success === true);
}

async function testSendSecurityIncident() {
  console.log('\n🚨 [4] Send Security Incident');
  const { status, data } = await request('POST', '/send', {
    type:      'security',
    location:  'Parking Lot',
    timestamp: Date.now(),
  });
  assert('Status 201',      status === 201);
  assert('success is true', data.success === true);
}

async function testInvalidType() {
  console.log('\n⛔ [5] Invalid Incident Type');
  const { status, data } = await request('POST', '/send', {
    type:     'earthquake', // invalid
    location: 'Room 101',
  });
  assert('Status 400',      status === 400);
  assert('success is false', data.success === false);
  assert('Has error field',  typeof data.error === 'string');
}

async function testMissingLocation() {
  console.log('\n⛔ [6] Missing Location');
  const { status, data } = await request('POST', '/send', {
    type: 'fire',
    // location intentionally omitted
  });
  assert('Status 400',      status === 400);
  assert('success is false', data.success === false);
}

async function testGetIncidents() {
  console.log('\n📋 [7] Get Incidents (simulation mode)');
  const { status, data } = await request('GET', '/incidents');
  assert('Status 200', status === 200);
  // Either Firestore message or incidents array is fine
  assert('Valid response', data.message !== undefined || Array.isArray(data.incidents));
}

// ── Run all tests ───────────────────────────────
async function runAll() {
  console.log('🧪 RESPOND LoRa Gateway API Tests');
  console.log('══════════════════════════════════');

  try {
    await testHealthCheck();
    await testSendValidIncident();
    await testSendMedicalIncident();
    await testSendSecurityIncident();
    await testInvalidType();
    await testMissingLocation();
    await testGetIncidents();
  } catch (err) {
    console.error('\n💥 Test runner error:', err.message);
    console.error('   Make sure the gateway is running: cd lora-gateway && npm start');
  }

  console.log('\n══════════════════════════════════');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) console.log('🎉 All tests passed!');
  process.exit(failed > 0 ? 1 : 0);
}

runAll();

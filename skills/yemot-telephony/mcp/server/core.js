// Core Yemot Hamashiach (call2all) management-API client: config store,
// authentication (permanent key OR login+MFA), session cache, file transfer,
// and project linking. No MCP or HTTP-server concerns here.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const BASE = 'https://www.call2all.co.il/ym/api/';
export const IDLE_MS = 30 * 60 * 1000; // Yemot session token expires after 30 min idle

const HOME = process.env.YEMOT_HOME || path.join(os.homedir(), '.yemot');
const SYSTEMS_FILE = path.join(HOME, 'systems.json');
const STATE_FILE = path.join(HOME, 'state.json');

// --------------------------------------------------------------------------- //
// store
// --------------------------------------------------------------------------- //
function ensureHome() {
  fs.mkdirSync(HOME, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function loadSystems() {
  return readJson(SYSTEMS_FILE, { systems: {} }).systems || {};
}

export function saveSystems(systems) {
  ensureHome();
  // ponytail: secrets sit in a 0600 file, not the OS keychain. Good enough for a
  // single-user local tool; swap in keytar if you want keychain-backed storage.
  fs.writeFileSync(SYSTEMS_FILE, JSON.stringify({ systems }, null, 2), { mode: 0o600 });
  try { fs.chmodSync(SYSTEMS_FILE, 0o600); } catch { /* windows */ }
}

export function getSystem(name) {
  const systems = loadSystems();
  if (!systems[name]) {
    const known = Object.keys(systems).join(', ') || '(none)';
    throw new Error(`Unknown system '${name}'. Known: ${known}`);
  }
  return systems[name];
}

function loadState() {
  return readJson(STATE_FILE, {});
}

function saveState(state) {
  ensureHome();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), { mode: 0o600 });
}

// --------------------------------------------------------------------------- //
// HTTP
// --------------------------------------------------------------------------- //
async function postJson(command, params) {
  const res = await fetch(BASE + command, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const ct = res.headers.get('content-type') || '';
  const buf = Buffer.from(await res.arrayBuffer());
  let json = null;
  if (ct.includes('json') || buf[0] === 0x7b || buf[0] === 0x5b) {
    try { json = JSON.parse(buf.toString('utf8')); } catch { /* binary */ }
  }
  return { json, buf, ct };
}

export class MFARequired extends Error {}

export function checkStatus(resp) {
  const st = resp && resp.responseStatus;
  if (st === 'ERROR' || st === 'FORBIDDEN' || st === 'EXCEPTION') {
    if (resp.message === 'MFA_REQUIRED') {
      throw new MFARequired(
        'This session has not passed two-step verification (MFA). ' +
        'Run the MFA flow once (dashboard, or yemot_mfa_* tools).',
      );
    }
    throw new Error(`Yemot ${st}: ${resp.message || JSON.stringify(resp)}`);
  }
  return resp;
}

// --------------------------------------------------------------------------- //
// token resolution + login  (pure resolveToken -> testable without network)
// --------------------------------------------------------------------------- //
export function resolveToken(cfg, st, now) {
  const auth = cfg.auth || 'key';
  if (auth === 'key') {
    if (!cfg.apiKey) throw new Error("auth='key' but no apiKey set for this system.");
    return { kind: 'token', token: cfg.apiKey };
  }
  if (auth === 'login') {
    if (st && st.token && now - (st.lastUse || 0) < IDLE_MS) {
      return { kind: 'token', token: st.token };
    }
    return { kind: 'need_login', token: null };
  }
  throw new Error(`Unknown auth mode '${auth}' (use 'key' or 'login').`);
}

async function login(cfg) {
  if (!cfg.password) throw new Error("auth='login' but no password set for this system.");
  const { json } = await postJson('Login', { username: cfg.system, password: cfg.password });
  if (!json || !json.token) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  return json.token;
}

async function tokenFor(name, { forceLogin = false } = {}) {
  const cfg = getSystem(name);
  const state = loadState();
  const st = (state[name] ||= {});
  const r = resolveToken(cfg, st, Date.now());
  if (r.kind === 'token' && !forceLogin) return { token: r.token, cfg, state };
  if ((cfg.auth || 'key') !== 'login') {
    throw new Error(`System '${name}' uses auth='key'; nothing to log in.`);
  }
  st.token = await login(cfg);
  st.lastUse = Date.now();
  saveState(state);
  return { token: st.token, cfg, state };
}

function touch(name, cfg, state) {
  if ((cfg.auth || 'key') === 'login') {
    (state[name] ||= {}).lastUse = Date.now();
    saveState(state);
  }
}

// --------------------------------------------------------------------------- //
// public API
// --------------------------------------------------------------------------- //
export async function call(name, command, params = {}) {
  const { token, cfg, state } = await tokenFor(name);
  const { json } = await postJson(command, { ...params, token });
  if (!json) throw new Error(`${command}: non-JSON response`);
  checkStatus(json);
  touch(name, cfg, state);
  return json;
}

export async function mfa(name, action, extra = {}) {
  const cfg = getSystem(name);
  if ((cfg.auth || 'key') !== 'login') throw new Error("MFA only applies to auth='login' systems.");
  const { token, state } = await tokenFor(name);
  const { json } = await postJson('MFASession', { token, action, ...extra });
  if (!json) throw new Error('MFASession: non-JSON response');
  touch(name, cfg, state);
  return json;
}

export async function relogin(name) {
  const cfg = getSystem(name);
  if ((cfg.auth || 'key') !== 'login') throw new Error("relogin only applies to auth='login'.");
  await tokenFor(name, { forceLogin: true });
  return { ok: true };
}

export async function upload(name, localPath, remotePath) {
  const { token } = await tokenFor(name);
  const data = fs.readFileSync(localPath);
  const fd = new FormData();
  fd.append('token', token);
  fd.append('path', remotePath);
  fd.append('file', new Blob([data]), path.basename(remotePath));
  const res = await fetch(BASE + 'UploadFile', { method: 'POST', body: fd });
  return checkStatus(await res.json());
}

export async function download(name, remotePath, localPath) {
  const { token } = await tokenFor(name);
  const { json, buf } = await postJson('DownloadFile', { token, path: remotePath });
  if (json) { // an error response, not the file
    checkStatus(json);
    throw new Error(`DownloadFile returned JSON, not a file: ${JSON.stringify(json)}`);
  }
  fs.writeFileSync(localPath, buf);
  return { saved: localPath, bytes: buf.length };
}

// --------------------------------------------------------------------------- //
// project linking
// --------------------------------------------------------------------------- //
function norm(p) {
  return path.resolve(p).replace(/[\\/]+$/, '').toLowerCase();
}

export function currentProject() {
  return process.cwd();
}

// Systems linked to a directory: an explicit `.yemot` marker file naming a
// system, plus any system whose `projects` list contains (a prefix of) the cwd.
export function systemsForProject(cwd) {
  const systems = loadSystems();
  const names = [];
  try {
    const marker = path.join(cwd, '.yemot');
    if (fs.existsSync(marker)) {
      const n = fs.readFileSync(marker, 'utf8').trim();
      if (systems[n]) names.push(n);
    }
  } catch { /* ignore */ }
  const c = norm(cwd);
  for (const [name, cfg] of Object.entries(systems)) {
    for (const proj of cfg.projects || []) {
      if (c === norm(proj) || c.startsWith(norm(proj) + path.sep.toLowerCase())) {
        names.push(name);
        break;
      }
    }
  }
  return [...new Set(names)];
}

// Resolve a system argument: explicit name wins; otherwise the single system
// linked to the current project; otherwise throw with guidance.
export function resolveSystem(name) {
  if (name) return name;
  const linked = systemsForProject(currentProject());
  if (linked.length === 1) return linked[0];
  const all = Object.keys(loadSystems());
  if (linked.length > 1) {
    throw new Error(`Multiple systems linked here: ${linked.join(', ')}. Pass one explicitly.`);
  }
  throw new Error(`No system linked to this project. Available: ${all.join(', ') || '(none)'}. Pass one explicitly.`);
}

// Non-secret view of a system, for listing.
export function publicSystem(name, cfg) {
  return {
    name,
    label: cfg.label || name,
    system: cfg.system,
    auth: cfg.auth || 'key',
    note: cfg.note || '',
    projects: cfg.projects || [],
  };
}

// Live status for the dashboard: probe GetSession, classify the result.
export async function systemStatus(name) {
  const cfg = getSystem(name);
  const base = publicSystem(name, cfg);
  try {
    const s = await call(name, 'GetSession', {});
    // GetSession field names vary; surface the common ones plus the raw payload.
    const balance = s.units ?? s.balance ?? s.unitsLeft ?? null;
    const customer = s.customerName ?? s.name ?? s.customer ?? null;
    return { ...base, status: 'ok', balance, customer };
  } catch (e) {
    if (e instanceof MFARequired) return { ...base, status: 'mfa_required' };
    return { ...base, status: 'error', error: String(e.message || e) };
  }
}

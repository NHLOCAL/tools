// Live management dashboard: a localhost-only web server for adding/editing
// systems, seeing live status (auth + unit balance), running the MFA flow, and
// linking systems to projects. You fill in secrets here - never through chat.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from './core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_FILE = path.join(__dirname, '..', 'public', 'dashboard.html');
const HTML_CONTENT = fs.readFileSync(HTML_FILE, 'utf8'); // cached once at startup
const MAX_BODY = 10 * 1024 * 1024; // 10 MB - avoid unbounded-body OOM

function send(res, code, body, type = 'application/json') {
  const data = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(data);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw new Error('Request body too large');
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

// Save/merge a system, preserving existing secrets when the form leaves them blank.
function upsertSystem(payload) {
  const systems = core.loadSystems();
  const name = (payload.name || '').trim();
  if (!name) throw new Error('name is required');
  if (!/^[A-Za-z0-9_-]+$/.test(name) || ['__proto__', 'constructor', 'prototype'].includes(name)) {
    throw new Error('name may contain only letters, digits, underscore, and hyphen');
  }
  const prev = systems[name] || {};
  systems[name] = {
    label: payload.label ?? prev.label ?? name,
    system: (payload.system ?? prev.system ?? '').trim(),
    auth: payload.auth === 'login' ? 'login' : 'key',
    note: payload.note ?? prev.note ?? '',
    projects: Array.isArray(payload.projects) ? payload.projects : (prev.projects || []),
    apiKey: payload.apiKey ? payload.apiKey : prev.apiKey,
    password: payload.password ? payload.password : prev.password,
  };
  core.saveSystems(systems);
  return { ok: true };
}

const ROUTES = {
  'GET /api/state': async () => {
    const cwd = core.currentProject();
    const systems = core.loadSystems();
    return {
      project: cwd,
      linked: core.systemsForProject(cwd),
      systems: Object.entries(systems).map(([n, c]) => core.publicSystem(n, c)),
    };
  },
  'GET /api/status': async () => {
    const names = Object.keys(core.loadSystems());
    return await Promise.all(names.map((n) => core.systemStatus(n)));
  },
  'POST /api/system': async (body) => upsertSystem(body),
  'POST /api/system/delete': async (body) => {
    const systems = core.loadSystems();
    delete systems[body.name];
    core.saveSystems(systems);
    return { ok: true };
  },
  'POST /api/system/link': async (body) => {
    const systems = core.loadSystems();
    const s = systems[body.name];
    if (!s) throw new Error('unknown system');
    const proj = body.project || core.currentProject();
    s.projects = [...new Set([...(s.projects || []), proj])];
    core.saveSystems(systems);
    return { ok: true, projects: s.projects };
  },
  'POST /api/system/unlink': async (body) => {
    const systems = core.loadSystems();
    const s = systems[body.name];
    if (!s) throw new Error('unknown system');
    s.projects = (s.projects || []).filter((p) => p !== body.project);
    core.saveSystems(systems);
    return { ok: true, projects: s.projects };
  },
  'POST /api/system/relogin': async (body) => core.relogin(body.name),
  'POST /api/mfa/methods': async (body) => ({
    isPass: await core.mfa(body.name, 'isPass', {}),
    methods: await core.mfa(body.name, 'getMFAMethods', {}),
  }),
  'POST /api/mfa/send': async (body) =>
    core.mfa(body.name, 'sendMFA', { mfaId: body.mfaId, mfaSendType: body.sendType, lang: body.lang || 'HE' }),
  'POST /api/mfa/verify': async (body) =>
    core.mfa(body.name, 'validMFA', { mfaCode: body.code, mfaRememberMe: true, mfaRememberNote: body.note || 'yemot-mcp' }),
  'POST /api/mfa/trust': async (body) => core.mfa(body.name, 'getMFATrustTokens', {}),
};

// Reject cross-site / DNS-rebinding requests: Host must be loopback, and any
// Origin header must be loopback too. Blocks a malicious web page from POSTing
// to the dashboard and overwriting the user's systems/secrets (CSRF).
function isLoopback(host) {
  const h = (host || '').replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
  return h === '127.0.0.1' || h === 'localhost' || h === '::1';
}
function sameSite(req) {
  if (!isLoopback(req.headers.host)) return false;
  // Browsers set Sec-Fetch-Site; reject any cross-site request. This also covers
  // cross-origin GETs (<img>/<script>) that carry no Origin header. Non-browser
  // clients (curl, the CLI) omit it and are allowed.
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (origin) {
    try { if (!isLoopback(new URL(origin).host)) return false; } catch { return false; }
  }
  return true;
}

async function handler(req, res) {
  if (!sameSite(req)) return send(res, 403, { error: 'forbidden' });
  const url = new URL(req.url, 'http://127.0.0.1');
  if (req.method === 'GET' && url.pathname === '/') {
    return send(res, 200, HTML_CONTENT, 'text/html');
  }
  const route = ROUTES[`${req.method} ${url.pathname}`];
  if (!route) return send(res, 404, { error: 'not found' });
  try {
    if (req.method === 'POST') {
      const ct = (req.headers['content-type'] || '').split(';')[0].trim();
      if (ct !== 'application/json') return send(res, 415, { error: 'content-type must be application/json' });
    }
    const body = req.method === 'POST' ? await readBody(req) : null;
    send(res, 200, await route(body));
  } catch (e) {
    send(res, 400, { error: String(e.message || e) });
  }
}

// Bind to loopback only; try a few ports so multiple client sessions coexist.
export function startDashboard(preferredPort = 8787) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    let port = preferredPort;
    const onError = (e) => {
      if (e.code === 'EADDRINUSE' && port < preferredPort + 20) { port += 1; attempt(); }
      else reject(e);
    };
    const attempt = () => {
      server.removeListener('error', onError);
      server.once('error', onError);
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', onError); // don't leak the startup listener into runtime
        resolve({ server, url: `http://127.0.0.1:${port}/`, port });
      });
    };
    attempt();
  });
}

// Run standalone: `node server/dashboard.js`
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('dashboard.js')) {
  startDashboard().then(({ url }) => {
    console.log(`Yemot dashboard: ${url}`);
  }).catch((e) => { console.error(e); process.exit(1); });
}

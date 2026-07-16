#!/usr/bin/env node
// Yemot Hamashiach (call2all) MCP server. Standard stdio MCP - runs in any
// MCP client (Claude Code/Desktop, Cursor, Windsurf, Codex, ...). Also starts a
// localhost management dashboard. Secrets are entered in the dashboard, never here.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from './core.js';
import { startDashboard } from './dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Docs come from the bundled copy when present (standalone .mcpb), otherwise from
// the parent skill's references/ (when this lives inside skills/yemot-telephony/).
const DOCS_DIR = [
  path.join(__dirname, '..', 'docs'),
  path.join(__dirname, '..', '..', 'references'),
].find((d) => fs.existsSync(d)) || path.join(__dirname, '..', 'docs');

let dashboard = null;
async function ensureDashboard() {
  if (!dashboard) dashboard = await startDashboard(Number(process.env.YEMOT_DASHBOARD_PORT) || 8787);
  return dashboard;
}

function text(obj) {
  return { content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }] };
}
function fail(e) {
  return { isError: true, content: [{ type: 'text', text: String(e.message || e) }] };
}

function searchDocs(query, ctx = 3, maxHits = 40) {
  const terms = (query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!query || query.trim().length < 2) return 'Query must be at least 2 characters long.';
  if (!fs.existsSync(DOCS_DIR)) return '(no bundled docs found)';
  const out = [];
  for (const f of fs.readdirSync(DOCS_DIR).filter((n) => n.endsWith('.md')).sort()) {
    const lines = fs.readFileSync(path.join(DOCS_DIR, f), 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const low = lines[i].toLowerCase();
      if (terms.some((t) => low.includes(t))) { // any term matches (multi-word friendly)
        const snippet = lines.slice(Math.max(0, i - ctx), Math.min(lines.length, i + ctx + 1)).join('\n');
        out.push(`### ${f}:${i + 1}\n${snippet}`);
        if (out.length >= maxHits) return out.join('\n\n') + `\n\n... (truncated at ${maxHits})`;
      }
    }
  }
  return out.length ? out.join('\n\n') : `No matches for '${query}'.`;
}

const server = new McpServer({ name: 'yemot', version: '1.0.0' });

server.registerTool('yemot_systems', {
  description: 'List configured Yemot systems (no secrets), marking which are linked to the current project.',
  inputSchema: {},
}, async () => {
  const linked = new Set(core.systemsForProject(core.currentProject()));
  const systems = core.loadSystems();
  const list = Object.entries(systems).map(([n, c]) => ({ ...core.publicSystem(n, c), password: undefined, apiKey: undefined, activeHere: linked.has(n) }));
  return text({ project: core.currentProject(), systems: list });
});

server.registerTool('yemot_call', {
  description: 'Call any Yemot management-API command (GetSession, UploadTextFile, RunCampaign, SendSms, GetIVR2Dir, ...). Omit `system` to use the one linked to the current project. On MFA_REQUIRED, complete 2FA in the dashboard or via yemot_mfa_* tools.',
  inputSchema: {
    system: z.string().optional(),
    command: z.string(),
    params: z.record(z.string(), z.any()).optional(),
  },
}, async ({ system, command, params }) => {
  try { return text(await core.call(core.resolveSystem(system), command, params || {})); }
  catch (e) { return fail(e); }
});

server.registerTool('yemot_upload', {
  description: 'Upload a local file to a Yemot path (e.g. ivr2:/1/1/000.wav).',
  inputSchema: { system: z.string().optional(), localPath: z.string(), remotePath: z.string() },
}, async ({ system, localPath, remotePath }) => {
  try { return text(await core.upload(core.resolveSystem(system), localPath, remotePath)); }
  catch (e) { return fail(e); }
});

server.registerTool('yemot_download', {
  description: 'Download a Yemot file to a local path.',
  inputSchema: { system: z.string().optional(), remotePath: z.string(), localPath: z.string() },
}, async ({ system, remotePath, localPath }) => {
  try { return text(await core.download(core.resolveSystem(system), remotePath, localPath)); }
  catch (e) { return fail(e); }
});

server.registerTool('yemot_mfa_status', {
  description: "Check MFA state and list available 2FA methods (auth='login' systems).",
  inputSchema: { system: z.string().optional() },
}, async ({ system }) => {
  try {
    const name = core.resolveSystem(system);
    return text({ isPass: await core.mfa(name, 'isPass', {}), methods: await core.mfa(name, 'getMFAMethods', {}) });
  } catch (e) { return fail(e); }
});

server.registerTool('yemot_mfa_send', {
  description: 'Send an OTP code. sendType is one of the method SEND_TYPE values (CALL/SMS/EMAIL). Ask the user for the code, then yemot_mfa_verify.',
  inputSchema: { system: z.string().optional(), mfaId: z.number(), sendType: z.string(), lang: z.string().optional() },
}, async ({ system, mfaId, sendType, lang }) => {
  try { return text(await core.mfa(core.resolveSystem(system), 'sendMFA', { mfaId, mfaSendType: sendType, lang: lang || 'HE' })); }
  catch (e) { return fail(e); }
});

server.registerTool('yemot_mfa_verify', {
  description: 'Submit the OTP code with remember-me so future logins skip MFA.',
  inputSchema: { system: z.string().optional(), code: z.string(), note: z.string().optional() },
}, async ({ system, code, note }) => {
  try { return text(await core.mfa(core.resolveSystem(system), 'validMFA', { mfaCode: code, mfaRememberMe: true, mfaRememberNote: note || 'yemot-mcp' })); }
  catch (e) { return fail(e); }
});

server.registerTool('yemot_docs', {
  description: 'Search the bundled Yemot documentation offline (modules, settings, API commands).',
  inputSchema: { query: z.string() },
}, async ({ query }) => text(searchDocs(query)));

server.registerTool('yemot_dashboard', {
  description: 'Start (if needed) and return the URL of the local live-management dashboard for configuring systems, secrets, and 2FA.',
  inputSchema: {},
}, async () => {
  try { const d = await ensureDashboard(); return text({ url: d.url }); }
  catch (e) { return fail(e); }
});

async function main() {
  try { const d = await ensureDashboard(); console.error(`[yemot] dashboard: ${d.url}`); }
  catch (e) { console.error(`[yemot] dashboard not started: ${e.message}`); }
  await server.connect(new StdioServerTransport());
}
main().catch((e) => { console.error(e); process.exit(1); });

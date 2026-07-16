// Offline self-test for the auth/token/project logic. No network.
// Run: npm test
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'yemot-selftest-'));
process.env.YEMOT_HOME = TMP;

const projA = path.join(TMP, 'projectA');
fs.mkdirSync(projA, { recursive: true });
fs.writeFileSync(path.join(TMP, 'systems.json'), JSON.stringify({
  systems: {
    keySys: { label: 'Key', system: '077', auth: 'key', apiKey: 'K', projects: [projA] },
    loginSys: { label: 'Login', system: '078', auth: 'login', password: 'P', projects: [] },
  },
}));

const core = await import('./core.js');

// token resolution
const now = 1_000_000_000;
assert.deepStrictEqual(core.resolveToken({ auth: 'key', apiKey: 'K' }, {}, now), { kind: 'token', token: 'K' });
assert.deepStrictEqual(core.resolveToken({ auth: 'login' }, { token: 'S', lastUse: now - 1000 }, now), { kind: 'token', token: 'S' });
assert.strictEqual(core.resolveToken({ auth: 'login' }, { token: 'S', lastUse: now - core.IDLE_MS - 1 }, now).kind, 'need_login');
assert.strictEqual(core.resolveToken({ auth: 'login' }, {}, now).kind, 'need_login');
assert.throws(() => core.resolveToken({ auth: 'key' }, {}, now), /apiKey/);
assert.throws(() => core.resolveToken({ auth: 'weird' }, {}, now), /Unknown auth/);

// status classification
assert.throws(() => core.checkStatus({ responseStatus: 'ERROR', message: 'MFA_REQUIRED' }), (e) => e instanceof core.MFARequired);
assert.throws(() => core.checkStatus({ responseStatus: 'FORBIDDEN', message: 'nope' }), (e) => !(e instanceof core.MFARequired));
assert.deepStrictEqual(core.checkStatus({ responseStatus: 'OK', x: 1 }), { responseStatus: 'OK', x: 1 });

// project linking + resolveSystem
const linked = core.systemsForProject(path.join(projA, 'sub', 'dir'));
assert.deepStrictEqual(linked, ['keySys'], 'cwd under a linked project resolves the system');
assert.strictEqual(core.systemsForProject(TMP).length, 0, 'unlinked dir resolves nothing');

const cwd = process.cwd();
process.chdir(projA);
try {
  assert.strictEqual(core.resolveSystem(), 'keySys', 'auto-resolves the single linked system');
  assert.strictEqual(core.resolveSystem('loginSys'), 'loginSys', 'explicit name wins');
} finally { process.chdir(cwd); }
assert.throws(() => { const c = process.cwd(); process.chdir(TMP); try { core.resolveSystem(); } finally { process.chdir(c); } }, /No system linked/);

// public view hides secrets
const pub = core.publicSystem('keySys', core.loadSystems().keySys);
assert.strictEqual(pub.apiKey, undefined);
assert.strictEqual(pub.password, undefined);

fs.rmSync(TMP, { recursive: true, force: true });
console.log('selftest OK');

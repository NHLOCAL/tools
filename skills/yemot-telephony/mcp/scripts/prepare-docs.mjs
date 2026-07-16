// Copy the parent skill's references/*.md into ./docs so the packed .mcpb bundle
// is self-contained (no duplicate docs are committed to the repo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const refs = path.join(here, '..', '..', 'references');   // skills/yemot-telephony/references
const docs = path.join(here, '..', 'docs');               // mcp/docs

if (!fs.existsSync(refs)) {
  console.error(`references not found at ${refs}; nothing to copy (standalone checkout?)`);
  process.exit(0);
}
fs.mkdirSync(docs, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(refs)) {
  if (f.endsWith('.md')) { fs.copyFileSync(path.join(refs, f), path.join(docs, f)); n++; }
}
console.log(`copied ${n} doc file(s) into ${docs}`);

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const data = JSON.parse(read('questions.json'));
const profiles = JSON.parse(read('profiles.json'));
data.revision = data.version + '-' + crypto.createHash('sha256').update(JSON.stringify(data.questions)).digest('hex').slice(0, 12);
const serialize = value => JSON.stringify(value).replace(/</g, '\\u003c');
const fontFolder = path.resolve(__dirname, '../../assets/fonts');
const font = fs.readFileSync(path.join(fontFolder, 'assistant-variable.ttf')).toString('base64');
const fontLicense = fs.readFileSync(path.join(fontFolder, 'OFL.txt'), 'utf8').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
const styles = read('styles.css').replace('/* FONT */', () => `/* Embedded Assistant font license:\n${fontLicense}\n*/\n@font-face{font-family:Assistant;src:url(data:font/ttf;base64,${font}) format('truetype');font-weight:200 800;font-display:swap}`);
let page = read('page.html')
  .replace('/* STYLES */', () => styles)
  .replace('/* DATA */', () => `const MBTI_DATA = ${serialize(data)};\nconst MBTI_PROFILES = ${serialize(profiles)};`)
  .replace('/* SCORING */', () => read('scoring.js'))
  .replace('/* APP */', () => read('app.js'));
const output = path.resolve(__dirname, '../../tools/the_16_types.html');
// The site generator may attach its own title/SEO block. Preserve that owned block.
const metadataPattern = /<!-- catalog metadata:start -->[\s\S]*?<!-- catalog metadata:end -->\n?/;
if (fs.existsSync(output)) {
  const block = fs.readFileSync(output, 'utf8').match(metadataPattern)?.[0];
  if (block) page = page.replace(/[ \t]*<title>.*?<\/title>\s*\n?/s, '').replace('</head>', block + '</head>');
}
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== page) {
    console.error('Standalone HTML is stale. Run node resources/the_16_types/build.cjs');
    process.exitCode = 1;
  } else console.log('Standalone HTML matches sources');
} else { fs.writeFileSync(output, page); console.log(`Built ${output} (${Buffer.byteLength(page)} bytes)`); }

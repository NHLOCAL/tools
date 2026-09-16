'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const engine = require('./engine.js');

const validationDir = path.join(__dirname, 'validation');
const holdoutMode = process.argv.slice(2).includes('--holdout');
const round = holdoutMode ? 2 : 1;
const resultsPath = path.join(validationDir, `round${round}-results.json`);
const reportPath = path.join(validationDir, `round${round}-report.md`);

const round1Expected = {
  A1: { primary: 1, wing: 9, dominantInstinct: 'sp', stack: ['sp', 'so', 'sx'] },
  A2: { primary: 2, wing: 1, dominantInstinct: 'so', stack: ['so', 'sp', 'sx'] },
  B1: { primary: 3, wing: 2, dominantInstinct: 'so', stack: ['so', 'sx', 'sp'] },
  B2: { primary: 4, wing: 5, dominantInstinct: 'sx', stack: ['sx', 'sp', 'so'] },
  C1: { primary: 5, wing: 6, dominantInstinct: 'sp', stack: ['sp', 'so', 'sx'] },
  C2: { primary: 6, wing: 5, dominantInstinct: 'so', stack: ['so', 'sp', 'sx'] },
  D1: { primary: 7, wing: 8, dominantInstinct: 'sx', stack: ['sx', 'so', 'sp'] },
  D2: { primary: 8, wing: 9, dominantInstinct: 'sp', stack: ['sp', 'sx', 'so'] },
  E1: { primary: 9, wing: 1, dominantInstinct: 'so', stack: ['so', 'sp', 'sx'] },
  E2: { primary: null, wing: null, dominantInstinct: null, stack: null }
};
const round2Expected = {
  H1: { primary: 5, wing: 4, dominantInstinct: 'sx', stack: ['sx', 'sp', 'so'] },
  H2: { primary: 2, wing: 3, dominantInstinct: 'sp', stack: ['sp', 'so', 'sx'] },
  H3: { primary: 4, wing: 3, dominantInstinct: 'sp', stack: ['sp', 'sx', 'so'] },
  H4: { primary: 7, wing: 6, dominantInstinct: 'so', stack: ['so', 'sp', 'sx'] }
};
const expected = holdoutMode ? round2Expected : round1Expected;

function evaluate(expectedValue, actualValue) {
  if (expectedValue === null) {
    return actualValue === null ? 'correct_abstention' : 'incorrect_false_positive';
  }
  if (actualValue === null) return 'abstention';
  const same = Array.isArray(expectedValue)
    ? Array.isArray(actualValue) && expectedValue.join('/') === actualValue.join('/')
    : expectedValue === actualValue;
  return same ? 'correct' : 'incorrect';
}

function fmtType(primary, wing) {
  if (primary === null) return 'null';
  return wing === null ? String(primary) : `${primary}w${wing}`;
}

function fmtStack(stack) {
  return stack === null ? 'null' : stack.map(value => value.toUpperCase()).join('/');
}

const sourcePattern = holdoutMode ? /^blind-holdout-[a-z]\.json$/i : /^blind-[a-e]\.json$/i;
const sourceFiles = fs.readdirSync(validationDir)
  .filter(name => sourcePattern.test(name))
  .sort();
const cases = sourceFiles.flatMap(sourceFile => {
  const payload = JSON.parse(fs.readFileSync(path.join(validationDir, sourceFile), 'utf8'));
  return payload.cases.map(testCase => ({ ...testCase, sourceFile }));
});

const caseIds = cases.map(testCase => testCase.id).sort();
const expectedIds = Object.keys(expected).sort();
if (caseIds.join(',') !== expectedIds.join(',')) {
  throw new Error(`Case set mismatch. Expected ${expectedIds.join(', ')}; found ${caseIds.join(', ')}`);
}

const rows = cases.map(testCase => {
  const scored = engine.score(testCase.answers);
  const actualStack = scored.stackClear
    ? scored.instinctRanking.map(entry => entry.key)
    : null;
  const actual = {
    primary: scored.primary,
    wing: scored.wing?.dominant ?? null,
    dominantInstinct: scored.dominantInstinct,
    stack: actualStack
  };
  const target = expected[testCase.id];
  const evaluation = {
    primary: evaluate(target.primary, actual.primary),
    wing: evaluate(target.wing, actual.wing),
    dominantInstinct: evaluate(target.dominantInstinct, actual.dominantInstinct),
    stack: evaluate(target.stack, actual.stack)
  };
  return {
    id: testCase.id,
    sourceFile: testCase.sourceFile,
    expected: target,
    actual,
    evaluation,
    evidence: {
      primaryStatus: scored.primaryStatus,
      primaryGap: scored.gap,
      candidates: scored.candidates,
      typeRanking: scored.typeRanking,
      wingStatus: scored.wing?.status ?? null,
      wingGap: scored.wing?.gap ?? null,
      instinctStatus: scored.instinctStatus,
      instinctGap: scored.instinctRanking[0].score - scored.instinctRanking[1].score,
      stackClear: scored.stackClear,
      instinctRanking: scored.instinctRanking,
      uniform: scored.uniform
    }
  };
});

const fields = ['primary', 'wing', 'dominantInstinct', 'stack'];
const summary = Object.fromEntries(fields.map(field => {
  const counts = {};
  for (const row of rows) counts[row.evaluation[field]] = (counts[row.evaluation[field]] || 0) + 1;
  return [field, counts];
}));

const output = {
  schemaVersion: 1,
  round,
  mode: holdoutMode ? 'holdout' : 'round1',
  engineVersion: engine.VERSION,
  sha256: {
    engine: crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'engine.js'))).digest('hex'),
    blindQuestionnaire: crypto.createHash('sha256').update(fs.readFileSync(path.join(validationDir, 'blind-questionnaire.json'))).digest('hex')
  },
  thresholds: {
    typeGap: engine.TYPE_GAP,
    wingGap: engine.WING_GAP,
    instinctGap: engine.INSTINCT_GAP
  },
  sourceFiles,
  summary,
  cases: rows
};
fs.writeFileSync(resultsPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

const tableRows = rows.map(row => {
  const expectedType = fmtType(row.expected.primary, row.expected.wing);
  const actualType = fmtType(row.actual.primary, row.actual.wing);
  const typeOutcome = row.evaluation.primary === 'correct' && row.evaluation.wing === 'correct'
    ? 'correct'
    : [row.evaluation.primary, row.evaluation.wing].includes('incorrect')
      ? 'incorrect'
      : [row.evaluation.primary, row.evaluation.wing].includes('incorrect_false_positive')
        ? 'incorrect false positive'
        : row.evaluation.primary === 'correct_abstention'
          ? 'correct abstention'
          : 'abstention';
  const instinctOutcome = row.evaluation.dominantInstinct === 'correct'
    && row.evaluation.stack === 'correct'
    ? 'correct'
    : [row.evaluation.dominantInstinct, row.evaluation.stack].includes('incorrect')
      ? 'incorrect'
      : [row.evaluation.dominantInstinct, row.evaluation.stack].includes('incorrect_false_positive')
        ? 'incorrect false positive'
        : row.evaluation.dominantInstinct === 'correct_abstention'
          ? 'correct abstention'
          : 'abstention';
  const expectedInstinct = fmtStack(row.expected.stack);
  const actualInstinct = fmtStack(row.actual.stack);
  return `| ${row.id} | ${expectedType} | ${actualType} | ${typeOutcome} | ${expectedInstinct} | ${actualInstinct} | ${instinctOutcome} |`;
});

const incorrect = rows.filter(row => Object.values(row.evaluation).some(value => value.startsWith('incorrect')));
const abstained = rows.filter(row => Object.values(row.evaluation).includes('abstention'));
const report = [
  `# Round ${round} blind classification report`,
  '',
  `Engine ${engine.VERSION}; ${rows.length} frozen cases. An actual null means the engine withheld a classification under its configured evidence thresholds.`,
  `Engine SHA256: \`${output.sha256.engine}\``,
  `Questionnaire SHA256: \`${output.sha256.blindQuestionnaire}\``,
  ...(holdoutMode ? ['', 'The engine and frozen answers were unchanged for holdout scoring; no tuning was performed between rounds.'] : []),
  '',
  '| Case | Expected type | Actual type | Type outcome | Expected stack | Actual stack | Instinct outcome |',
  '| --- | --- | --- | --- | --- | --- | --- |',
  ...tableRows,
  '',
  `Incorrect classifications: ${incorrect.length ? incorrect.map(row => row.id).join(', ') : 'none'}.`,
  `Threshold abstentions on labeled cases: ${abstained.length ? abstained.map(row => row.id).join(', ') : 'none'}.`,
  ...(!holdoutMode ? [`Neutral control E2: ${rows.find(row => row.id === 'E2').evaluation.primary === 'correct_abstention' ? 'properly abstained' : 'did not properly abstain'}.`] : []),
  '',
  'This is a small synthetic blind classification check. It is not psychometric validation.'
].join('\n');
fs.writeFileSync(reportPath, `${report}\n`, 'utf8');

process.stdout.write(`${report}\n`);

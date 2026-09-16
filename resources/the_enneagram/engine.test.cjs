'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const engine = require('./engine.js');
const fs = require('node:fs');
const path = require('node:path');

test('published standalone page contains the current engine and application', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../tools/the_enneagram.html'), 'utf8');
  const embedded = html.match(/<script id="enneagram-engine">([\s\S]*?)<\/script>/);
  assert.ok(embedded, 'published engine exists');
  assert.equal(embedded[1].trim(), fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8').trim());
  assert.ok(html.includes(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').trim()));
  assert.ok(html.includes('SIL OPEN FONT LICENSE'), 'standalone font keeps its license');
  assert.equal(/INLINE_(STYLE|ENGINE|APP|FONT)/.test(html), false);
  assert.doesNotMatch(html, /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/, 'published text has no Hebrew niqqud');
});

const TYPE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const INSTINCT_KEYS = ['sp', 'so', 'sx'];

function answersFor(scaleRatings, fallback = 1) {
  return engine.questions.map((question) => {
    if(question.kind==='contrast'){const [a,b]=question.pair,va=scaleRatings[a]??fallback,vb=scaleRatings[b]??fallback;return va===vb?3:va>vb?1:5;}
    const keyedRating = scaleRatings[question.scale] ?? fallback;
    return question.reverse ? 6 - keyedRating : keyedRating;
  });
}

test('questionnaire has 93 items with balanced scales and one reverse item per scale', () => {
  assert.equal(engine.questions.length, 93);

  const counts = Object.fromEntries([...TYPE_KEYS, ...INSTINCT_KEYS].map((key) => [key, 0]));
  const reverseCounts = Object.fromEntries([...TYPE_KEYS, ...INSTINCT_KEYS].map((key) => [key, 0]));

  for (const question of engine.questions.filter(q=>q.kind!=='contrast')) {
    assert.ok(Object.hasOwn(counts, question.scale), `unexpected scale ${question.scale}`);
    counts[question.scale] += 1;
    if (question.reverse) reverseCounts[question.scale] += 1;
  }

  for (const key of TYPE_KEYS) {
    assert.equal(counts[key], 6, `type ${key} item count`);
    assert.equal(reverseCounts[key], 1, `type ${key} reverse count`);
  }
  for (const key of INSTINCT_KEYS) {
    assert.equal(counts[key], 7, `${key} item count`);
    assert.equal(reverseCounts[key], 1, `${key} reverse count`);
  }
});

test('uniform answers from 1 through 5 never produce a primary type or dominant instinct', () => {
  for (let value = 1; value <= 5; value += 1) {
    const result = engine.score(Array(93).fill(value));
    assert.equal(result.uniform, true, `uniform ${value}`);
    assert.equal(result.primaryStatus, 'undifferentiated', `primary status for ${value}`);
    assert.equal(result.primary, null, `primary for ${value}`);
    assert.equal(result.instinctStatus, 'undifferentiated', `instinct status for ${value}`);
    assert.equal(result.dominantInstinct, null, `dominant instinct for ${value}`);
  }
});

test('exact top ties abstain for both type and instinct', () => {
  const result = engine.score(answersFor({
    1: 5, 2: 5,
    3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2,
    sp: 5, so: 5, sx: 2
  }));

  assert.equal(result.typeRanking[0].score, result.typeRanking[1].score);
  assert.equal(result.primaryStatus, 'close');
  assert.equal(result.primary, null);
  assert.deepEqual(result.candidates, [1, 2]);
  assert.equal(result.instinctRanking[0].score, result.instinctRanking[1].score);
  assert.equal(result.instinctStatus, 'close');
  assert.equal(result.dominantInstinct, null);
});

test('wing neighbors wrap at types 1 and 9 and exclude nonadjacent types', () => {
  const one = engine.getWing(1, {'1':100, '2': 60, '5': 100, '9': 80});
  assert.deepEqual(one.adjacent, [9, 2]);
  assert.deepEqual(one.ranked.map(({key}) => key), ['9', '2']);
  assert.equal(one.dominant, 9);

  const nine = engine.getWing(9, {'9':100, '1': 80, '5': 100, '8': 60});
  assert.deepEqual(nine.adjacent, [8, 1]);
  assert.deepEqual(nine.ranked.map(({key}) => key), ['1', '8']);
  assert.equal(nine.dominant, 1);
});

test('low support abstains from type, instinct, and wing suggestions', () => {
  const result = engine.score(answersFor({1: 2, sp: 2}));
  assert.equal(result.primaryStatus, 'weak');
  assert.equal(result.primary, null);
  assert.equal(result.instinctStatus, 'weak');
  assert.equal(result.dominantInstinct, null);

  const wing = engine.getWing(1, {'2': 10, '9': 35});
  assert.equal(wing.status, 'weak');
  assert.equal(wing.dominant, null);
});

test('primary type and dominant instinct are determined independently', () => {
  const clearType = engine.score(answersFor({
    1: 5,
    2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2,
    sp: 3, so: 3, sx: 3
  }));
  assert.equal(clearType.primaryStatus, 'suggested');
  assert.equal(clearType.primary, 1);
  assert.equal(clearType.instinctStatus, 'close');
  assert.equal(clearType.dominantInstinct, null);

  const clearInstinct = engine.score(answersFor({
    1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3,
    sp: 5, so: 2, sx: 2
  }));
  assert.equal(clearInstinct.primaryStatus, 'close');
  assert.equal(clearInstinct.primary, null);
  assert.equal(clearInstinct.instinctStatus, 'suggested');
  assert.equal(clearInstinct.dominantInstinct, 'sp');
});

test('reverse-keyed items contribute in the same direction as direct items', () => {
  const result = engine.score(answersFor({1: 5, sp: 5}));
  assert.equal(result.scores['1'], 100);
  assert.equal(result.scores.sp, 100);

  for (const key of TYPE_KEYS.filter((key) => key !== '1')) assert.equal(result.scores[key], 0);
  for (const key of INSTINCT_KEYS.filter((key) => key !== 'sp')) assert.equal(result.scores[key], 0);
});

test('score rejects malformed, sparse, noninteger, boolean, and out-of-range answers', () => {
  const valid = Array(93).fill(3);
  const sparse = Array(93);

  for (const invalid of [
    null,
    {},
    valid.slice(0, 92),
    sparse,
    Object.assign([...valid], {[10]: 2.5}),
    Object.assign([...valid], {[10]: true}),
    Object.assign([...valid], {[10]: 0}),
    Object.assign([...valid], {[10]: 6})
  ]) {
    assert.throws(() => engine.score(invalid), /Expected 93 integer answers between 1 and 5/);
  }
});

test('saved state validation accepts a valid state and rejects invalid variants', () => {
  const base = {
    version: engine.VERSION,
    answers: Array(93).fill(null),
    index: 0,
    screen: 'quiz',
    updatedAt: '2026-09-16T10:00:00.000Z'
  };
  assert.equal(engine.validState(base), true);

  const complete = {...base, answers: Array(93).fill(3), screen: 'results'};
  assert.equal(engine.validState(complete), true);

  const invalidStates = [
    null,
    {...base, version: 'stale'},
    {...base, answers: Array(92).fill(null)},
    {...base, answers: Array(93)},
    {...base, answers: Object.assign(Array(93).fill(null), {[4]: 2.5})},
    {...base, answers: Object.assign(Array(93).fill(null), {[4]: false})},
    {...base, index: -1},
    {...base, index: 93},
    {...base, index: 1.5},
    {...base, screen: 'other'},
    {...base, updatedAt: 'not-a-date'},
    {...base, screen: 'results'}
  ];

  for (const state of invalidStates) assert.equal(engine.validState(state), false);
});


test('new motive comparisons are balanced, unique, and preserve all original questions', () => {
  assert.equal(new Set(engine.questions.map(q=>q.id)).size,93);
  const pairs=engine.questions.filter(q=>q.kind==='contrast');assert.equal(pairs.length,18);
  for(const key of TYPE_KEYS)assert.equal(pairs.filter(q=>q.pair.includes(Number(key))).length,4);
  for(const q of pairs){assert.equal(q.options.length,2);assert.equal(pairs.filter(other=>other.pair.includes(q.pair[0])&&other.pair.includes(q.pair[1])).length,2);}
  const old=JSON.parse(fs.readFileSync(path.join(__dirname,'validation/blind-questionnaire.json'),'utf8'));
  const items=Array.isArray(old)?old:old.questions;
  assert.equal(items.length,75);
  const strip=s=>s.replace(/[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g,'');
  for(let i=0;i<75;i++)assert.equal(engine.questions[i].text,strip(items[i].text),'legacy answer position preserved');
});

test('adjacent core and wing reversals are resolved symmetrically for all nine types', () => {
  for(let core=1;core<=9;core++)for(const neighbor of [core===1?9:core-1,core===9?1:core+1]){
    const answers=answersFor({[core]:4,[neighbor]:3});
    for(const [i,q] of engine.questions.entries())if(q.kind!=='contrast'&&Number(q.scale)===neighbor){
      const value=['1','2'].includes(q.id.split('-')[1])?5:4;
      answers[i]=q.reverse?6-value:value;
    }
    const r=engine.score(answers);
    assert.equal(Number(r.typeRanking[0].key),neighbor,'style score intentionally favors the wing');
    assert.equal(r.primary,core,`${core} and ${neighbor}: motive preference identifies core`);
    assert.equal(r.wing.dominant,neighbor);
  }
});

test('one neutral or contradictory comparison cannot force a core choice', () => {
  for(const value of [3,5]){
    const answers=answersFor({1:4,2:4});
    answers[engine.questions.findIndex(q=>q.id==='c10')]=5;
    answers[engine.questions.findIndex(q=>q.id==='c1')]=value;
    const r=engine.score(answers);
    assert.equal(r.primary,null);assert.equal(r.wing,null);
  }
});

test('a choice that depends on one original style answer stays unresolved', () => {
  const answers=answersFor({1:4,5:4});
  answers[engine.questions.findIndex(q=>q.id==='t5-1')]=1;
  answers[engine.questions.findIndex(q=>q.id==='t5-2')]=3;
  const r=engine.score(answers);
  assert.equal(r.primaryStatus,'unstable');assert.equal(r.primary,null);
});

test('nonadjacent close candidates cannot be decided by unrelated pair comparisons', () => {
  const r=engine.score(answersFor({1:5,5:5}));
  assert.equal(r.primary,null);assert.equal(r.wing,null);assert.ok(r.candidates.includes(1)&&r.candidates.includes(5));
});

test('weak wings are excluded, close strong wings are not called dominant', () => {
  for(let core=1;core<=9;core++) {
    const a=core===1?9:core-1,b=core===9?1:core+1;
    let w=engine.getWing(core,{[core]:95,[a]:50,[b]:10});
    assert.equal(w.dominant,null);assert.deepEqual(w.eligible,[]);
    w=engine.getWing(core,{[core]:100,[a]:65,[b]:10});
    assert.equal(w.dominant,null,'weak relative to core');
    w=engine.getWing(core,{[core]:95,[a]:80,[b]:10});
    assert.equal(w.dominant,a);assert.deepEqual(w.eligible,[a]);
    w=engine.getWing(core,{[core]:95,[a]:80,[b]:78});
    assert.equal(w.dominant,null);assert.equal(w.status,'close');assert.equal(w.eligible.length,2);
  }
});

test('75-answer saves migrate without losing answers or inventing answers to new items', () => {
  const old={version:'2.0.0',answers:Array(75).fill(4),index:74,screen:'results',updatedAt:'2026-09-16T10:00:00Z'};
  const migrated=engine.migrateState(old);
  assert.ok(engine.validState(migrated));assert.equal(migrated.screen,'quiz');assert.equal(migrated.index,75);
  assert.deepEqual(migrated.answers.slice(0,75),old.answers);
  assert.deepEqual(migrated.answers.slice(75),Array(18).fill(null));
  assert.equal(engine.migrateState({...old,answers:Array(74).fill(4)}),null);
  assert.equal(engine.migrateState({...old,answers:Array(75).fill(null)}),null);
  assert.equal(engine.migrateState({...old,version:'1.0.0'}),null);
  assert.equal(old.answers.length,75);
});

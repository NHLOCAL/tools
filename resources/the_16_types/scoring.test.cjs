const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {score, axes, hebrew} = require('./scoring.js');
const data = require('./questions.json');
const profiles = require('./profiles.json');
const q = data.questions;
const ideal = type => q.map(item => type.includes(item.aPole) ? 1 : 5);

test('64 unique interleaved items, 16 per axis, balanced option order', () => {
  assert.equal(q.length,64); assert.equal(data.chapters.length,8);
  assert.equal(new Set(q.map(x=>x.text)).size,64);
  q.forEach((item,i)=>{assert.equal(item.id,i+1);assert.ok(item.axis.includes(item.aPole));assert.ok(item.text&&item.a&&item.b);});
  for(const axis of axes){
    const items=q.filter(x=>x.axis===axis.id);assert.equal(items.length,16);
    assert.equal(items.filter(x=>x.aPole===axis.id[0]).length,8);
    assert.ok(new Set(items.map(x=>x.facet)).size>=4);
    for(let i=0;i<8;i++)assert.equal(q.slice(i*8,i*8+8).filter(x=>x.axis===axis.id).length,2);
  }
});
test('all Hebrew codes and type names exactly match the supplied table', () => {
  const table={ISTJ:['מקשג','המפקח / הלוגיסטיקן'],ISFJ:['מקרג','המגן'],INFJ:['מערג','הסנגור'],INTJ:['מעשג','האדריכל'],ISTP:['מקשפ','האומן / הווירטואוז'],ISFP:['מקרפ','ההרפתקן'],INFP:['מערפ','המתווך'],INTP:['מעשפ','הלוגיקאי / הפילוסוף'],ESTP:['חקשפ','היזם'],ESFP:['חקרפ','הבדרן'],ENFP:['חערפ','הפעיל / האקטיביסט'],ENTP:['חעשפ','הפולמוסן / המתווכח'],ESTJ:['חקשג','המנהל'],ESFJ:['חקרג','היועץ'],ENFJ:['חערג','הגיבור'],ENTJ:['חעשג','המפקד']};
  assert.deepEqual(Object.keys(profiles).sort(),Object.keys(table).sort());
  for(const [type,[he,name]] of Object.entries(table)){assert.equal(profiles[type].he,he);assert.equal(profiles[type].name,name);assert.equal([...type].map(c=>hebrew[c]).join(''),he);}
});
test('all 16 oriented profiles classify correctly at strong and moderate intensity', () => {
  for(const type of Object.keys(profiles)){
    const a=ideal(type),r=score(q,a);assert.equal(r.code,type);assert.deepEqual(r.candidates,[type]);
    assert.ok(r.axes.every(x=>Math.abs(x.sum)===32));assert.equal(score(q,a.map(v=>v===1?2:4)).code,type);
  }
});
test('midpoint and uniform position responses never receive an arbitrary type', () => {
  for(const value of [1,2,3,4,5]){const r=score(q,Array(64).fill(value));assert.equal(r.code,'XXXX');assert.equal(r.candidates.length,16);assert.ok(r.axes.every(a=>a.firstPercent===50));}
});
test('changing option order or item order preserves results', () => {
  const a=ideal('ISFP');a[0]=3;a[20]=2;
  const swap=q.map(item=>({...item,aPole:[...item.axis].find(x=>x!==item.aPole),a:item.b,b:item.a}));
  assert.deepEqual(score(swap,a.map(v=>6-v)),score(q,a));
  assert.deepEqual(score([...q].reverse(),[...a].reverse()),score(q,a));
});
test('a tied axis is X and alternatives expand only uncertain axes', () => {
  const a=ideal('ENTJ');q.forEach((item,i)=>{if(item.axis==='EI')a[i]=3;});
  const r=score(q,a);assert.equal(r.code,'XNTJ');assert.deepEqual(new Set(r.candidates),new Set(['ENTJ','INTJ']));
  const positions=q.flatMap((item,i)=>item.axis==='EI'?[i]:[]);
  for(const i of positions.slice(0,4))a[i]=ideal('ENTJ')[i];
  const boundary=score(q,a);assert.equal(boundary.axes[0].normalized,.25);assert.equal(boundary.candidates.length,2);
  a[positions[4]]=ideal('ENTJ')[positions[4]];assert.deepEqual(score(q,a).candidates,['ENTJ']);
});
test('invalid, incomplete, sparse and non-numeric answers are rejected', () => {
  for(const a of [null,[],Array(63).fill(3),Array(65).fill(3),Array(64),Array(64).fill(null),Array(64).fill('3'),Array(64).fill(0),Array(64).fill(6),Array(64).fill(2.5),Array(64).fill(NaN)])assert.throws(()=>score(q,a));
});
test('source and standalone assets contain no forbidden punctuation or external dependencies', () => {
  for(const file of ['page.html','questions.json','profiles.json','styles.css','scoring.js','app.js'])assert.ok(!/[\u2014\u05be]/u.test(fs.readFileSync(path.join(__dirname,file),'utf8')),file);
  const html=fs.readFileSync(path.join(__dirname,'../../tools/the_16_types.html'),'utf8');
  assert.ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"|@import|fetch\(/.test(html));
});
test('blind Sol medium regression fixtures match all 16 intended profiles', () => {
  const fixtures=require('./validation-fixtures.json');assert.equal(fixtures.profiles.length,16);
  assert.equal(new Set(fixtures.profiles.map(p=>p.target)).size,16);
  assert.equal(fixtures.questionHash,require('node:crypto').createHash('sha256').update(JSON.stringify(q)).digest('hex'));
  for(const p of fixtures.profiles)assert.equal(score(q,p.answers).code,p.target,p.target);
});

'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const engine=require('./engine.js');
const dir=path.join(__dirname,'validation/v3');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
// Freeze text content, independently of Git's Windows checkout line endings.
const sha=data=>crypto.createHash('sha256').update(data.toString().replace(/\r\n/g,'\n')).digest('hex');
const frozen=read('frozen.json');
assert.equal(sha(fs.readFileSync(path.join(__dirname,'engine.js'))),frozen.engineSHA256,'rules must match the pre-holdout freeze');
assert.equal(sha(fs.readFileSync(path.join(dir,'questionnaire.json'))),frozen.questionnaireSHA256);
const questions=read('questionnaire.json').questions;
assert.deepEqual(questions,engine.questions.map((q,i)=>({number:i+1,text:q.text,...(q.options?{options:{א:q.options[0],ב:q.options[1]}}:{})})));
const baselineSource=execFileSync('git',['show','a38bca1:resources/the_enneagram/engine.js'],{cwd:path.join(__dirname,'../..'),encoding:'utf8'});
const sandbox={module:{exports:{}}};vm.runInNewContext(baselineSource,sandbox);
const baseline=sandbox.module.exports;
const groups=[
  {name:'development_luna',model:'gpt-5.6-luna',effort:'high',expected:read('expected.json'),files:['a','b','c'].map(s=>`answers-round2-${s}.json`),holdout:false},
  {name:'replication_terra',model:'gpt-5.6-terra',effort:'medium',expected:read('expected.json'),files:['a','b','c'].map(s=>`terra-development-${s}.json`),holdout:false},
  {name:'holdout_luna',model:'gpt-5.6-luna',effort:'high',expected:read('holdout-expected.json'),files:Array.from({length:9},(_,i)=>`holdout-answers-${i+1}.json`),holdout:true},
  {name:'holdout_terra',model:'gpt-5.6-terra',effort:'medium',expected:read('holdout-expected.json'),files:['a','b','c'].map(s=>`terra-answers-${s}.json`),holdout:true}
];
const classify=(actual,expected)=>actual===expected?'match':actual==null?'abstain':'mismatch';
const summarize=(rows,field,version)=>{
  const counts={match:0,abstain:0,mismatch:0};
  for(const r of rows){
    if(!Object.hasOwn(r.expected,field))continue;
    const outcome=classify(r[version][field],r.expected[field]);
    counts[field==='wing'&&outcome==='match'&&r[version].primary!==r.expected.primary?'mismatch':outcome]++;
  }
  return counts;
};
const results=groups.map(group=>{
  const cases=group.files.flatMap(file=>read(file).cases.map(c=>({...c,file})));
  assert.deepEqual(cases.map(c=>c.id).sort(),Object.keys(group.expected).sort());
  const rows=cases.map(c=>{
    assert.equal(c.answers.length,93,c.id);assert.ok(c.answers.every(v=>Number.isInteger(v)&&v>=1&&v<=5),c.id);
    if(group.name!=='development_luna'){
      assert.equal(c.choices.length,18,c.id);
      for(let i=0;i<18;i++){
        const choice=c.choices[i],rating=c.answers[i+75];
        assert.equal(choice.number,i+76,c.id);
        assert.equal(choice.option,rating<3?'א':rating>3?'ב':'שווה',`${c.id}: comparison encoding`);
      }
    }
    const r=engine.score(c.answers),old=baseline.score(c.answers.slice(0,75));
    // The same original answers must produce exactly the same instinct results.
    for(const key of ['sp','so','sx'])assert.equal(r.scores[key],old.scores[key]);
    assert.equal(r.dominantInstinct,old.dominantInstinct);
    const compact=x=>({primary:x.primary,wing:x.wing?.dominant??null,dominantInstinct:x.dominantInstinct});
    return {id:c.id,file:c.file,expected:group.expected[c.id],actual:compact(r),baseline:compact(old),status:r.primaryStatus,
      candidates:r.candidates,styles:r.typeRanking,comparisons:r.comparisons,wing:r.wing,unclearItems:c.unclearItems||[]};
  });
  return {name:group.name,model:group.model,effort:group.effort,holdout:group.holdout,
    summary:Object.fromEntries(['primary','wing','dominantInstinct'].map(field=>[field,{current:summarize(rows,field,'actual'),baseline:summarize(rows,field,'baseline')}])),rows};
});
const output={version:engine.VERSION,frozen,baselineCommit:'a38bca1',baselineSHA256:sha(baselineSource),
  limitations:'Synthetic role-play checks, not human validation. Development personas influenced general decision-rule revisions; holdout answers and Terra replication did not. Wings were specified only in development personas. Three Luna holdout files needed format completion or numeric/choice reconciliation by their original respondents, without score feedback. Terra replication drafts also needed numeric/text reconciliation before completion; see format-corrections.json. Hashes normalize CRLF to LF.',
  responseSHA256:Object.fromEntries(groups.flatMap(g=>g.files).map(file=>[file,sha(fs.readFileSync(path.join(dir,file)))])),groups:results};
fs.writeFileSync(path.join(dir,'final-report.json'),JSON.stringify(output,null,2)+'\n');
const lines=['# Frozen-rule blind evaluation','',output.limitations,'','| Group | Core matches | Abstentions | Mismatches | Baseline matches / abstentions / mismatches |','| --- | ---: | ---: | ---: | --- |'];
for(const g of results){const c=g.summary.primary.current,b=g.summary.primary.baseline;lines.push(`| ${g.name} | ${c.match} | ${c.abstain} | ${c.mismatch} | ${b.match} / ${b.abstain} / ${b.mismatch} |`);}
lines.push('','| Group with specified wings | Full core + wing matches | No wing | Wrong core or wing |','| --- | ---: | ---: | ---: |');
for(const g of results.filter(g=>!g.holdout)){const w=g.summary.wing.current;lines.push(`| ${g.name} | ${w.match} | ${w.abstain} | ${w.mismatch} |`);}
lines.push('','No expected wing was assigned to holdout personas; their wing results are not counted as successes. Instinct scores match the baseline exactly for identical answers.','');
fs.writeFileSync(path.join(dir,'final-report.md'),lines.join('\n'));
console.log(JSON.stringify(results.map(({name,summary})=>({name,summary})),null,2));

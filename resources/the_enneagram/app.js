(function () {
  'use strict';
  const E=window.Enneagram;
  const $=id=>document.getElementById(id);
  const KEYS={draft:'nh-enneagram-v2-draft',result:'nh-enneagram-v2-result',prefs:'nh-enneagram-v2-prefs'};
  const chapters=['מבט פנימה','בחיי היומיום','בין אנשים','מתחת לפני השטח','התמונה מתחברת','מה מניע אותי'];
  const labels=['בכלל לא','מעט','במידה בינונית','במידה רבה','מאוד'];
  let answers=Array(E.questions.length).fill(null), index=0, currentScreen='start', result=null;
  let completedAt=null, autoSave=true, theme='light', pendingAction=null, focusBeforeDialog=null;
  let draft=null, saved=null;
  const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const round=n=>Math.round(n);
  const dateText=s=>new Date(s).toLocaleString('he-IL',{dateStyle:'medium',timeStyle:'short'});
  function notice(message){$('notice').textContent=message;$('notice').hidden=!message;}
  function read(key){
    let text;
    try {text=localStorage.getItem(key);}
    catch {notice('לא ניתן לקרוא את השמירה המקומית. אפשר להמשיך במבחן ולהוריד דוח בסיום.');return null;}
    if(!text)return null;
    try{return JSON.parse(text);}
    catch {const removed=remove(key);notice(removed?'נתוני שמירה פגומים הוסרו. אפשר להתחיל מחדש; שמירות תקינות אחרות נשארו זמינות.':'נמצאו נתוני שמירה פגומים שלא ניתן להסיר. אפשר להתחיל מחדש ולהוריד דוח בסיום.');return null;}
  }
  function write(key,value){
    try {localStorage.setItem(key,JSON.stringify(value));return true;}
    catch {notice('השמירה במכשיר אינה זמינה. אפשר להמשיך כל עוד העמוד פתוח ולהוריד את הדוח בסיום.');return false;}
  }
  function remove(key){try{localStorage.removeItem(key);return true;}catch{return false;}}
  function getStoredState(key){const value=read(key);if(value===null)return null;if(E.validState(value))return value;const migrated=E.migrateState(value);if(migrated){write(key,migrated);notice('התשובות הקודמות נשמרו. נוספו 18 שאלות, ויש להשלים אותן לפני חישוב תוצאה מעודכנת.');return migrated;}remove(key);notice('נמצאה שמירה ישנה או לא תקינה שלא ניתן לשחזר. אפשר להתחיל מבחן חדש.');return null;}
  function snapshot(screen=currentScreen){return{version:E.VERSION,answers:[...answers],index,screen:screen==='results'?'results':'quiz',updatedAt:completedAt||new Date().toISOString()};}
  function storeDraft(){
    if(!autoSave){$('save-status').textContent='';return false;}
    const value=snapshot();const ok=write(KEYS.draft,value);
    if(ok)draft=value;
    $('save-status').textContent=ok?'':'לא נשמר. אפשר להמשיך בעמוד הזה';
    return ok;
  }
  function setScreen(name,focusId){
    currentScreen=name;
    ['start','quiz','results'].forEach(id=>$(id+'-screen').hidden=id!==name);
    $('about-panel').hidden=true;
    $('about-btn').setAttribute('aria-expanded','false');
    if(focusId)$(focusId).focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }
  function updateHome(){
    $('resume-box').hidden=!draft;
    if(draft){const count=draft.answers.filter(v=>v!==null).length;$('resume-text').textContent=draft.screen==='results'?'המבחן האחרון הושלם. אפשר לחזור לתוצאה.':`כבר ענית על ${count} מתוך ${E.questions.length} שאלות`;$('resume-btn').textContent=draft.screen==='results'?'לחזור לתוצאה האחרונה':'להמשיך מהמקום שעצרתי';}
    $('saved-box').hidden=!saved;
    if(saved){$('saved-text').textContent=saved.screen==='results'?`תוצאה שמורה במכשיר מ-${dateText(saved.updatedAt)}`:'התשובות מהגרסה הקודמת נשמרו';$('saved-btn').textContent=saved.screen==='results'?'לתוצאה השמורה':'להשלמת השאלות החדשות';}
  }
  function confirmAction(title,description,label,action){
    pendingAction=action;focusBeforeDialog=document.activeElement;
    $('confirm-title').textContent=title;$('confirm-description').textContent=description;$('confirm-ok').textContent=label;
    $('confirm-dialog').showModal();$('confirm-cancel').focus();
  }
  function dismissDialog(){pendingAction=null;$('confirm-dialog').close();focusBeforeDialog?.focus();}
  $('confirm-cancel').addEventListener('click',dismissDialog);
  $('confirm-dialog').addEventListener('cancel',()=>{pendingAction=null;});
  $('confirm-ok').addEventListener('click',()=>{const action=pendingAction;pendingAction=null;$('confirm-dialog').close();action?.();});
  function startFresh(){
    answers=Array(E.questions.length).fill(null);index=0;result=null;completedAt=null;draft=null;
    if(!remove(KEYS.draft))notice('לא ניתן למחוק את השמירה הקודמת כרגע. המבחן החדש פתוח ואפשר לענות עליו.');
    setScreen('quiz');showQuestion();storeDraft();
  }
  function requestNew(){
    if(draft||answers.some(v=>v!==null))confirmAction('להתחיל מבחן חדש?','ההתקדמות הנוכחית תוחלף. תוצאה ששמרת בנפרד תישאר זמינה.','להתחיל מחדש',startFresh);
    else startFresh();
  }
  function restore(value){
    if(!E.validState(value)){notice('לא ניתן לשחזר את הנתונים האלה. אפשר להתחיל מבחן חדש.');return;}
    answers=[...value.answers];index=value.index;completedAt=value.screen==='results'?value.updatedAt:null;
    if(value.screen==='results')showResults(false);else{setScreen('quiz');showQuestion();}
  }
  function renderWheel(){
    const coords={};
    for(let n=1;n<=9;n++){const angle=((n%9)*40-90)*Math.PI/180;coords[n]={x:50+38*Math.cos(angle),y:50+38*Math.sin(angle)};}
    const linePath=sequence=>sequence.map((n,i)=>`${i?'L':'M'}${coords[n].x} ${coords[n].y}`).join(' ');
    $('intro-wheel').innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" opacity=".25" stroke-width=".35"/><path d="${linePath([9,3,6,9])} ${linePath([1,4,2,8,5,7,1])}" stroke="currentColor" opacity=".2" stroke-width=".35" fill="none"/></svg><div class="wheel-center"><strong>מאחורי<br>הבחירות שלך</strong><span>מפת האניאגרמה</span></div>`;
    for(let n=1;n<=9;n++){
      const button=document.createElement('button');button.className='wheel-node';button.style.left=coords[n].x+'%';button.style.top=coords[n].y+'%';button.textContent=n;button.setAttribute('aria-label',`טיפוס ${n}, ${E.types[n].name}`);button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>{document.querySelectorAll('.wheel-node').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('type-preview-title').textContent=`${n} · ${E.types[n].name}`;$('type-preview-text').textContent=E.types[n].theme;});
      $('intro-wheel').appendChild(button);
    }
    $('type-preview-title').parentElement.setAttribute('aria-live','polite');
  }
  function showQuestion(){
    const question=E.questions[index];
    const chapter=Math.min(chapters.length-1,Math.floor(index/15)), answered=answers.filter(v=>v!==null).length;
    $('pause-btn').textContent=autoSave?'שמירה ויציאה':'יציאה מהמבחן';
    $('question-text').textContent=question.text;
    const paired=question.kind==='contrast';
    $('answers-form').classList.toggle('paired-question',paired);
    $('contrast-options').hidden=!paired;
    $('contrast-options').innerHTML=paired?question.options.map((text,i)=>`<div><b>${i?'ב':'א'}</b><p>${escapeHtml(text)}</p></div>`).join(''):'';
    $('answer-hint').textContent=paired?'מה מתאר אותך יותר?':'עד כמה זה מתאר אותך?';
    const currentLabels=paired?['א בבירור','יותר א','שניהם או אף אחד','יותר ב','ב בבירור']:labels;
    $('question-counter').textContent=`שאלה ${index+1} מתוך ${E.questions.length}`;
    $('chapter-name').textContent=`חלק ${chapter+1} מתוך ${chapters.length} · ${chapters[chapter]}`;
    $('progress').value=answered;$('progress').setAttribute('aria-valuetext',`${answered} מתוך ${E.questions.length} שאלות נענו`);
    $('chapter-list').innerHTML=chapters.map((name,i)=>`<li${i===chapter?' aria-current="step"':''} class="${i<chapter?'done':''}"><span>${i+1}</span>${name}</li>`).join('');
    $('answers-container').innerHTML=currentLabels.map((label,i)=>`<label class="answer-label"><input type="radio" name="answer" value="${i+1}" aria-label="${i+1}, ${label}"${answers[index]===i+1?' checked':''}><span class="answer-dot" aria-hidden="true"></span><span>${label}</span></label>`).join('');
    $('prev-btn').disabled=index===0;$('next-btn').textContent=index===E.questions.length-1?'למפה האישית שלי ←':'הבא ←';
    $('error-msg').hidden=true;
    $('question-text').focus({preventScroll:true});
  }
  $('answers-container').addEventListener('change',event=>{
    if(event.target.name!=='answer')return;
    answers[index]=Number(event.target.value);completedAt=null;result=null;$('error-msg').hidden=true;storeDraft();
    const count=answers.filter(v=>v!==null).length;$('progress').value=count;$('progress').setAttribute('aria-valuetext',`${count} מתוך ${E.questions.length} שאלות נענו`);
  });
  $('answers-form').addEventListener('submit',event=>{
    event.preventDefault();
    if(answers[index]===null){$('error-msg').hidden=false;document.querySelector('input[name=answer]').focus();return;}
    if(index<E.questions.length-1){index++;storeDraft();showQuestion();}else showResults(true);
  });
  $('prev-btn').addEventListener('click',()=>{if(index>0){index--;storeDraft();showQuestion();}});
  document.addEventListener('keydown',event=>{
    if(currentScreen!=='quiz'||$('confirm-dialog').open||!$('about-panel').hidden||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='Enter'&&(document.activeElement?.matches('input[name=answer]')||document.activeElement===$('question-text'))){event.preventDefault();$('answers-form').requestSubmit();return;}
    if(/^[1-5]$/.test(event.key)){
      const radio=document.querySelector(`input[name=answer][value="${event.key}"]`);
      if(radio){event.preventDefault();radio.checked=true;radio.focus();radio.dispatchEvent(new Event('change',{bubbles:true}));}
    }
  });
  function mainTitle(r){
    if(r.primary)return`טיפוס ${r.primary} · ${E.types[r.primary].name}`;
    if(r.primaryStatus==='undifferentiated')return'עוד אין כאן כיוון מוביל';
    if(r.primaryStatus==='weak')return'ההתאמה לטיפוסים נמוכה';
    if(r.primaryStatus==='mixed')return'כדאי להבחין בין הסגנון למניע';
    if(r.primaryStatus==='unstable')return'הכיוון המוביל עדיין לא יציב';
    return'כמה כיוונים קרובים זה לזה';
  }
  function mainDescription(r){
    if(r.primary)return E.types[r.primary].description;
    if(r.primaryStatus==='undifferentiated')return'כל התשובות זהות. אפשר לחזור לשאלות או להכיר את הטיפוסים בהמשך.';
    if(r.primaryStatus==='weak')return'לא בלט טיפוס מסוים בתשובות שלך.';
    return`כדאי להשוות בין ${r.candidates.map(n=>`${n} (${E.types[n].name})`).join(', ')} ולבדוק איזה מניע מוכר לך יותר.`;
  }
  function wingTitle(r){
    if(!r.primary)return'כדאי לברר קודם את הטיפוס המוביל';
    if(r.wing.dominant)return`כנף בולטת: ${r.primary}w${r.wing.dominant}`;
    return'לא נמצאה כנף מובחנת';
  }
  function wingDescription(r){
    if(!r.primary)return'נבחר כנף רק לאחר שתתבהר ההבחנה בין הטיפוסים.';
    if(r.wing.status==='weak')return'ההתאמה לשכנים נמוכה מכדי להציג כנף בולטת.';
    if(r.wing.status==='close')return'אין העדפה ברורה בין השכנים.';
    return'';
  }
  function renderWing(r){
    let html=`<h3>${wingTitle(r)}</h3>${wingDescription(r)?`<p style="margin-top:13px">${wingDescription(r)}</p>`:''}`;
    if(r.primary&&r.wing.eligible.length)html+=`<div class="wing-choices">${r.wing.eligible.map(n=>`<div class="wing-choice ${n===r.wing.dominant?'suggested':''}"><h3><bdi>${r.primary}w${n}</bdi></h3><div class="wing-score">התאמה לטיפוס ${n}: ${round(r.scores[n])} מתוך 100</div><p>${E.wingNotes[`${r.primary}w${n}`]}</p>${n===r.wing.dominant?'<span class="result-badge">הגוון הבולט</span>':''}</div>`).join('')}</div>`;
    $('wing-result').innerHTML=html;
  }
  function instinctTitle(r){
    if(r.instinctStatus==='undifferentiated')return'אין הבחנה בין תחומי הקשב';
    if(r.instinctStatus==='weak')return'לא נמצא תחום קשב מוביל';
    if(!r.dominantInstinct)return'כמה תחומי קשב קיבלו ציונים קרובים';
    if(r.stackClear)return`סדר משוער: ${r.instinctRanking.map(t=>E.instincts[t.key].code).join(' / ')}`;
    return`הכיוון המוביל: ${E.instincts[r.dominantInstinct].name}`;
  }
  function instinctCaution(r){
    if(r.uniform)return'מענה אחיד אינו מספיק כדי לזהות העדפה.';
    if(r.instinctStatus==='weak'||!r.dominantInstinct)return'';
    if(!r.stackClear)return'שני התחומים האחרים קרובים זה לזה.';
    return'';
  }
  function renderInstincts(r){
    $('instinct-result').innerHTML=`<div class="instinct-summary">${r.stackClear?`<bdi>${instinctTitle(r)}</bdi>`:instinctTitle(r)}</div>${instinctCaution(r)?`<p style="margin-bottom:24px">${instinctCaution(r)}</p>`:''}<div class="instinct-grid">${r.instinctRanking.map(({key,score})=>{const data=E.instincts[key];return`<div class="instinct-item"><h3>${data.name} <bdi>(${data.code})</bdi></h3><div class="score-row"><div class="score-track"><div class="score-fill" style="width:${score}%"></div></div><span class="score-value">${round(score)}</span></div><p>${data.description.split('. ')[0]}.</p>${key===r.dominantInstinct?`<p><strong>נקודה להתבוננות:</strong> ${data.practice}</p>`:''}</div>`;}).join('')}</div>`;
  }
  function showType(n){
    const data=E.types[n],neighbors=[n===1?9:n-1,n===9?1:n+1];
    document.querySelectorAll('.type-tab').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.type)===n)));
    $('type-detail').innerHTML=`<h3>${n} · ${data.name}: ${data.theme}</h3><p>מכונה גם: ${data.aliases.join(', ')}</p><p>${data.description}</p><div class="detail-grid"><div><h3>מה הדפוס מאפשר</h3><p>${data.strength}</p></div><div><h3>מה עלול לגבות מחיר</h3><p>${data.cost}</p></div></div><div class="practice"><h3>ניסוי קטן לשבוע הקרוב</h3><p>${data.practice}</p><p class="reflection">${data.reflection}</p></div><details style="margin-top:20px"><summary>שתי הכנפיים של טיפוס ${n}</summary>${neighbors.map(w=>`<p><strong><bdi>${n}w${w}</bdi>:</strong> ${E.wingNotes[`${n}w${w}`]}</p>`).join('')}</details>`;
  }
  function showResults(persist){
    if(answers.some(v=>v===null)){index=answers.indexOf(null);setScreen('quiz');showQuestion();notice('נשארה שאלה ללא תשובה. נשלים אותה לפני חישוב המפה.');return;}
    result=E.score(answers);completedAt=completedAt||new Date().toISOString();
    const r=result;
    $('result-date').textContent=`${E.questions.length} תשובות · ${dateText(completedAt)}`;
    $('result-summary').innerHTML=`<div class="result-number">${r.primary||'?'}<small>${r.primary?'הכיוון המוביל בתשובות':'מרחב לבדיקה נוספת'}</small></div><div><h2>${mainTitle(r)}</h2><p>${mainDescription(r)}</p></div>`;
    $('type-scores').innerHTML=r.typeRanking.map(({key,score})=>`<div class="score-row ${Number(key)===r.primary?'leading':''}"><span class="score-label"><b>${key}</b> ${E.types[key].name}</span><div class="score-track" aria-hidden="true"><div class="score-fill" style="width:${score}%"></div></div><span class="score-value" aria-label="${round(score)} מתוך 100">${round(score)}</span></div>`).join('');
    renderWing(r);renderInstincts(r);
    $('instinct-result').querySelectorAll('.score-value').forEach(node=>node.setAttribute('aria-label',`${node.textContent} מתוך 100`));
    $('explore-types').innerHTML=Object.keys(E.types).map(n=>`<button class="type-tab" data-type="${n}" aria-label="קריאה על טיפוס ${n}, ${E.types[n].name}" aria-pressed="false">${n}</button>`).join('');
    $('explore-types').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>showType(Number(b.dataset.type))));
    showType(r.primary||Number(r.typeRanking[0].key));
    $('export-status').textContent='';
    setScreen('results','results-title');if(persist)storeDraft();
  }
  function reportData(){
    return {schema:'nh-enneagram-result',version:E.VERSION,createdAt:completedAt,questionCount:E.questions.length,
      note:'כלי להתבוננות עצמית, לא אבחון פסיכולוגי. הציונים אינם הסתברויות. השאלון לא עבר תיקוף על מדגם אנושי.',
      scoring:{typeGap:E.TYPE_GAP,coreWindow:E.CORE_WINDOW,pairMinimum:E.PAIR_MIN,requireLeaveOneOutStability:true,wingGap:E.WING_GAP,wingMinimum:E.WING_MIN,wingRatio:E.WING_RATIO,instinctGap:E.INSTINCT_GAP},
      typeLabels:Object.fromEntries(Object.entries(E.types).map(([key,{name,aliases}])=>[key,{name,aliases}])),
      result,answers:E.questions.map((q,i)=>({id:q.id,question:q.text,...(q.options?{options:q.options,responseScale:['א בבירור','יותר א','שניהם או אף אחד','יותר ב','ב בבירור']}:{responseScale:labels}),answer:answers[i]})),
      explanations:{title:mainTitle(result),description:mainDescription(result),wing:wingTitle(result),wingExplanation:wingDescription(result),instincts:instinctTitle(result),instinctCaution:instinctCaution(result)},
      sources:['https://www.enneagraminstitute.com/how-the-enneagram-system-works/','https://www.enneagraminstitute.com/type-descriptions/','https://pubmed.ncbi.nlm.nih.gov/33332604/','https://www.enneagraminstitute.com/interpreting-your-enneagram-test-results/','https://www.pewresearch.org/writing-survey-questions/']};
  }
  function reportHtml(){
    const r=result, data=reportData();
    const typeRows=r.typeRanking.map(({key,score})=>`<tr><td>${key} · ${E.types[key].name}</td><td>${round(score)}</td></tr>`).join('');
    const wingHtml=r.primary?r.wing.eligible.map(n=>`<p><strong><bdi>${r.primary}w${n}</bdi>:</strong> ${E.wingNotes[`${r.primary}w${n}`]} (התאמה לטיפוס ${n}: ${round(r.scores[n])})</p>`).join(''):'';
    const descriptions=r.typeRanking.slice(0,3).map(({key})=>{const t=E.types[key];return`<section><h3>טיפוס ${key} · ${t.name}</h3><p>מכונה גם: ${t.aliases.join(', ')}</p><p>${t.description}</p><p><strong>משאב:</strong> ${t.strength}</p><p><strong>אתגר:</strong> ${t.cost}</p><p><strong>ניסוי קטן:</strong> ${t.practice}</p><p><strong>שאלה למחשבה:</strong> ${t.reflection}</p></section>`;}).join('');
    const limitations='הציונים בסולם 0 עד 100 מתארים התאמה לתשובות, ולא הסתברות או אחוזי ודאות. הספים הם כללי תצוגה של הכלי, לא ערכים מתוקפים מחקרית. ציוני הסגנונות הם ממוצעי שש האמירות המקוריות לכל טיפוס. 18 ההשוואות אינן מתווספות לממוצע הזה. נבחנים טיפוסים עם ציון של 50 לפחות ועד 15 נקודות מהמוביל. בין מועמדים שכנים נדרשת העדפה באותו כיוון בשתי ההשוואות, בממוצע של 75 לפחות. תשובה ניטרלית משאירה את ההשוואה פתוחה. מועמד לא ייבחר אם השוואה ישירה מעדיפה אחד משכניו. כשנותר מועמד יחיד, אין דרישה להעדפה מול כל חלופה רחוקה, אך סתירה מפורשת עדיין מונעת הכרעה. חלופות שאינן שכנות וקרובות בפחות מ-8 נקודות נשארות פתוחות. הבחירה נדרשת להישאר גם בהשמטת כל אמירת סגנון בודדת. זו בדיקת רגישות, לא מדד לביטחון סטטיסטי. כנף דורשת ציון של 62.5 לפחות, לפחות 75% מציון הטיפוס המוביל ופער של 8 לפחות מהשכן השני. שכנים מתחת לסף אינם מוצגים ככנפיים אישיות. מענה אחיד אינו מוכרע. סדר מלא של אינסטינקטים דורש פער של 8 נקודות גם בין השני לשלישי. השאלון לא עבר תיקוף על מדגם אנושי. סקירת המחקר מצאה ראיות מעורבות לתוקף האניאגרמה ומעט תמיכה בכנפיים. זה אינו שאלון רשמי של Enneagram Institute.';
    return`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>המפה האישית שלי | אניאגרמה</title><style>body{font:18px/1.75 'Segoe UI',Arial,sans-serif;color:#29263d;max-width:850px;margin:35px auto;padding:0 25px;background:#fff}h1,h2,h3{line-height:1.3}h1{font-size:38px;color:#5443a8}h2{margin-top:35px}section{break-inside:avoid;border-top:1px solid #ddd;padding-top:15px;margin-top:22px}table{width:100%;border-collapse:collapse}th,td{text-align:start;border-bottom:1px solid #ddd;padding:9px}header{padding-bottom:20px;border-bottom:2px solid #5443a8}.note{font-size:15px;color:#555}a{color:#443387;overflow-wrap:anywhere}bdi{unicode-bidi:isolate}@media print{body{font-size:11pt;margin:0;padding:0}h1{font-size:26pt}h2{font-size:19pt}@page{size:A4;margin:17mm}}</style></head><body><header><h1>המפה האישית שלי</h1><p>${escapeHtml(dateText(completedAt))} · ${E.questions.length} תשובות · גרסה ${E.VERSION}</p></header><h2>${mainTitle(r)}</h2><p>${mainDescription(r)}</p><h2>הסגנונות בתשובות שלך</h2><table><thead><tr><th>טיפוס</th><th>ציון (0-100)</th></tr></thead><tbody>${typeRows}</tbody></table><section><h2>${wingTitle(r)}</h2><p>${wingDescription(r)}</p>${wingHtml}</section><section><h2>האינסטינקטים</h2><h3>${instinctTitle(r)}</h3><p>${instinctCaution(r)}</p>${r.instinctRanking.map(({key,score})=>`<h3>${E.instincts[key].name} <bdi>(${E.instincts[key].code})</bdi> · ${round(score)}</h3><p>${E.instincts[key].description}</p><p>${E.instincts[key].practice}</p>`).join('')}</section><h2>${r.primary?'כיוונים להמשך התבוננות':'תיאורים להתחלת בירור, ללא הכרעה'}</h2><p class="note">${r.primary?'שלושת הציונים הגבוהים בתשובות.':'מוצגים שלושה מתוך תשעת הטיפוסים, לפי סדר הציונים. בתיקו הסדר מספרי ואינו מעיד על התאמה עדיפה.'}</p>${descriptions}<section><details><summary>על המבחן והשיטה</summary><p class="note">${data.note} ${limitations}</p><ul>${data.sources.map((url,i)=>`<li><a href="${url}" rel="noopener noreferrer">${['מבנה האניאגרמה, כנפיים ואינסטינקטים','תשעת הטיפוסים','Hook ועמיתיו, סקירה שיטתית, 2021','פירוש תוצאות והבחנה בין טיפוס לכנף','Pew Research Center: ניסוח שאלות'][i]}</a></li>`).join('')}</ul></details></section></body></html>`;
  }
  function download(content,type,extension){
    try{
      const blob=new Blob([extension==='json'?'':'\uFEFF',content],{type});const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=`enneagram-${completedAt.slice(0,10)}.${extension}`;document.body.append(link);link.click();link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),15000);
      $('export-status').textContent=extension==='html'?'הדוח נוצר והועבר לדפדפן להורדה. אפשר לפתוח אותו גם ללא חיבור לרשת.':'קובץ הנתונים נוצר והועבר לדפדפן להורדה. הוא כולל גם את התשובות המלאות.';
    }catch{$('export-status').textContent='ההורדה לא הצליחה. אפשר לנסות שוב או להשתמש בהדפסה / PDF.';}
  }
  $('download-btn').addEventListener('click',()=>download(reportHtml(),'text/html;charset=utf-8','html'));
  $('json-btn').addEventListener('click',()=>download(JSON.stringify(reportData(),null,2),'application/json;charset=utf-8','json'));
  $('print-btn').addEventListener('click',()=>{
    // Print the same complete, script-free report as the download, including methodology.
    const frame=document.createElement('iframe');frame.title='דוח אישי להדפסה';frame.style.cssText='position:fixed;width:1px;height:1px;left:-10000px;border:0';
    const dispose=()=>{frame.remove();};
    frame.addEventListener('load',()=>{try{frame.contentWindow.addEventListener('afterprint',dispose,{once:true});frame.contentWindow.focus();frame.contentWindow.print();}catch{dispose();$('export-status').textContent='לא ניתן לפתוח הדפסה. אפשר להוריד את הדוח ולפתוח אותו בדפדפן.';}});
    frame.srcdoc=reportHtml();document.body.append(frame);window.setTimeout(dispose,120000);
  });
  $('save-result-btn').addEventListener('click',()=>{
    const value=snapshot('results');
    if(write(KEYS.result,value)){saved=value;$('export-status').textContent='התוצאה נשמרה במכשיר הזה. אפשר לפתוח אותה שוב ממסך הפתיחה.';}
    else $('export-status').textContent='התוצאה לא נשמרה במכשיר. מומלץ להוריד את הדוח.';
  });
  $('clear-btn').addEventListener('click',()=>confirmAction('למחוק את הנתונים השמורים?','ההתקדמות והתוצאה יימחקו מהדפדפן הזה. קבצים שכבר הורדת יישארו במכשיר.','למחוק',()=>{
    const removedDraft=remove(KEYS.draft),removedResult=remove(KEYS.result);
    if(removedDraft)draft=null;if(removedResult)saved=null;
    autoSave=false;$('auto-save').checked=false;write(KEYS.prefs,{autoSave,theme});
    $('export-status').textContent=removedDraft&&removedResult?'הנתונים השמורים נמחקו והשמירה האוטומטית כובתה. התוצאה נשארת פתוחה עד סגירת העמוד.':'לא כל הנתונים נמחקו. אפשר למחוק את נתוני האתר דרך הגדרות הדפדפן.';
  }));
  $('auto-save').addEventListener('change',()=>{
    autoSave=$('auto-save').checked;write(KEYS.prefs,{autoSave,theme});
    if(!autoSave){if(remove(KEYS.draft)){draft=null;updateHome();notice('השמירה האוטומטית כובתה וההתקדמות השמורה נמחקה. תוצאה שנשמרה בנפרד נשארת זמינה.');}else notice('השמירה כובתה, אך לא ניתן למחוק את ההתקדמות שכבר נשמרה. אפשר למחוק נתוני אתר בהגדרות הדפדפן.');}
  });
  function applyTheme(){document.documentElement.dataset.theme=theme;$('theme-btn').setAttribute('aria-label',theme==='dark'?'מעבר לתצוגה בהירה':'מעבר לתצוגה כהה');}
  $('theme-btn').addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';applyTheme();write(KEYS.prefs,{autoSave,theme});});
  $('start-btn').addEventListener('click',requestNew);$('restart-btn').addEventListener('click',requestNew);
  $('resume-btn').addEventListener('click',()=>restore(draft));$('saved-btn').addEventListener('click',()=>restore(saved));
  $('edit-btn').addEventListener('click',()=>{index=0;completedAt=null;setScreen('quiz');showQuestion();storeDraft();});
  function goHome(){updateHome();setScreen('start','start-title');}
  function pause(){
    if(autoSave&&storeDraft()){goHome();notice('ההתקדמות נשמרה. אפשר לחזור דרך כפתור ההמשך.');}
    else confirmAction('לצאת למסך הפתיחה?','השמירה המקומית אינה פעילה או אינה זמינה. נשמור את התשובות בזיכרון של העמוד הזה בלבד, עד לסגירה או לרענון.','לחזור לפתיחה',()=>{draft=snapshot();goHome();});
  }
  $('pause-btn').addEventListener('click',pause);
  $('home-link').addEventListener('click',event=>{event.preventDefault();if(currentScreen==='quiz')pause();else goHome();});
  $('about-btn').setAttribute('aria-expanded','false');$('about-btn').setAttribute('aria-controls','about-panel');
  $('about-btn').addEventListener('click',()=>{$('about-panel').hidden=!$('about-panel').hidden;$('about-btn').setAttribute('aria-expanded',String(!$('about-panel').hidden));if(!$('about-panel').hidden){$('about-title').focus();$('about-panel').scrollIntoView({block:'start'});}});
  $('close-about-btn').addEventListener('click',()=>{$('about-panel').hidden=true;$('about-btn').setAttribute('aria-expanded','false');$('about-btn').focus();});
  window.addEventListener('beforeunload',event=>{if(currentScreen==='quiz'&&answers.some(v=>v!==null)&&(!autoSave||!storeDraft())){event.preventDefault();event.returnValue='';}});
  const prefs=read(KEYS.prefs);
  if(prefs&&typeof prefs.autoSave==='boolean')autoSave=prefs.autoSave;
  theme=prefs&&['light','dark'].includes(prefs.theme)?prefs.theme:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  $('auto-save').checked=autoSave;applyTheme();draft=getStoredState(KEYS.draft);saved=getStoredState(KEYS.result);renderWheel();updateHome();
})();

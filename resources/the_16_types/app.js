(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const questions = MBTI_DATA.questions;
  const key = 'nhlocal.16-types.v1';
  const themeKey = 'nhlocal.16-types.theme';
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  let explicitTheme = null;
  try { const saved = localStorage.getItem(themeKey); if (saved === 'light' || saved === 'dark') explicitTheme = saved; } catch {}
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    $('theme-toggle').setAttribute('aria-pressed', String(dark));
    $('theme-toggle').title = dark ? 'מעבר למצב בהיר' : 'מעבר למצב אפל';
    $('theme-color').content = dark ? '#171d28' : '#fcf7f1';
  }
  applyTheme(explicitTheme || (systemTheme.matches ? 'dark' : 'light'));
  $('theme-toggle').addEventListener('click', () => {
    explicitTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(explicitTheme);
    try { localStorage.setItem(themeKey, explicitTheme); } catch {}
  });
  systemTheme.addEventListener('change', event => { if (!explicitTheme) applyTheme(event.matches ? 'dark' : 'light'); });
  const optionLabels = ["בבירור א'", "נוטה ל-א'", 'לא ברור', "נוטה ל-ב'", "בבירור ב'"];
  const fullLabels = ["בבירור א', העדפה ברורה לאפשרות א'", "נוטה ל-א', העדפה קלה לאפשרות א'", 'לא ברור, אין העדפה ברורה בין האפשרויות', "נוטה ל-ב', העדפה קלה לאפשרות ב'", "בבירור ב', העדפה ברורה לאפשרות ב'"];
  let answers = Array(questions.length).fill(null), current = 0, screen = 'welcome', returnToReview = false, result = null, storageWorks = true, resetStartsQuiz = false, toastTimer;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const answered = () => answers.filter(a => a !== null).length;
  function storageFailure() {
    storageWorks = false;
    $('storage-status').hidden = false;
    $('storage-status').textContent = 'השמירה בדפדפן אינה זמינה כרגע. אפשר להמשיך, אבל רענון או סגירה של הדף עלולים למחוק את ההתקדמות';
    $('pause').textContent = 'יציאה מהשאלון';
  }
  function load() {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== MBTI_DATA.revision || !Array.isArray(saved.answers) || saved.answers.length !== questions.length || !saved.answers.every(a => a === null || (Number.isInteger(a) && a >= 1 && a <= 5)) || !Number.isInteger(saved.current) || saved.current < 0 || saved.current >= questions.length) {
        localStorage.removeItem(key); return;
      }
      answers = saved.answers; current = saved.current;
    } catch (error) {
      if (error instanceof SyntaxError) { try { localStorage.removeItem(key); } catch { storageFailure(); } }
      else storageFailure();
    }
  }
  function save() {
    if (!storageWorks) return;
    try { localStorage.setItem(key, JSON.stringify({version: MBTI_DATA.revision, answers, current})); }
    catch { storageFailure(); }
  }
  function show(id, focusId) {
    screen = id;
    ['welcome','quiz','review','results'].forEach(name => { $(name).hidden = name !== id; });
    if (focusId) $(focusId).focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  }
  function welcome() {
    const count = answered();
    $('start').hidden = count > 0;
    $('resume').hidden = count === 0;
    $('fresh').hidden = count === 0;
    $('resume').querySelector('span').textContent = count === questions.length ? 'חזרה לתוצאה שלי' : 'להמשיך מאיפה שעצרתי';
    show('welcome');
  }
  function updateProgress() {
    $('progress').max = questions.length;
    $('progress').value = answered();
    $('progress-text').textContent = `${answered()} מתוך ${questions.length} נענו`;
  }
  function renderQuestion() {
    const q = questions[current], chapter = Math.floor(current / 8);
    $('chapter-label').textContent = `פרק ${chapter + 1} מתוך ${MBTI_DATA.chapters.length} · ${MBTI_DATA.chapters[chapter]}`;
    $('question-counter').textContent = `שאלה ${current + 1} מתוך ${questions.length}`;
    $('question-heading').textContent = q.text;
    $('option-a').textContent = q.a; $('option-b').textContent = q.b;
    $('answer-options').innerHTML = optionLabels.map((label, i) => `<label class="answer-choice"><input type="radio" name="answer" value="${i+1}" aria-label="${esc(fullLabels[i])}" ${answers[current] === i+1 ? 'checked' : ''}><span><i aria-hidden="true"></i>${label}</span></label>`).join('');
    $('previous').disabled = current === 0;
    $('next').querySelector('span').textContent = returnToReview ? 'שמירה וחזרה למפה' : current === questions.length - 1 ? 'לתוצאות' : 'הבא';
    $('answer-error').hidden = true;
    updateProgress(); save();
    show('quiz', 'question-heading');
    $('announcement').textContent = `שאלה ${current+1} מתוך ${questions.length}. ${MBTI_DATA.chapters[chapter]}`;
  }
  function start() { current = 0; returnToReview = false; renderQuestion(); }
  function review() {
    $('review-count').textContent = `${answered()} מתוך ${questions.length} שאלות נענו`;
    $('review-list').innerHTML = MBTI_DATA.chapters.map((chapter, c) => `<section class="review-group"><h3>${c+1}. ${esc(chapter)}</h3>${questions.slice(c*8,c*8+8).map(q => {
      const a = answers[q.id-1];
      return `<button class="review-question" data-index="${q.id-1}"><b>${q.id}.</b> ${esc(q.text)}<small>${a === null ? 'עדיין לא נענתה' : esc(fullLabels[a-1]) + (a === 3 ? '' : ': ' + esc(a < 3 ? q.a : q.b))}</small></button>`;
    }).join('')}</section>`).join('');
    $('review-finish').querySelector('span').textContent = answered() === questions.length ? 'לתוצאות' : `להמשיך לשאלות שנותרו (${questions.length - answered()})`;
    show('review', 'review-heading');
  }
  function profileHTML(code, preview = false) {
    const p = MBTI_PROFILES[code];
    const words = [...code].map((letter,i) => MBTI.axes[i].labels[MBTI.axes[i].id.indexOf(letter)]).join(' · ');
    return `<div class="${preview ? 'preview-card' : ''}"><div class="profile-top"><div><bdi class="type-code">${code}</bdi> <span class="he-code">${p.he}</span></div></div><h3 class="profile-name">${esc(p.name)}</h3><p>${words}</p><p>${esc(p.description)}</p><h4>העדפות וחוזקות אפשריות</h4><ul>${p.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul><h4>נקודה למחשבה</h4><p>${esc(p.stretch)}</p><h4>בקשרים עם אנשים</h4><p>${esc(p.relationships)}</p><h4>בלמידה ובעשייה</h4><p>${esc(p.work)}</p><div class="experiment"><h4>אפשר לנסות השבוע</h4><p>${esc(p.experiment)}</p></div></div>`;
  }
  function typeButton(code) {
    const p = MBTI_PROFILES[code];
    return `<button type="button" class="type-chip" data-type="${code}" aria-pressed="false" aria-controls="type-preview"><span class="type-chip-codes"><bdi dir="ltr">${code}</bdi><span>${p.he}</span></span><span class="type-chip-name">${esc(p.name)}</span></button>`;
  }
  function previewType(code) {
    document.querySelectorAll('[data-type]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.type === code)));
    $('type-preview').innerHTML = profileHTML(code, true);
  }
  function results() {
    if (answered() !== questions.length) { current = answers.indexOf(null); returnToReview = false; renderQuestion(); return; }
    result = MBTI.score(questions, answers);
    const tied = result.code.includes('X');
    $('result-heading').textContent = tied ? 'לא התקבלה העדפה בכל הצירים' : `הכיוון שלך: ${MBTI_PROFILES[result.code].name}`;
    $('result-subtitle').textContent = tied ? 'בחלק מהצירים אין כרגע העדפה מכריעה. אפשר לעיין בפירוט ולהשוות בין התיאורים' : 'הפרופיל שעולה מהתשובות שלך';
    $('profile-card').innerHTML = tied ? `<div class="profile-top"><bdi class="type-code">${result.code}</bdi></div><h3>אין טיפוס יחיד בתוצאה הזו</h3><p>האות X מסמנת ציר שבו התקבל שוויון. לא בחרנו עבורך צד שרירותי, ולכן אין כאן תיאור של טיפוס יחיד.</p><p>אפשר לעיין בצירופים המוצעים בהמשך, ולחשוב איזו העדפה חוזרת בחיים שלך כשיש חופש לבחור.</p><div class="experiment"><h4>אפשר לנסות השבוע</h4><p>לתעד שלושה רגעים של בחירה חופשית: מה בחרת, למה, והאם זו הייתה העדפה או דרישה של המצב.</p></div>` : profileHTML(result.code);
    $('axis-results').innerHTML = result.axes.map(a => {
      const winner = a.id.indexOf(a.letter);
      const percentages = [a.firstPercent, a.secondPercent];
      const emphasis = i => i === winner ? ' is-dominant' : '';
      const summary = winner < 0 ? 'אין העדפה לצד מסוים' : `${a.close ? 'נטייה קלה' : 'הנטייה שלך'}: ${a.labels[winner]}`;
      return `<section class="axis-row"><div class="axis-title"><b>${a.title}</b></div><div class="axis-labels">${a.labels.map((label,i) => `<div class="axis-pole${emphasis(i)}"><strong>${label}</strong><bdi dir="ltr">${a.id[i]} · ${percentages[i]}%</bdi></div>`).join('')}</div><div class="axis-bar" role="img" aria-label="${a.labels[0]} ${a.firstPercent} אחוז, ${a.labels[1]} ${a.secondPercent} אחוז">${percentages.map((value,i) => `<i class="${emphasis(i).trim()}" style="width:${value}%"></i>`).join('')}</div><p class="axis-explain"><strong>${summary}</strong>${winner < 0 ? '' : `<br>${a.explanations[winner]}`}</p></section>`;
    }).join('');
    const notices = [];
    if (result.neutralCount >= questions.length / 2) notices.push('בחלק גדול מהשאלות נבחר האמצע. ייתכן ששתי האפשרויות מתאימות לך או שההעדפות משתנות בין מצבים. כדאי לתת לתיאורים משקל מוגבל');
    if (result.straightLine && result.neutralCount === 0) notices.push('נבחרה אותה עמדה בכל השאלות. מכיוון שכיוון האפשרויות מתחלף, התוצאה מאוזנת. כדאי לעבור על התשובות ולבדוק שהבחירות מבטאות את ההעדפות שלך');
    const close = result.axes.filter(a => a.close);
    if (close.length && !tied) notices.push(`בצירים ${close.map(a=>a.labels.join(' / ')).join(', ')} הנטייה קרובה לאמצע. שינוי בכמה תשובות עשוי לשנות את האות המתאימה`);
    $('result-notice').hidden = notices.length === 0;
    $('result-notice').innerHTML = notices.map(n => `<p>${esc(n)}</p>`).join('');
    const nearby = result.candidates.filter(c => c !== result.code);
    $('nearby').hidden = nearby.length === 0;
    $('nearby-explanation').textContent = 'בצירים הקרובים לאמצע כדאי להשוות גם לתיאורים האלה';
    $('nearby-types').innerHTML = nearby.map(typeButton).join('');
    $('type-picker').innerHTML = Object.keys(MBTI_PROFILES).map(typeButton).join('');
    previewType(tied ? result.candidates[0] : result.code);
    save(); show('results', 'result-heading');
  }
  function resultText() {
    const lines = ['16 הטיפוסים | שאלון עצמאי להיכרות עצמית', '', `הצירוף: ${result.code} (${result.hebrewCode})`];
    if (MBTI_PROFILES[result.code]) {
      const p = MBTI_PROFILES[result.code];
      lines.push(p.name, '', p.description, '', 'חוזקות אפשריות:', ...p.strengths.map(s=>'• '+s), '', 'נקודה למחשבה:',p.stretch,'','בקשרים:',p.relationships,'','בלמידה ובעשייה:',p.work,'','ניסוי קטן:',p.experiment);
    } else lines.push('X מסמן שוויון בציר. לא נבחר טיפוס יחיד');
    lines.push('', 'ההעדפות שלך בארבעת התחומים:');
    result.axes.forEach(a => lines.push(`${a.labels[0]} ${a.firstPercent}% | ${a.labels[1]} ${a.secondPercent}% (${a.label})`));
    if (result.candidates.length > 1) lines.push('', 'צירופים להשוואה: ' + result.candidates.join(', '));
    if (!$('result-notice').hidden) lines.push('', $('result-notice').textContent);
    lines.push('', 'האחוזים הם ציוני נטייה מהתשובות, לא הסתברות או מדד ליכולת. שאלון זה אינו מבחן MBTI רשמי ולא עבר תיקוף פסיכומטרי. התוצאה אינה אבחון.', `גרסת שאלון: ${MBTI_DATA.revision}`);
    return lines.join('\n');
  }
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => {$('toast').hidden = true;}, 5000); }
  function askReset(startAfter) {
    resetStartsQuiz = startAfter;
    $('reset-dialog').setAttribute('aria-labelledby','reset-title');
    $('confirm-reset').textContent = startAfter ? 'למחוק ולהתחיל מחדש' : 'למחוק את התשובות';
    $('reset-dialog').showModal();
  }
  $('start').addEventListener('click',start);
  $('resume').addEventListener('click',()=>{ returnToReview=false; answered()===questions.length ? results() : renderQuestion(); });
  $('pause').addEventListener('click',()=>{save();welcome();$('resume').focus();});
  $('answer-options').addEventListener('change',event=>{ if(event.target.name !== 'answer') return; answers[current]=Number(event.target.value);$('answer-error').hidden=true;save();updateProgress();});
  $('quiz-form').addEventListener('submit',event=>{
    event.preventDefault();
    if(answers[current]===null){$('answer-error').hidden=false;$('answer-options').querySelector('input').focus();return;}
    if(returnToReview){returnToReview=false;review();return;}
    if(current===questions.length-1){results();return;}
    current++;renderQuestion();
  });
  $('previous').addEventListener('click',()=>{if(current>0){current--;renderQuestion();}});
  $('review-link').addEventListener('click',review);
  $('review-list').addEventListener('click',event=>{const button=event.target.closest('[data-index]');if(!button)return;current=Number(button.dataset.index);returnToReview=true;renderQuestion();});
  $('review-back').addEventListener('click',()=>{returnToReview=false;renderQuestion();});
  $('review-finish').addEventListener('click',results);
  $('edit').addEventListener('click',review);
  $('type-picker').addEventListener('click', event => {
    const button = event.target.closest('[data-type]');
    if (!button) return;
    previewType(button.dataset.type);
    $('type-preview').focus({preventScroll:true});
    $('type-preview').scrollIntoView({block:'start',behavior:'instant'});
  });
  $('nearby-types').addEventListener('click',event=>{const button=event.target.closest('[data-type]');if(!button)return;document.querySelector('.explore').open=true;previewType(button.dataset.type);$('type-preview').focus({preventScroll:true});$('type-preview').scrollIntoView({block:'start',behavior:'instant'});});
  $('download').addEventListener('click',()=>{const blob=new Blob(['\ufeff'+resultText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`16-types-${result.code}.txt`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('הסיכום מוכן להורדה');});
  $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(resultText());toast('הסיכום הועתק');}catch{toast('ההעתקה אינה זמינה בדפדפן הזה. אפשר לשמור את התוצאה כקובץ');}});
  $('print').addEventListener('click',()=>window.print());
  $('fresh').addEventListener('click',()=>askReset(true));
  $('restart').addEventListener('click',()=>askReset(true));
  $('erase').addEventListener('click',()=>askReset(false));
  $('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
  $('confirm-reset').addEventListener('click',()=>{
    let removed=true;
    try{localStorage.removeItem(key);}catch{removed=false;storageFailure();}
    answers=Array(questions.length).fill(null);current=0;result=null;returnToReview=false;
    $('reset-dialog').close();
    if(resetStartsQuiz)start();else{welcome();$('start').focus();}
    toast(removed?'התשובות הקודמות נמחקו':'התשובות אופסו בדף. מחיקת האחסון חסומה; אפשר לנקות את נתוני האתר בהגדרות הדפדפן');
  });
  $('about-toggle').addEventListener('click',()=>{const open=$('method').hidden;$('method').hidden=!open;$('about-toggle').setAttribute('aria-expanded',String(open));});
  load(); welcome();
})();

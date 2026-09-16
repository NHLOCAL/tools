'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const E=require('./engine.js');
function answersFor(ratings){return E.questions.map(q=>{if(q.kind==='contrast'){const [a,b]=q.pair,va=ratings[a]||2,vb=ratings[b]||2;return va===vb?3:va>vb?1:5;}const value=ratings[q.scale]||2;return q.reverse?6-value:value;});}

(async()=>{
  const out=process.argv[2]||await fs.mkdtemp(path.join(os.tmpdir(),'enneagram-qa-'));
  await fs.mkdir(out,{recursive:true});
  const url=pathToFileURL(path.resolve(__dirname,'../../tools/the_enneagram.html')).href;
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1050},colorScheme:'light',acceptDownloads:true});
  const page=await context.newPage();
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  // Applied to child frames too: verify the print action without opening an OS dialog.
  await context.addInitScript(()=>{window.print=()=>{window.__printed=true;};});
  try{
    await page.goto(url);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(out,'desktop-start.png'),fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'טיפוס 5, החוקר',exact:true}).click();
    assert.match(await page.locator('#type-preview-title').innerText(),/החוקר/);
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(out,'mobile-start.png'),fullPage:true,animations:'disabled'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile landing overflow');
    await page.getByRole('button',{name:/מתחילים להכיר/}).click();
    await page.locator('#next-btn').click();
    assert.equal(await page.locator('#error-msg').isVisible(),true,'unanswered item blocks navigation');
    await page.screenshot({path:path.join(out,'mobile-question.png'),fullPage:true,animations:'disabled'});
    await page.keyboard.press('5');await page.keyboard.press('Enter');
    assert.match(await page.locator('#question-counter').innerText(),/שאלה 2 מתוך 93/);
    await page.locator('#prev-btn').click();
    assert.equal(await page.locator('input[name=answer]:checked').inputValue(),'5');
    // A refresh must restore a selected answer even before pressing Next.
    await page.reload();await page.locator('#resume-btn').click();
    assert.equal(await page.locator('input[name=answer]:checked').inputValue(),'5');
    await page.setViewportSize({width:1440,height:1050});
    await page.screenshot({path:path.join(out,'desktop-question.png'),fullPage:true,animations:'disabled'});
    const fixture={answers:answersFor({1:5,9:4,sp:5,so:4,sx:2})};
    // Complete the actual 93-item UI; do not inject scores or answers into app state.
    for(const [i,answer] of fixture.answers.entries()){
      if(i===75){assert.equal(await page.locator('#contrast-options').isVisible(),true);await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile-comparison.png'),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
      await page.locator(`input[name=answer][value="${answer}"]`).check();
      await page.locator('#next-btn').click();
    }
    await page.locator('#results-title').waitFor({state:'visible'});
    await page.setViewportSize({width:1440,height:1050});
    const resultText=await page.locator('#results-screen').innerText();
    for(const phrase of ['ביטחון סטטיסטי','אחוזי ודאות','כדאי לבדוק: האם','גם כאן כל ציון'])assert.ok(!resultText.includes(phrase),`results omit clutter: ${phrase}`);
    assert.match(await page.locator('#result-summary').innerText(),/טיפוס 1 · הפרפקציוניסט/);
    assert.match(await page.locator('#wing-result').innerText(),/1w9/);
    assert.equal(await page.locator('#wing-result .wing-choice').count(),1,'only the supported wing is personalized');
    assert.match(await page.locator('#instinct-result').innerText(),/SP \/ SO \/ SX/);
    await page.screenshot({path:path.join(out,'desktop-results.png'),fullPage:true,animations:'disabled'});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile results overflow');
    assert.equal(await page.locator('#type-scores .score-label').evaluateAll(nodes=>nodes.every(n=>n.scrollWidth<=n.clientWidth)),true,'type names fit score labels');
    await page.getByRole('button',{name:'קריאה על טיפוס 4, האינדיבידואליסט',exact:true}).click();
    assert.match(await page.locator('#type-detail').innerText(),/מכונה גם: הרומנטיקן, הדרמטי/);
    await page.screenshot({path:path.join(out,'mobile-results.png'),fullPage:true,animations:'disabled'});
    await page.locator('#save-result-btn').click();
    assert.match(await page.locator('#export-status').innerText(),/התוצאה נשמרה/);
    const [htmlDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#download-btn').click()]);
    const reportPath=path.join(out,htmlDownload.suggestedFilename());await htmlDownload.saveAs(reportPath);
    const html=await fs.readFile(reportPath,'utf8');
    for(const text of ['הפרפקציוניסט','מכונה גם: המחוקק, מתקן העולם','1w9','SP / SO / SX','כנף','0-100','לא עבר תיקוף','ניסוי קטן','Hook'])assert.ok(html.includes(text),`report includes ${text}`);
    assert.ok(!/<script|<link|<iframe/i.test(html),'download is self-contained inert HTML');
    const [jsonDownload]=await Promise.all([page.waitForEvent('download'),page.locator('#json-btn').click()]);
    const jsonPath=path.join(out,jsonDownload.suggestedFilename());await jsonDownload.saveAs(jsonPath);
    const exported=JSON.parse(await fs.readFile(jsonPath,'utf8'));
    assert.equal(exported.answers.length,93);assert.deepEqual(exported.answers[75].options,E.questions[75].options);assert.equal(exported.answers[75].responseScale[0],'א בבירור');assert.deepEqual(exported.result,E.score(fixture.answers));
    assert.deepEqual(exported.typeLabels['4'],{name:E.types[4].name,aliases:E.types[4].aliases});
    await page.locator('#print-btn').click();
    const printFrame=page.frameLocator('iframe[title="דוח אישי להדפסה"]');
    await printFrame.locator('h1').waitFor({state:'attached'});
    assert.match(await printFrame.locator('body').innerText(),/על המבחן והשיטה/);
    await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.__printed===true);
    await page.reload();await page.locator('#saved-btn').click();
    assert.match(await page.locator('#result-summary').innerText(),/טיפוס 1/);
    await page.locator('#theme-btn').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.screenshot({path:path.join(out,'mobile-dark-results.png'),fullPage:true,animations:'disabled'});
    await page.locator('#edit-btn').click();
    assert.equal(await page.locator('input[name=answer]:checked').inputValue(),String(fixture.answers[0]));
    await page.locator('#pause-btn').click();
    await page.locator('#start-btn').click();await page.locator('#confirm-cancel').click();
    assert.equal(await page.locator('#resume-box').isVisible(),true,'cancel keeps draft');
    await page.locator('#saved-btn').click();
    await page.locator('#clear-btn').click();await page.locator('#confirm-ok').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('nh-enneagram-v2-draft')),null);
    assert.equal(await page.evaluate(()=>localStorage.getItem('nh-enneagram-v2-result')),null);
    await page.reload();assert.equal(await page.locator('#saved-box').isVisible(),false);
    assert.equal(await page.locator('#auto-save').isChecked(),false);
    const report=await context.newPage();await report.goto(pathToFileURL(reportPath).href);
    await report.pdf({path:path.join(out,'report-print.pdf'),format:'A4',printBackground:true});await report.close();
    assert.deepEqual(errors,[]);assert.deepEqual(network,[],'tool makes no external requests');
    const blocked=await browser.newContext({viewport:{width:390,height:844}});
    await blocked.addInitScript(()=>{for(const key of ['getItem','setItem','removeItem'])Storage.prototype[key]=()=>{throw new DOMException('blocked','SecurityError');};});
    const blockedPage=await blocked.newPage();await blockedPage.goto(url);await blockedPage.locator('#start-btn').click();
    await blockedPage.locator('input[value="4"]').check();await blockedPage.locator('#next-btn').click();
    assert.match(await blockedPage.locator('#notice').innerText(),/השמירה במכשיר אינה זמינה/);
    assert.match(await blockedPage.locator('#question-counter').innerText(),/שאלה 2/);
    await blocked.close();
    const corrupt=await browser.newContext();const corruptPage=await corrupt.newPage();await corruptPage.goto(url);
    await corruptPage.evaluate(()=>localStorage.setItem('nh-enneagram-v2-draft','{bad json'));await corruptPage.reload();
    assert.match(await corruptPage.locator('#notice').innerText(),/נתוני שמירה פגומים/);
    assert.equal(await corruptPage.evaluate(()=>localStorage.getItem('nh-enneagram-v2-draft')),null);
    // The neutral control must stay unclassified on screen and in exports.
    await corruptPage.evaluate(version=>localStorage.setItem('nh-enneagram-v2-draft',JSON.stringify({version,answers:Array(93).fill(3),index:92,screen:'results',updatedAt:'2026-09-16T10:00:00Z'})),E.VERSION);
    await corruptPage.reload();await corruptPage.locator('#resume-btn').click();
    assert.match(await corruptPage.locator('#result-summary').innerText(),/עוד אין כאן כיוון מוביל/);
    assert.match(await corruptPage.locator('#wing-result').innerText(),/כדאי לברר קודם/);
    // Legacy results must reopen as an incomplete quiz with all previous answers retained.
    await corruptPage.evaluate(()=>localStorage.setItem('nh-enneagram-v2-result',JSON.stringify({version:'2.0.0',answers:Array(75).fill(3),index:74,screen:'results',updatedAt:'2026-09-16T10:00:00Z'})));
    await corruptPage.reload();await corruptPage.locator('#saved-btn').click();
    assert.match(await corruptPage.locator('#question-counter').innerText(),/שאלה 76 מתוך 93/);
    assert.match(await corruptPage.locator('#chapter-name').innerText(),/חלק 6 מתוך 6/);
    assert.equal(await corruptPage.locator('input[name=answer]:checked').count(),0);
    await corruptPage.locator('#prev-btn').click();
    assert.equal(await corruptPage.locator('input[name=answer]:checked').inputValue(),'3');
    assert.equal(await corruptPage.locator('#results-screen').isVisible(),false);
    await corruptPage.locator('#pause-btn').click();
    // Both weak neighbors stay out of personalized wing cards AND the export.
    const weakAnswers=answersFor({1:5});
    await corruptPage.evaluate(({version,answers})=>localStorage.setItem('nh-enneagram-v2-draft',JSON.stringify({version,answers,index:92,screen:'results',updatedAt:'2026-09-16T10:00:00Z'})),{version:E.VERSION,answers:weakAnswers});
    await corruptPage.reload();await corruptPage.locator('#resume-btn').click();
    assert.equal(await corruptPage.locator('#wing-result .wing-choice').count(),0);
    assert.match(await corruptPage.locator('#wing-result').innerText(),/ההתאמה לשכנים נמוכה/);
    const [weakDownload]=await Promise.all([corruptPage.waitForEvent('download'),corruptPage.locator('#download-btn').click()]);
    const weakPath=path.join(out,'weak-wings.html');await weakDownload.saveAs(weakPath);
    const weakHtml=await fs.readFile(weakPath,'utf8');
    assert.ok(!weakHtml.includes('1w9')&&!weakHtml.includes('1w2'),'weak wings not suggested in exported report');
    // Equal well-supported neighbors may be explored, but neither is highlighted.
    const closeAnswers=answersFor({1:5,2:4,9:4});
    await corruptPage.evaluate(({version,answers})=>localStorage.setItem('nh-enneagram-v2-draft',JSON.stringify({version,answers,index:92,screen:'results',updatedAt:'2026-09-16T10:00:00Z'})),{version:E.VERSION,answers:closeAnswers});
    await corruptPage.reload();await corruptPage.locator('#resume-btn').click();
    assert.equal(await corruptPage.locator('#wing-result .wing-choice').count(),2);
    assert.equal(await corruptPage.locator('#wing-result .suggested, #wing-result .result-badge').count(),0);
    await corrupt.close();
    console.log(JSON.stringify({status:'PASS',questions:93,browserErrors:errors,externalRequests:network,output:out},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

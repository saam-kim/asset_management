const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(file)] || 'text/plain');
  res.end(fs.readFileSync(file));
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true, executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
  const errors = [], results = [];
  try {
    const context = await browser.newContext();
    // Deliberately isolate classroom testing from production Firebase and paid APIs.
    await context.route('https://**/*', route => route.fulfill({status:200, body:'', contentType:'text/javascript'}));
    const watch = p => p.on('pageerror', e => errors.push(e.message));
    const teacher = await context.newPage(); watch(teacher);
    await teacher.goto(`http://127.0.0.1:${server.address().port}/`);
    await teacher.locator('#btn-create-session').click();
    await teacher.locator('#btn-setup-complete').click();
    await teacher.locator('#teacher-dashboard-view.active').waitFor();
    const url = await teacher.locator('#student-session-link').inputValue();
    for (const [i, config] of [
      {name:'절약형', income:3000000, saving:500000, rate:3},
      {name:'균형형', income:3000000, saving:1000000, rate:6},
      {name:'적자조정형', income:1000000, saving:500000, rate:9}
    ].entries()) {
      const student = await context.newPage(); watch(student);
      await student.goto(url);
      await student.locator('#input-student-name').fill(config.name);
      await student.locator('#student-join-submit').click();
      await student.locator('#input-bucket-text').fill('제주도 자전거 일주');
      await student.locator('#btn-estimate-cost').click();
      await student.locator('#ai-result-confirm').click();
      await student.locator('#input-bucket-text').fill('유럽 배낭여행 2주');
      await student.locator('#btn-estimate-cost').click();
      await student.locator('#ai-result-confirm').click();
      await student.locator('#btn-go-stage2').click();
      const range = async (id,value) => student.locator(id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
      await range('#salary-range',config.income); await range('#dream-saving-range',config.saving);
      if(i===2) {
        assert(await student.locator('#btn-go-stage3').isDisabled(), 'Deficit must block investing');
        await range('#salary-range',3000000);
      }
      await student.locator('#btn-go-stage3').click();
      await range('#investment-rate-range',config.rate);
      if(process.env.IMPROVED) await student.locator('#market-path').selectOption(String([25064,25061,25063][i]));
      await student.locator('#btn-start-simulation').click();
      if(process.env.IMPROVED) {
        assert(await student.locator('#investment-rate-range').isDisabled());
        assert(await student.locator('#market-path').isDisabled());
        assert(await student.locator('#btn-back-budget').isDisabled());
      }
      await student.locator('#report-modal').waitFor({state:'visible'});
      const result = await student.evaluate(()=>({name:STATE.studentName, saving:STATE.realityCheck.dreamSaving, rate:STATE.investment.targetRate,market:STATE.investment.marketSeed,savings:STATE.investment.savingsEnd,portfolio:STATE.investment.portfolioEnd,age:document.querySelector('#racing-age-val').textContent}));
      assert.equal(result.age,'60'); assert(result.savings>0&&result.portfolio>0);
      results.push(result);
      console.log('Round complete:', JSON.stringify(result));
      if(process.env.IMPROVED) {
        const box=await student.locator('.report-modal-card').boundingBox();
        assert(box.y>=0 && box.y+box.height<=720, 'Report must fit viewport');
        await student.locator('#report-reflection').fill('손실 가능성도 비교했어요 <img src=x>');
        await student.locator('#report-reflection').press('Tab');
        await teacher.waitForFunction(name=>[...document.querySelectorAll('.teacher-student-card')].some(el=>el.innerText.includes(name)&&el.innerText.includes('비교 완료')&&el.innerText.includes('선택 이유:')),config.name,{timeout:10000});
        assert.equal(await teacher.locator('.teacher-student-card img').count(),0);
        if(i===2) {
          await student.screenshot({path:path.join(require('node:os').tmpdir(),'asset-management-report.png')});
          await teacher.screenshot({path:path.join(require('node:os').tmpdir(),'asset-management-teacher.png'),fullPage:true});
        }
        await student.locator('#btn-report-restart').click();
        assert(await student.locator('#report-modal').isHidden());
        await student.locator('#btn-back-budget').click();
        assert.equal(await student.locator('#dream-saving-range').inputValue(),String(config.saving));
        await student.locator('#btn-go-stage3').click();
        await student.locator('#market-path').selectOption('25061');
        assert.equal(await student.evaluate(()=>STATE.investment.marketSeed),25061);
        assert.equal(await student.evaluate(()=>STATE.investment.completed),false);
      }
    }
    await teacher.waitForFunction(()=>document.querySelector('#student-count').innerText==='3', null, {timeout:10000});
    const roster=await teacher.locator('#student-list-container').innerText();
    console.log(JSON.stringify({mode:'isolated offline classroom',results,roster,errors},null,2));
    assert.deepEqual(errors,[]);
  } finally { await browser.close(); server.close(); }
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

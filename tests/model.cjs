const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
const sandbox = vm.createContext({});
vm.runInContext('const INVESTMENT_YEARS=35; const STATE={investment:{marketSeed:25064}};'+source.slice(source.indexOf('function calculateInvestmentSeries('),source.indexOf('function initStage3(')),sandbox);
const fixed = sandbox.calculateInvestmentSeries;
const volatile = sandbox.calculateVolatileInvestmentSeries;
assert.equal(fixed(500000,0).at(-1),210000000);
assert.equal(Math.round(fixed(500000,.02).at(-1)),302706731);
assert.equal(fixed(0,.02).at(-1),0);
assert.deepEqual(volatile(500000,.06),volatile(500000,.06));
assert.notDeepEqual(volatile(500000,.06,35,25064),volatile(500000,.06,35,25061));
assert(volatile(500000,.09,35,25061).at(-1) < fixed(500000,.02).at(-1), 'Even the highest expected return can underperform deposits');
for(const seed of [25064,25061,25063]) for(const rate of [.03,.06,.09]) {
  const values=volatile(500000,rate,35,seed);
  assert.equal(values.length,36);
  assert(values.every(n=>Number.isFinite(n)&&n>=0));
  console.log(JSON.stringify({seed,rate,end:Math.round(values.at(-1))}));
}
console.log('Model checks passed: principal, monthly compounding, reproducibility, path variation, finite balances.');

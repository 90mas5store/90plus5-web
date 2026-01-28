import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./lighthouse-final-3.json', 'utf8'));
const performance = data.categories.performance.score * 100;
const lcpElementAudit = data.audits['largest-contentful-paint-element'];
const lcpElementItem = lcpElementAudit?.details?.items?.[0];
const metrics = {
    Performance: performance,
    FCP: data.audits['first-contentful-paint'].displayValue,
    LCP: data.audits['largest-contentful-paint'].displayValue,
    LCP_Element: lcpElementItem?.node?.snippet || 'N/A',
    LCP_Element_Selector: lcpElementItem?.node?.selector || 'N/A',
    TBT: data.audits['total-blocking-time'].displayValue,
    CLS: data.audits['cumulative-layout-shift'].displayValue,
    SpeedIndex: data.audits['speed-index'].displayValue,
    Interactive: data.audits['interactive'].displayValue
};

console.log('--- METRICS ---');
console.log(JSON.stringify(metrics, null, 2));

console.log('\n--- OPPORTUNITIES ---');
const opportunities = Object.values(data.audits)
    .filter(a => a.details && a.details.type === 'opportunity' && a.details.overallSavingsMs > 0)
    .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
    .slice(0, 5)
    .map(a => ({ title: a.title, savings: a.details.overallSavingsMs + ' ms' }));
console.log(JSON.stringify(opportunities, null, 2));

console.log('\n--- DIAGNOSTICS ---');
const diagnostics = Object.values(data.audits)
    .filter(a => a.details && a.details.type === 'debugdata' || a.id === 'mainthread-work-breakdown')
    .slice(0, 3)
    .map(a => ({ title: a.title, displayValue: a.displayValue }));
console.log(JSON.stringify(diagnostics, null, 2));

const m = await import('./src/content/topics.js')
const N = (v) => Number(String(v).replace(/[£$,\s]/g,''))
let fired = {}, missed = [], falsePos = 0

// For each topic, generate many questions, compute the mistake each detector
// targets, and confirm it fires. Also confirm no detector fires on a CORRECT answer.
const cases = [
  ['y6-pv-round',      1, (q)=>{const n=N(q.prompt.match(/Round ([\d,]+)/)[1]);const to=1000;const up=Math.ceil(n/to)*to,dn=Math.floor(n/to)*to;const r=Math.round(n/to)*to;return r===up?dn:up}],
  ['y6-calc-longmult', 2, (q)=>{const [,a,b]=q.prompt.match(/^(\d+) x (\d+)$/).map(Number);return a*(b%10)+a*Math.floor(b/10)}],
  ['y6-calc-longdiv',  3, (q)=>{const [,x,b]=q.prompt.match(/^(\d+) ÷ (\d+)/).map(Number);return Math.floor(x/b)}],
  ['y6-fr-mult',       1, (q)=>{const g=(a,b)=>b?g(b,a%b):a;const [,a,b,c,d]=q.prompt.match(/^(\d+)\/(\d+) x (\d+)\/(\d+)$/).map(Number);const n=a*d+c*b,dd=b*d,k=g(n,dd)||1;return `${n/k}/${dd/k}`}],
  ['y6-fr-ofamount',   1, (q)=>{const [,a,b,t]=q.prompt.match(/What is (\d+)\/(\d+) of (\d+)\?/).map(Number);return (t/a)*b}],
  ['y6-dec-calc',      1, (q)=>{const mm=q.prompt.match(/^([\d.]+) x (10|100)$/);return mm?N(mm[1]):null}],
  ['y6-alg-formulae',  1, (q)=>{const [,a,c,x]=q.prompt.match(/Find the value of (\d+)x \+ (\d+) when x = (\d+)/);return N(a+x)+N(c)}],
  ['y6-alg-sequences', 3, (q)=>{const mm=q.prompt.match(/starts at (\d+) and goes up by (\d+) each time\. What is the (\d+)th term/);return mm? N(mm[1])+N(mm[3])*N(mm[2]) : null}],
  ['y7-alg-notation',  1, (q)=>{const [,x,a]=q.prompt.match(/If n = (\d+), what is the value of (\d+)n\?$/);return N(a+x)}],
  ['y7-alg-substitute',2, (q)=>{const mm=q.prompt.match(/Find (\d+)x \+ (\d+)y when x = (-?\d+) and y = (-?\d+)/);if(!mm)return null;const [,a,b,x,y]=mm.map(Number);return y<0? a*x+b*Math.abs(y):null}],
  ['y7-alg-expand',    1, (q)=>{const mm=q.prompt.match(/Expand (\d+)\(x ([+-]) (\d+)\), then find its value when x = (\d+)/);if(!mm)return null;return N(mm[1])*N(mm[4])+(mm[2]==='+'?1:-1)*N(mm[3])}],
  ['y7-rp-ratio',      1, (q)=>{const mm=q.prompt.match(/Share (\d+) in the ratio (\d+):(\d+)/);return N(mm[1])/N(mm[2])}],
]

for (const [id, diff, mistake] of cases) {
  let hits = 0, tries = 0
  for (let i=0;i<200;i++) {
    const q = m.generateQuestion(id, diff)
    let wrong
    try { wrong = mistake(q) } catch { continue }
    if (wrong == null) continue
    if (String(wrong) === String(q.answer)) continue   // mistake coincides with truth
    tries++
    if (m.findSlip(id, String(wrong), q)) hits++
    // a correct answer must never trigger a slip
    if (m.findSlip(id, String(q.answer), q)) falsePos++
  }
  fired[id] = tries ? Math.round(100*hits/tries) : 'n/a'
  if (tries && hits/tries < 0.9) missed.push(`${id} only ${fired[id]}%`)
}
console.log('detector hit rates:'); for (const k in fired) console.log('  ', k, fired[k]+'%')
console.log('false positives on correct answers:', falsePos)
console.log(missed.length ? 'WEAK: '+missed.join(', ') : 'ALL DETECTORS FIRE RELIABLY')

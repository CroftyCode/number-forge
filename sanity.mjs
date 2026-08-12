const m = await import('./src/content/topics.js')
const ids = Object.keys(m.topicContent)
const issues = new Set()
for (const id of ids) for (const d of [1,2,3]) {
  const seen = new Set()
  for (let i=0;i<1000;i++) {
    const q = m.generateQuestion(id,d); if(!q){ issues.add(id+' d'+d+' null'); break }
    const a = String(q.answer)
    if(!a || a==='undefined' || a==='NaN' || a.includes('NaN') || a.includes('Infinity')) issues.add(id+' d'+d+' bad-answer:'+a)
    if(!q.prompt || /undefined|NaN/.test(q.prompt)) issues.add(id+' d'+d+' bad-prompt')
    if(!Array.isArray(q.hints) || q.hints.length===0) issues.add(id+' d'+d+' no-hints')
    // ambiguity classes
    const dg = q.prompt.match(/value of the (\d) in ([\d,.]+)/)
    if(dg && [...dg[2].replace(/[,.]/g,'')].filter(c=>c===dg[1]).length!==1) issues.add(id+' d'+d+' dup-digit')
    const lg = q.prompt.match(/Which is larger, ([^ ]+) or ([^?]+)\?/)
    if(lg && lg[1].trim()===lg[2].trim()) issues.add(id+' d'+d+' identical-options')
    const ls = q.prompt.match(/Write the largest of these: (.+)/)
    if(ls){ const v=ls[1].split(',').map(Number); if(new Set(v).size!==v.length) issues.add(id+' d'+d+' tied-largest') }
    // a correct answer must never be flagged as a mistake
    if(m.findSlip(id, a, q)) issues.add(id+' d'+d+' false-positive-slip')
    // the answer must validate against its own checker
    if(!m.isCorrect(a, q.answer)) issues.add(id+' d'+d+' answer-fails-own-check')
    seen.add(q.prompt)
  }
  if(seen.size < 5) issues.add(id+' d'+d+' low-variety:'+seen.size)
}
console.log('topics checked:', ids.length, '| generators:', ids.length*3)
console.log(issues.size ? 'ISSUES:\n  '+[...issues].join('\n  ') : 'ALL GENERATORS CLEAN')

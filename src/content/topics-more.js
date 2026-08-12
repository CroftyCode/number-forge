// Additional topics, written in the same shape as topics.js. Split into its
// own file purely to keep each one a readable length.
//
// These fill the gaps in the Year 6 spine and carry him into Year 7, so the
// difficulty climbs steadily across about three weeks of daily sessions
// rather than cycling the same handful of subjects.

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const round2 = (n) => Math.round(n * 100) / 100
const commas = (n) => n.toLocaleString('en-GB')

// Detectors compare his answer against the specific wrong value a known
// mistake would produce. They only ever run on answers already marked wrong.
const N = (v) => Number(String(v).replace(/[£$,\s]/g, ''))
const eq = (g, v) => Number.isFinite(v) && Number.isFinite(N(g)) && Math.abs(N(g) - v) < 1e-9

const frac = (n, d) => {
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g, text: `${n / g}/${d / g}` }
}

export const extraContent = {
  /* ================= WEEK ONE: the Year 6 number spine ================= */

  'y6-pv-10m': {
    idea:
      'Each column in a number is worth ten times the column to its right. Reading a big number is just naming which column each digit sits in: millions, hundred thousands, ten thousands, thousands, hundreds, tens, ones.',
    why:
      'Everything else in number rests on this. Rounding, decimals and standard form all assume you can see instantly what a digit is worth.',
    worked: {
      prompt: 'What is the value of the 6 in 3,604,281?',
      steps: [
        { do: 'Split the number into groups of three from the right: 3 | 604 | 281.', why: 'The commas mark millions and thousands.' },
        { do: 'The 6 is the first digit of the middle group.', why: 'The middle group counts thousands.' },
        { do: 'First position in that group is hundreds of thousands.', why: 'So the 6 means 6 hundred thousand.' },
        { do: 'Value = 600,000.', why: 'Not 6, and not 6,000.' }
      ],
      answer: '600000'
    },
    watchOut:
      'Saying the digit itself instead of what it is worth. The 6 is not worth 6, it is worth 600,000 because of the column it sits in.',
    gen: {
      1: () => {
        // The chosen digit must appear only once, otherwise "the 3 in 493,342"
        // has two possible answers and he cannot tell which is wanted.
        let digits, idx
        do {
          digits = Array.from({ length: 6 }, () => rnd(1, 9))
          idx = rnd(0, 3)
        } while (digits.filter((d) => d === digits[idx]).length > 1)
        const n = Number(digits.join(''))
        const place = Math.pow(10, 5 - idx)
        return {
          prompt: `What is the value of the ${digits[idx]} in ${commas(n)}?`,
          answer: String(digits[idx] * place),
          hints: ['Count the columns from the right: ones, tens, hundreds, thousands...', 'Multiply the digit by what its column is worth.']
        }
      },
      2: () => {
        let digits, idx
        do {
          digits = Array.from({ length: 7 }, () => rnd(1, 9))
          idx = rnd(0, 3)
        } while (digits.filter((d) => d === digits[idx]).length > 1)
        const n = Number(digits.join(''))
        const place = Math.pow(10, 6 - idx)
        return {
          prompt: `What is the value of the ${digits[idx]} in ${commas(n)}?`,
          answer: String(digits[idx] * place),
          hints: ['Group the digits in threes from the right.', 'Name the column, then multiply.']
        }
      },
      3: () => {
        let a, b
        do { a = rnd(1000000, 9999999); b = rnd(1000000, 9999999) } while (a === b)
        return {
          prompt: `Which is larger, ${commas(a)} or ${commas(b)}? Write the larger number.`,
          answer: String(Math.max(a, b)),
          hints: ['Compare the leftmost column first.', 'If those match, move one column right and compare again.']
        }
      }
    },
    slips: [
      { code: 'digit-not-value', when: (g, q) => /value of the (\d)/.test(q.prompt) && String(g).trim() === q.prompt.match(/value of the (\d)/)[1], fix: 'You gave the digit itself. The question asks what it is worth, which depends on its column.' }
    ]
  },

  'y6-pv-round': {
    idea:
      'Rounding replaces a number with a nearby simpler one. Find the column you are rounding to, then look at the single digit immediately to its right. 5 or more rounds up, 4 or less stays put. Everything after becomes zero.',
    why:
      'Estimation, checking answers and every science measurement depend on rounding sensibly.',
    worked: {
      prompt: 'Round 47,382 to the nearest thousand',
      steps: [
        { do: 'Find the thousands digit: 47,382 has 7 in the thousands column.', why: 'That is the digit that may change.' },
        { do: 'Look at the digit immediately to its right: 3.', why: 'Only this one digit decides, nothing after it.' },
        { do: '3 is less than 5, so the 7 stays as it is.', why: 'Round down.' },
        { do: 'Everything after becomes zero: 47,000.', why: 'The answer is a whole number of thousands.' }
      ],
      answer: '47000'
    },
    watchOut:
      'Looking at all the digits after, not just the next one. 47,382 to the nearest thousand is 47,000 even though 382 feels close to 500.',
    gen: {
      1: () => {
        const n = rnd(1000, 99999)
        return { prompt: `Round ${commas(n)} to the nearest thousand`, answer: String(Math.round(n / 1000) * 1000), hints: ['Find the thousands digit.', 'Look only at the digit just to its right.'] }
      },
      2: () => {
        const n = rnd(100000, 9999999)
        const to = pick([10000, 100000])
        return { prompt: `Round ${commas(n)} to the nearest ${commas(to)}`, answer: String(Math.round(n / to) * to), hints: [`Find the ${commas(to)} column.`, 'One digit to the right decides it.'] }
      },
      3: () => {
        const n = round2(rnd(100, 9999) / 100 + rnd(1, 99) / 100)
        const dp = pick([1, 2])
        return { prompt: `Round ${n} to ${dp} decimal place${dp > 1 ? 's' : ''}`, answer: String(Number(n.toFixed(dp))), hints: [`Count ${dp} digit${dp > 1 ? 's' : ''} after the point.`, 'The next digit along decides up or down.'] }
      }
    },
    slips: [
      { code: 'rounded-wrong-way', when: (g, q) => { const m = q.prompt.match(/^Round ([\d,.]+) to the nearest ([\d,]+|thousand)/); if (!m) return false; const n = N(m[1]); const to = m[2] === 'thousand' ? 1000 : N(m[2]); const up = Math.ceil(n / to) * to; const down = Math.floor(n / to) * to; const right = Math.round(n / to) * to; return eq(g, right === up ? down : up) }, fix: 'Check which digit you looked at. Only the one immediately right of your column decides.' }
    ]
  },

  'y6-pv-negative': {
    idea:
      'Negative numbers continue the number line below zero. Counting the gap between two numbers means counting up to zero, then onwards.',
    why:
      'Temperature, bank balances and all of directed number in Year 7 need this to be automatic.',
    worked: {
      prompt: 'What is the difference between -4 and 7?',
      steps: [
        { do: 'Count from -4 up to 0. That is 4.', why: 'Split the journey at zero.' },
        { do: 'Count from 0 up to 7. That is 7.', why: 'Second half of the journey.' },
        { do: 'Add the two parts: 4 + 7 = 11.', why: 'Difference is the whole gap.' }
      ],
      answer: '11'
    },
    watchOut:
      'Subtracting as if both were positive and getting 3. Crossing zero means the two distances add together.',
    gen: {
      1: () => {
        const a = rnd(-12, -1), b = rnd(1, 12)
        return { prompt: `What is the difference between ${a} and ${b}?`, answer: String(b - a), hints: ['Count up to zero first.', 'Then count on from zero.'] }
      },
      2: () => {
        const start = rnd(-10, 5), step = rnd(2, 9)
        return { prompt: `The temperature is ${start}°C and falls by ${step}°C. What is the new temperature?`, answer: String(start - step), hints: ['Falling means moving left along the number line.', 'Going below zero makes it more negative.'] }
      },
      3: () => {
        // Two different numbers, or 'which is larger' has no answer.
        let a, b
        do { a = rnd(-15, -2); b = rnd(-15, -2) } while (a === b)
        const lo = Math.min(a, b), hi = Math.max(a, b)
        return { prompt: `Which is larger, ${a} or ${b}? Write the larger number.`, answer: String(hi), hints: ['Further right on the number line is larger.', `${lo} is further from zero, which makes it smaller, not bigger.`] }
      }
    },
    slips: [
      { code: 'ignored-sign', when: (g, q) => /difference between (-?\d+) and (-?\d+)/.test(q.prompt) && (() => { const m = q.prompt.match(/difference between (-?\d+) and (-?\d+)/); return String(g) === String(Math.abs(Math.abs(Number(m[2])) - Math.abs(Number(m[1])))) })(), fix: 'You treated the negative as if it were positive. Crossing zero means the two distances add.' }
    ]
  },

  'y6-calc-longmult': {
    idea:
      'Long multiplication splits one number into its columns, multiplies by each part separately, then adds the partial answers. Nothing new happens, it is just times tables kept tidy.',
    why:
      'Expanding brackets in algebra is the same move with letters instead of columns.',
    worked: {
      prompt: '34 x 26',
      steps: [
        { do: 'Multiply 34 by the 6 (ones): 34 x 6 = 204.', why: 'First partial product.' },
        { do: 'Multiply 34 by the 20 (tens): 34 x 20 = 680.', why: 'Second partial product. The zero holds the place.' },
        { do: 'Add them: 204 + 680 = 884.', why: 'The parts recombine into the whole answer.' }
      ],
      answer: '884'
    },
    watchOut:
      'Forgetting the zero on the tens row. Multiplying by 20 is not the same as multiplying by 2.',
    gen: {
      1: () => { const a = rnd(12, 49), b = rnd(11, 19); return { prompt: `${a} x ${b}`, answer: String(a * b), hints: ['Split the second number into tens and ones.', 'Multiply by each, then add.'] } },
      2: () => { const a = rnd(23, 89), b = rnd(21, 49); return { prompt: `${a} x ${b}`, answer: String(a * b), hints: ['Do the ones row, then the tens row.', 'Remember the placeholder zero.'] } },
      3: () => { const a = rnd(112, 499), b = rnd(23, 59); return { prompt: `${a} x ${b}`, answer: String(a * b), hints: ['Same method, one more column.', 'Keep the columns lined up.'] } }
    },
    slips: [
      { code: 'missing-placeholder', when: (g, q) => { const m = q.prompt.match(/^(\d+) x (\d+)$/); if (!m) return false; const a = N(m[1]); const b = N(m[2]); if (b < 10) return false; return eq(g, a * (b % 10) + a * Math.floor(b / 10)) }, fix: 'Check the tens row. Multiplying by 20 needs the zero to hold the place.' }
    ]
  },

  'y6-calc-longdiv': {
    idea:
      'Long division works left to right through the number, asking how many times the divisor fits, writing that above, and carrying the remainder to the next digit.',
    why:
      'It is how you convert fractions to decimals and how you handle awkward division in Year 7.',
    worked: {
      prompt: '435 ÷ 5',
      steps: [
        { do: 'How many 5s in 4? None. Carry the 4.', why: 'Write 0 above the 4, move on.' },
        { do: 'How many 5s in 43? Eight, with 3 left.', why: '8 x 5 = 40, remainder 3.' },
        { do: 'Carry the 3 to make 35. How many 5s in 35? Seven exactly.', why: 'No remainder left.' },
        { do: 'Answer: 87.', why: 'Read the digits written above.' }
      ],
      answer: '87'
    },
    watchOut:
      'Dropping the remainder when carrying. The leftover joins the next digit, it does not disappear.',
    gen: {
      1: () => { const b = rnd(3, 9), q = rnd(20, 99); return { prompt: `${b * q} ÷ ${b}`, answer: String(q), hints: ['Work left to right.', 'Carry any remainder to the next digit.'] } },
      2: () => { const b = rnd(3, 12), q = rnd(40, 299); return { prompt: `${b * q} ÷ ${b}`, answer: String(q), hints: ['How many fit into the first digit or two?', 'Carry what is left over.'] } },
      3: () => {
        const b = rnd(3, 9), q = rnd(30, 199), r = rnd(1, b - 1)
        return { prompt: `${b * q + r} ÷ ${b}. Give the remainder only.`, answer: String(r), hints: ['Divide as normal.', 'The remainder is what is left at the very end.'] }
      }
    },
    slips: [
      { code: 'lost-remainder', when: (g, q) => { const m = q.prompt.match(/^(\d+) ÷ (\d+)\. Give the remainder only\./); if (!m) return false; return eq(g, Math.floor(N(m[1]) / N(m[2]))) }, fix: 'The leftover from each step joins the next digit before you divide again.' }
    ]
  },

  'y6-dec-place': {
    idea:
      'After the decimal point the columns keep dividing by ten: tenths, hundredths, thousandths. Comparing decimals means comparing column by column from the left, not by how many digits there are.',
    why:
      'Money, measurement and every percentage calculation rest on reading decimals correctly.',
    worked: {
      prompt: 'Which is larger, 0.7 or 0.65?',
      steps: [
        { do: 'Compare the tenths column: 7 against 6.', why: 'Leftmost differing column decides it.' },
        { do: '7 tenths beats 6 tenths.', why: 'The hundredths never get a say.' },
        { do: 'So 0.7 is larger.', why: '0.65 having more digits does not make it bigger.' }
      ],
      answer: '0.7'
    },
    watchOut:
      'Thinking 0.65 is bigger because it has more digits. Length is not size after the decimal point.',
    gen: {
      1: () => {
        let a, b
        do { a = round2(rnd(1, 9) / 10); b = round2(rnd(10, 99) / 100) } while (a === b)
        return { prompt: `Which is larger, ${a} or ${b}? Write the larger number.`, answer: String(Math.max(a, b)), hints: ['Compare tenths first.', 'More digits does not mean bigger.'] }
      },
      2: () => {
        // Same uniqueness rule: the digit asked about must appear once in the
        // whole number, including the digit before the point.
        let whole, digits, idx
        do {
          whole = rnd(1, 9)
          digits = [rnd(1, 9), rnd(0, 9), rnd(1, 9)]
          idx = rnd(0, 2)
        } while ([whole, ...digits].filter((d) => d === digits[idx]).length > 1)
        const n = Number(`${whole}.${digits.join('')}`)
        const place = [0.1, 0.01, 0.001][idx]
        return { prompt: `What is the value of the ${digits[idx]} in ${n}?`, answer: String(round2(digits[idx] * place * 1000) / 1000), hints: ['Tenths, then hundredths, then thousandths.', 'Multiply the digit by its column.'] }
      },
      3: () => {
        // All distinct, so 'the largest' is unambiguous.
        let nums
        do { nums = Array.from({ length: 3 }, () => round2(rnd(100, 999) / 100)) } while (new Set(nums).size !== 3)
        return { prompt: `Write the largest of these: ${nums.join(', ')}`, answer: String(Math.max(...nums)), hints: ['Compare whole numbers first.', 'Then tenths, then hundredths.'] }
      }
    },
    slips: [
      { code: 'longer-is-bigger', when: (g, q) => { const m = q.prompt.match(/^Which is larger, ([\d.]+) or ([\d.]+)\?/); if (!m) return false; const a = N(m[1]); const b = N(m[2]); const dp = (t) => (t.split('.')[1] || '').length; const longer = dp(m[1]) >= dp(m[2]) ? a : b; return longer !== Math.max(a, b) && eq(g, longer) }, fix: 'Compare column by column from the left. A longer decimal is not automatically larger.' }
    ]
  },

  /* ============ WEEK TWO: fractions, decimals and measure ============= */

  'y6-fr-compare': {
    idea:
      'Two fractions can only be compared directly when they are cut into the same size pieces. Find a common denominator, convert both, then compare the numerators.',
    why:
      'Adding and subtracting fractions uses exactly this step, so getting fluent here makes the next topic easy.',
    worked: {
      prompt: 'Which is larger, 3/4 or 5/7?',
      steps: [
        { do: 'Find a common denominator: 4 x 7 = 28.', why: 'Both can be cut into 28ths.' },
        { do: '3/4 = 21/28.', why: 'Multiply top and bottom by 7.' },
        { do: '5/7 = 20/28.', why: 'Multiply top and bottom by 4.' },
        { do: '21 beats 20, so 3/4 is larger.', why: 'Same denominator means you can compare tops.' }
      ],
      answer: '3/4'
    },
    watchOut:
      'Comparing numerators while the denominators differ. 5/7 is not bigger than 3/4 just because 5 is bigger than 3.',
    gen: {
      1: () => {
        const d = pick([8, 10, 12])
        let a, b
        do { a = rnd(1, d - 2); b = rnd(1, d - 1) } while (a === b)
        const x = Math.max(a, b), y = Math.min(a, b)
        return { prompt: `Which is larger, ${y}/${d} or ${x}/${d}? Write the larger fraction.`, answer: `${x}/${d}`, hints: ['Same denominator already.', 'Just compare the tops.'] }
      },
      2: () => {
        // Proper fractions only, different denominators, and never equal.
        let a, b, c, d
        do { b = rnd(3, 8); a = rnd(1, b - 1); d = rnd(3, 8); c = rnd(1, d - 1) } while (b === d || a / b === c / d)
        const first = a / b > c / d
        return { prompt: `Which is larger, ${a}/${b} or ${c}/${d}? Write the larger fraction.`, answer: first ? `${a}/${b}` : `${c}/${d}`, hints: ['Give them a common denominator.', `Try ${b} x ${d}.`] }
      },
      3: () => {
        let a, b, c, d
        do { a = rnd(3, 11); b = rnd(4, 13); c = rnd(3, 11); d = rnd(4, 13) } while (b === d || a / b === c / d || a > b || c > d)
        const first = a / b > c / d
        return { prompt: `Which is larger, ${a}/${b} or ${c}/${d}? Write the larger fraction.`, answer: first ? `${a}/${b}` : `${c}/${d}`, hints: ['Common denominator, or compare each to a half.', 'Convert both before deciding.'] }
      }
    },
    slips: [
      { code: 'compared-tops-only', when: (g, q) => { const m = q.prompt.match(/^Which is larger, (\d+)\/(\d+) or (\d+)\/(\d+)\?/); if (!m) return false; const a = N(m[1]), b = N(m[2]), c = N(m[3]), d = N(m[4]); const bigTop = a >= c ? `${a}/${b}` : `${c}/${d}`; const right = a / b > c / d ? `${a}/${b}` : `${c}/${d}`; return bigTop !== right && String(g).replace(/\s/g, '') === bigTop }, fix: 'You compared the numerators while the denominators were different. Convert first.' }
    ]
  },

  'y6-fr-mult': {
    idea:
      'To multiply fractions, multiply the tops together and the bottoms together, then simplify. No common denominator needed. "Of" means multiply.',
    why:
      'Scaling recipes, probability and percentage work all run on this.',
    worked: {
      prompt: '2/3 x 3/5',
      steps: [
        { do: 'Multiply the tops: 2 x 3 = 6.', why: 'New numerator.' },
        { do: 'Multiply the bottoms: 3 x 5 = 15.', why: 'New denominator.' },
        { do: 'That gives 6/15.', why: 'Not in simplest form yet.' },
        { do: 'Divide top and bottom by 3: 2/5.', why: 'Simplified.' }
      ],
      answer: '2/5'
    },
    watchOut:
      'Trying to find a common denominator first. That is for adding, not multiplying.',
    gen: {
      1: () => {
        const a = rnd(1, 4), b = rnd(2, 6), c = rnd(1, 4), d = rnd(2, 6)
        return { prompt: `${a}/${b} x ${c}/${d}`, answer: frac(a * c, b * d).text, hints: ['Tops times tops.', 'Bottoms times bottoms, then simplify.'] }
      },
      2: () => {
        const a = rnd(2, 7), b = rnd(3, 9), w = rnd(2, 9)
        return { prompt: `${a}/${b} of ${b * w}`, answer: String(a * w), hints: ['"Of" means multiply.', `Divide ${b * w} by ${b}, then times by ${a}.`] }
      },
      3: () => {
        const a = rnd(2, 5), b = rnd(3, 8), c = rnd(2, 5), d = rnd(3, 8), e = rnd(2, 4), f = rnd(3, 6)
        return { prompt: `${a}/${b} x ${c}/${d} x ${e}/${f}`, answer: frac(a * c * e, b * d * f).text, hints: ['Multiply all the tops, then all the bottoms.', 'Simplify at the end.'] }
      }
    },
    slips: [
      { code: 'added-instead', when: (g, q) => { const m = q.prompt.match(/^(\d+)\/(\d+) x (\d+)\/(\d+)$/); if (!m) return false; const a = N(m[1]), b = N(m[2]), c = N(m[3]), d = N(m[4]); return String(g).replace(/\s/g, '') === frac(a * d + c * b, b * d).text }, fix: 'Multiplying fractions does not need a common denominator. Tops times tops, bottoms times bottoms.' }
    ]
  },

  'y6-fr-ofamount': {
    idea:
      'A fraction of an amount means divide by the bottom to find one part, then multiply by the top to find how many parts you want.',
    why:
      'Percentages of amounts are the same operation with the denominator fixed at 100.',
    worked: {
      prompt: 'What is 3/4 of 48?',
      steps: [
        { do: 'Divide by the bottom: 48 ÷ 4 = 12.', why: 'That is one quarter.' },
        { do: 'Multiply by the top: 12 x 3 = 36.', why: 'Three quarters is three of those parts.' },
        { do: 'Answer: 36.', why: 'Sensible, since it is most of 48.' }
      ],
      answer: '36'
    },
    watchOut:
      'Multiplying by the bottom and dividing by the top. Divide first by the number of parts the whole is cut into.',
    gen: {
      1: () => { const b = pick([2, 3, 4, 5]), w = rnd(3, 15), a = rnd(1, b - 1); return { prompt: `What is ${a}/${b} of ${b * w}?`, answer: String(a * w), hints: [`Divide by ${b} first.`, `Then multiply by ${a}.`] } },
      2: () => { const b = pick([6, 7, 8, 9]), w = rnd(4, 20), a = rnd(2, b - 1); return { prompt: `What is ${a}/${b} of ${b * w}?`, answer: String(a * w), hints: ['One part first, then how many parts.', 'Divide by the bottom, times by the top.'] } },
      3: () => { const b = pick([8, 12]), w = rnd(5, 25), a = rnd(3, b - 1); return { prompt: `A shop has ${b * w} items and sells ${a}/${b} of them. How many are left?`, answer: String((b - a) * w), hints: ['Work out how many were sold.', 'Or find the fraction left over first.'] } }
    },
    slips: [
      { code: 'flipped-operation', when: (g, q) => { const m = q.prompt.match(/What is (\d+)\/(\d+) of (\d+)\?/); if (!m) return false; return eq(g, (N(m[3]) / N(m[1])) * N(m[2])) }, fix: 'Divide by the bottom number first, then multiply by the top.' }
    ]
  },

  'y6-dec-calc': {
    idea:
      'Multiplying or dividing by 10, 100 or 1000 slides the digits along the columns. Multiplying by a decimal makes the answer smaller than the number you started with, which is worth expecting.',
    why:
      'Unit conversion and money problems are almost entirely this.',
    worked: {
      prompt: '3.4 x 100',
      steps: [
        { do: 'Multiplying by 100 moves every digit two columns left.', why: 'Each column is ten times the last.' },
        { do: '3.4 becomes 340.', why: 'The 3 moves from ones to hundreds.' },
        { do: 'Check it grew.', why: 'Multiplying by 100 should make it much bigger.' }
      ],
      answer: '340'
    },
    watchOut:
      'Saying you "add a zero". That fails the moment a decimal point is involved: 3.4 x 10 is 34, not 3.40.',
    gen: {
      1: () => { const n = round2(rnd(11, 999) / 10), p = pick([10, 100]); return { prompt: `${n} x ${p}`, answer: String(round2(n * p)), hints: ['Slide the digits left.', `${p === 10 ? 'One' : 'Two'} column${p === 10 ? '' : 's'}.`] } },
      2: () => { const n = round2(rnd(101, 9999) / 100), p = pick([10, 100, 1000]); return { prompt: `${n} ÷ ${p}`, answer: String(round2(n / p * 1000) / 1000), hints: ['Dividing slides the digits right.', 'The answer gets smaller.'] } },
      3: () => { const a = round2(rnd(11, 99) / 10), b = round2(rnd(11, 99) / 10); return { prompt: `${a} x ${b}`, answer: String(round2(a * b)), hints: ['Ignore the points, multiply the whole numbers.', 'Then put back one decimal place for each one you removed.'] } }
    },
    slips: [
      { code: 'added-zero', when: (g, q) => { const m = q.prompt.match(/^([\d.]+) x (10|100)$/); if (!m) return false; return eq(g, N(m[1] + (m[2] === '10' ? '0' : '00'))) }, fix: 'Adding a zero only works for whole numbers. Slide the digits along the columns instead.' }
    ]
  },

  'y6-me-perimarea': {
    idea:
      'Perimeter is the distance all the way round, so you add. Area is the space inside, so you multiply. A compound shape splits into rectangles you handle separately.',
    why:
      'Area of triangles, trapezia and circles in Year 7 all build from the rectangle.',
    worked: {
      prompt: 'A rectangle is 8 cm by 5 cm. Find its area.',
      steps: [
        { do: 'Area of a rectangle is length x width.', why: 'It counts the squares inside.' },
        { do: '8 x 5 = 40.', why: 'Forty squares of 1 cm each.' },
        { do: 'Area = 40 cm².', why: 'Area units are always squared.' }
      ],
      answer: '40'
    },
    watchOut:
      'Mixing up perimeter and area. If you added, you found the distance round the edge, not the space inside.',
    gen: {
      1: () => { const l = rnd(3, 12), w = rnd(2, 11); return { prompt: `A rectangle is ${l} cm by ${w} cm. What is its area in cm²?`, answer: String(l * w), hints: ['Area means multiply.', `${l} x ${w}.`] } },
      2: () => { const l = rnd(4, 15), w = rnd(3, 14); return { prompt: `A rectangle is ${l} cm by ${w} cm. What is its perimeter in cm?`, answer: String(2 * (l + w)), hints: ['Perimeter is all four sides added.', 'Two lengths and two widths.'] } },
      3: () => {
        const a = rnd(4, 10), b = rnd(3, 8), c = rnd(2, 6), d = rnd(2, 5)
        return { prompt: `An L shape is made from a ${a} cm by ${b} cm rectangle joined to a ${c} cm by ${d} cm rectangle. What is the total area in cm²?`, answer: String(a * b + c * d), hints: ['Split it into two rectangles.', 'Find each area, then add.'] }
      }
    },
    slips: [
      { code: 'perimeter-for-area', when: (g, q) => /(\d+) cm by (\d+) cm.*area/.test(q.prompt) && (() => { const m = q.prompt.match(/(\d+) cm by (\d+) cm/); return String(g) === String(2 * (Number(m[1]) + Number(m[2]))) })(), fix: 'That is the perimeter. Area is length times width.' }
    ]
  },

  'y6-st-mean': {
    idea:
      'The mean levels everything out: add all the values, then share the total equally between them. It answers "what would they each be if they were all the same?"',
    why:
      'Mean, median, mode and range in Year 7 start here, and the mean is the one that needs arithmetic.',
    worked: {
      prompt: 'Find the mean of 4, 8, 6, 10',
      steps: [
        { do: 'Add them: 4 + 8 + 6 + 10 = 28.', why: 'Total first.' },
        { do: 'Count how many there are: 4 values.', why: 'That is what you share between.' },
        { do: '28 ÷ 4 = 7.', why: 'Each would be 7 if they were all equal.' }
      ],
      answer: '7'
    },
    watchOut:
      'Dividing by the wrong count, usually because a value got missed while adding. Count the values before you divide.',
    gen: {
      1: () => { const n = 4, vals = Array.from({ length: n }, () => rnd(1, 12)); const t = vals.reduce((a, b) => a + b, 0); const pad = (t % n + n) % n; vals[0] += n - pad === n ? 0 : n - pad; const total = vals.reduce((a, b) => a + b, 0); return { prompt: `Find the mean of ${vals.join(', ')}`, answer: String(total / n), hints: ['Add them all up.', `Then divide by ${n}.`] } },
      2: () => { const n = 5, base = rnd(2, 15), vals = Array.from({ length: n }, () => base + rnd(-2, 2)); const total = vals.reduce((a, b) => a + b, 0); const fix = (n - (total % n)) % n; vals[0] += fix; const t2 = vals.reduce((a, b) => a + b, 0); return { prompt: `Find the mean of ${vals.join(', ')}`, answer: String(t2 / n), hints: ['Total first.', `Divide by ${n}.`] } },
      3: () => { const n = rnd(4, 6), mean = rnd(5, 15), vals = Array.from({ length: n - 1 }, () => rnd(1, 20)); const missing = mean * n - vals.reduce((a, b) => a + b, 0); return { prompt: `The mean of ${n} numbers is ${mean}. ${n - 1} of them are ${vals.join(', ')}. What is the missing number?`, answer: String(missing), hints: [`Total must be ${mean} x ${n}.`, 'Subtract the ones you know.'] } }
    },
    slips: [
      { code: 'forgot-to-divide', when: (g, q) => /mean of ([\d, ]+)$/.test(q.prompt) && (() => { const m = q.prompt.match(/mean of ([\d, ]+)$/); const v = m[1].split(',').map((s) => Number(s.trim())); return String(g) === String(v.reduce((a, b) => a + b, 0)) })(), fix: 'That is the total. Now divide by how many values there were.' }
    ]
  },

  /* ============= WEEK THREE: algebra and into Year 7 ================== */

  'y6-alg-formulae': {
    idea:
      'A formula is a rule written with letters. You use it by replacing each letter with its number and then working out the arithmetic in the usual order.',
    why:
      'Substitution is the single most used skill in Year 7 algebra and all of science.',
    worked: {
      prompt: 'If P = 2l + 2w, find P when l = 7 and w = 3',
      steps: [
        { do: 'Replace the letters: P = 2 x 7 + 2 x 3.', why: '2l means 2 times l.' },
        { do: 'Multiply first: 14 + 6.', why: 'Order of operations.' },
        { do: 'Add: P = 20.', why: 'Done.' }
      ],
      answer: '20'
    },
    watchOut:
      'Reading 2l as "twenty-something" or as 2 next to 7 making 27. A number written against a letter always means multiply.',
    gen: {
      1: () => { const a = rnd(2, 9), x = rnd(2, 12), c = rnd(1, 15); return { prompt: `Find the value of ${a}x + ${c} when x = ${x}`, answer: String(a * x + c), hints: [`${a}x means ${a} times x.`, 'Multiply before adding.'] } },
      2: () => { const l = rnd(3, 14), w = rnd(2, 12); return { prompt: `The perimeter of a rectangle is P = 2l + 2w. Find P when l = ${l} and w = ${w}`, answer: String(2 * l + 2 * w), hints: ['Substitute both letters.', 'Multiply each, then add.'] } },
      3: () => { const a = rnd(2, 6), x = rnd(2, 8), b = rnd(2, 7), y = rnd(2, 9); return { prompt: `Find the value of ${a}x² - ${b}y when x = ${x} and y = ${y}`, answer: String(a * x * x - b * y), hints: [`x² means ${x} x ${x}.`, 'Powers before multiply, multiply before subtract.'] } }
    },
    slips: [
      { code: 'concatenated', when: (g, q) => { const m = q.prompt.match(/Find the value of (\d+)x \+ (\d+) when x = (\d+)/); if (!m) return false; return eq(g, N(m[1] + m[3]) + N(m[2])) }, fix: 'A number written next to a letter means multiply, not digits side by side.' }
    ]
  },

  'y6-alg-sequences': {
    idea:
      'A linear sequence goes up or down by the same amount every time. That constant step is the key to everything: continue it, or work backwards to find earlier terms.',
    why:
      'The nth term rule in Year 7 is built directly on spotting the constant difference.',
    worked: {
      prompt: 'What comes next: 4, 7, 10, 13, ...?',
      steps: [
        { do: 'Find the gap: 7 - 4 = 3.', why: 'Check it is the same each time.' },
        { do: '10 - 7 = 3 and 13 - 10 = 3.', why: 'Constant, so it is linear.' },
        { do: '13 + 3 = 16.', why: 'Continue the same step.' }
      ],
      answer: '16'
    },
    watchOut:
      'Assuming it must be a times table. The step is what repeats, not the starting number.',
    gen: {
      1: () => { const s = rnd(1, 12), d = rnd(2, 9); const terms = [0, 1, 2, 3].map((i) => s + i * d); return { prompt: `What comes next: ${terms.join(', ')}, ...?`, answer: String(s + 4 * d), hints: ['Find the gap between terms.', 'Add it once more.'] } },
      2: () => { const s = rnd(20, 60), d = -rnd(2, 8); const terms = [0, 1, 2, 3].map((i) => s + i * d); return { prompt: `What comes next: ${terms.join(', ')}, ...?`, answer: String(s + 4 * d), hints: ['The sequence is going down.', 'Keep subtracting the same amount.'] } },
      3: () => { const s = rnd(2, 9), d = rnd(3, 9), n = rnd(8, 20); return { prompt: `A sequence starts at ${s} and goes up by ${d} each time. What is the ${n}th term?`, answer: String(s + (n - 1) * d), hints: [`You take ${n} - 1 steps to reach the ${n}th term.`, `${s} + ${n - 1} x ${d}.`] } }
    },
    slips: [
      { code: 'off-by-one-term', when: (g, q) => { const m = q.prompt.match(/starts at (\d+) and goes up by (\d+) each time\. What is the (\d+)th term/); if (!m) return false; return eq(g, N(m[1]) + N(m[3]) * N(m[2])) }, fix: 'Reaching the nth term takes n - 1 steps from the first one, not n.' }
    ]
  },

  'y7-alg-notation': {
    idea:
      'Algebra has its own shorthand. 3a means 3 x a. ab means a x b. a² means a x a. a/2 means a ÷ 2. A term is a chunk separated by + or -, and like terms have exactly the same letter part.',
    why:
      'Every later topic assumes you read this fluently. Most algebra mistakes are notation mistakes, not thinking mistakes.',
    worked: {
      prompt: 'Write "five lots of n, then add three" in algebra',
      steps: [
        { do: 'Five lots of n is 5 x n.', why: 'Repeated addition is multiplication.' },
        { do: 'In algebra that is written 5n.', why: 'The multiplication sign is dropped.' },
        { do: 'Then add three: 5n + 3.', why: 'Two terms, joined by +.' }
      ],
      answer: '5n+3'
    },
    watchOut:
      'Writing n5 instead of 5n, or reading 5n as a two digit number. The number always goes first and always means multiply.',
    gen: {
      1: () => { const a = rnd(2, 9), x = rnd(2, 12); return { prompt: `If n = ${x}, what is the value of ${a}n?`, answer: String(a * x), hints: [`${a}n means ${a} times n.`, `So ${a} x ${x}.`] } },
      2: () => { const a = rnd(2, 9), b = rnd(1, 15), x = rnd(2, 10); return { prompt: `If n = ${x}, what is the value of ${a}n + ${b}?`, answer: String(a * x + b), hints: ['Multiply first.', 'Then add.'] } },
      3: () => { const x = rnd(2, 9); return { prompt: `If n = ${x}, what is the value of n² + n?`, answer: String(x * x + x), hints: [`n² means ${x} x ${x}.`, 'Then add one more n.'] } }
    },
    slips: [
      { code: 'read-as-digits', when: (g, q) => { const m = q.prompt.match(/If n = (\d+), what is the value of (\d+)n\?$/); if (!m) return false; return eq(g, N(m[2] + m[1])) }, fix: 'A number against a letter means multiply. 5n is five times n, not the digits 5 and n.' }
    ]
  },

  'y7-num-fmp': {
    idea:
      'Every whole number breaks into primes in exactly one way. The HCF is the largest number that divides both; the LCM is the smallest number both divide into.',
    why:
      'Simplifying algebraic fractions and finding common denominators quickly both run on this.',
    worked: {
      prompt: 'Find the HCF of 24 and 36',
      steps: [
        { do: 'Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24.', why: 'List them in pairs.' },
        { do: 'Factors of 36: 1, 2, 3, 4, 6, 9, 12, 18, 36.', why: 'Same again.' },
        { do: 'Common to both: 1, 2, 3, 4, 6, 12.', why: 'Look for the overlap.' },
        { do: 'Highest is 12.', why: 'That is the HCF.' }
      ],
      answer: '12'
    },
    watchOut:
      'Mixing up HCF and LCM. The HCF is never bigger than either number; the LCM is never smaller.',
    gen: {
      1: () => { const k = rnd(2, 6); let a, b; do { a = k * rnd(2, 5); b = k * rnd(2, 5) } while (a === b); return { prompt: `Find the HCF of ${a} and ${b}`, answer: String(gcd(a, b)), hints: ['List the factors of each.', 'Find the biggest one they share.'] } },
      2: () => { let a, b; do { a = rnd(3, 12); b = rnd(3, 12) } while (a === b); return { prompt: `Find the LCM of ${a} and ${b}`, answer: String(Math.abs(a * b) / gcd(a, b)), hints: ['Count up in each until they meet.', 'The first shared multiple is the LCM.'] } },
      3: () => { const k = rnd(3, 9); let a, b; do { a = k * rnd(3, 8); b = k * rnd(3, 8) } while (a === b); return { prompt: `Find the HCF of ${a} and ${b}`, answer: String(gcd(a, b)), hints: ['Break each into prime factors.', 'Multiply the primes they share.'] } }
    },
    slips: [
      { code: 'hcf-lcm-swap', when: (g, q) => /HCF of (\d+) and (\d+)/.test(q.prompt) && (() => { const m = q.prompt.match(/HCF of (\d+) and (\d+)/); const a = Number(m[1]), b = Number(m[2]); return String(g) === String(Math.abs(a * b) / gcd(a, b)) })(), fix: 'That is the LCM. The HCF is the largest number that divides into both.' }
    ]
  },

  'y7-alg-substitute': {
    idea:
      'Substituting means swapping each letter for its value and then doing the arithmetic in the correct order. Negative values need brackets so the signs behave.',
    why:
      'Straight line graphs, formulae in science and checking equation solutions all depend on it.',
    worked: {
      prompt: 'Find 3a - 2b when a = 5 and b = -4',
      steps: [
        { do: 'Substitute with brackets: 3(5) - 2(-4).', why: 'Brackets keep the negative safe.' },
        { do: '3 x 5 = 15.', why: 'First term.' },
        { do: '2 x (-4) = -8, and subtracting -8 adds 8.', why: 'Two negatives make a positive.' },
        { do: '15 + 8 = 23.', why: 'Final answer.' }
      ],
      answer: '23'
    },
    watchOut:
      'Losing a sign when the value is negative. Write brackets round it every time.',
    gen: {
      1: () => { const a = rnd(2, 9), x = rnd(2, 10), c = rnd(1, 12); return { prompt: `Find ${a}x + ${c} when x = ${x}`, answer: String(a * x + c), hints: ['Swap x for its value.', 'Multiply before adding.'] } },
      2: () => { const a = rnd(2, 7), x = rnd(2, 9), b = rnd(2, 6), y = rnd(-9, -2); return { prompt: `Find ${a}x + ${b}y when x = ${x} and y = ${y}`, answer: String(a * x + b * y), hints: ['Put brackets round the negative.', 'Adding a negative takes away.'] } },
      3: () => { const a = rnd(2, 5), x = rnd(-6, -2), b = rnd(2, 6), y = rnd(2, 8); return { prompt: `Find ${a}x² - ${b}y when x = ${x} and y = ${y}`, answer: String(a * x * x - b * y), hints: [`x² means (${x}) x (${x}), which is positive.`, 'Then subtract the second term.'] } }
    },
    slips: [
      { code: 'sign-lost', when: (g, q) => { const m = q.prompt.match(/Find (\d+)x \+ (\d+)y when x = (-?\d+) and y = (-?\d+)/); if (!m) return false; const a = N(m[1]), b = N(m[2]), x = N(m[3]), y = N(m[4]); if (y >= 0) return false; return eq(g, a * x + b * Math.abs(y)) }, fix: 'Check the negative value. Brackets round it stop the sign going missing.' }
    ]
  },

  'y7-alg-expand': {
    idea:
      'Expanding a bracket means multiplying everything inside it by the term outside. Every single term inside gets multiplied, not just the first.',
    why:
      'Solving harder equations and factorising both depend on this being automatic.',
    worked: {
      prompt: 'Expand 3(x + 4)',
      steps: [
        { do: 'Multiply the x by 3: 3x.', why: 'First term inside.' },
        { do: 'Multiply the 4 by 3: 12.', why: 'Second term inside, easy to forget.' },
        { do: 'Answer: 3x + 12.', why: 'Both terms multiplied.' }
      ],
      answer: '3x+12'
    },
    watchOut:
      'Only multiplying the first term and writing 3x + 4. The outside number reaches everything inside.',
    gen: {
      1: () => { const a = rnd(2, 9), b = rnd(1, 12), x = rnd(2, 8); return { prompt: `Expand ${a}(x + ${b}), then find its value when x = ${x}`, answer: String(a * x + a * b), hints: [`Multiply both x and ${b} by ${a}.`, 'Then substitute.'] } },
      2: () => { const a = rnd(2, 8), b = rnd(1, 9), x = rnd(3, 9); return { prompt: `Expand ${a}(x - ${b}), then find its value when x = ${x}`, answer: String(a * x - a * b), hints: ['The minus stays a minus.', `Both terms get multiplied by ${a}.`] } },
      3: () => { const a = rnd(2, 6), b = rnd(2, 7), c = rnd(2, 6), d = rnd(1, 8), x = rnd(2, 7); return { prompt: `Expand and simplify ${a}(x + ${b}) + ${c}(x + ${d}), then find its value when x = ${x}`, answer: String((a + c) * x + a * b + c * d), hints: ['Expand each bracket separately.', 'Then collect the x terms and the numbers.'] } }
    },
    slips: [
      { code: 'partial-expand', when: (g, q) => { const m = q.prompt.match(/Expand (\d+)\(x ([+-]) (\d+)\), then find its value when x = (\d+)/); if (!m) return false; const a = N(m[1]), sign = m[2] === '+' ? 1 : -1, b = N(m[3]), x = N(m[4]); return eq(g, a * x + sign * b) }, fix: 'Every term inside the bracket gets multiplied, not just the first one.' }
    ]
  },

  'y7-pc-change': {
    idea:
      'To increase by a percentage, find the percentage and add it on; to decrease, subtract it. Faster still, use a multiplier: +20% is x 1.2, -15% is x 0.85.',
    why:
      'Sales, interest, tips and every real money problem you will meet.',
    worked: {
      prompt: 'Increase 80 by 15%',
      steps: [
        { do: '10% of 80 is 8, so 5% is 4.', why: 'Build the percentage from easy parts.' },
        { do: '15% = 8 + 4 = 12.', why: 'Ten plus five.' },
        { do: '80 + 12 = 92.', why: 'Increase means add it on.' }
      ],
      answer: '92'
    },
    watchOut:
      'Giving just the percentage instead of the new total. "Increase 80 by 15%" wants 92, not 12.',
    gen: {
      1: () => { const n = rnd(2, 40) * 10, p = pick([10, 20, 50]); return { prompt: `Increase ${n} by ${p}%`, answer: String(round2(n * (1 + p / 100))), hints: [`Find ${p}% first.`, 'Then add it to the original.'] } },
      2: () => { const n = rnd(2, 40) * 10, p = pick([15, 25, 30]); return { prompt: `Decrease ${n} by ${p}%`, answer: String(round2(n * (1 - p / 100))), hints: [`Find ${p}% of it.`, 'Then subtract from the original.'] } },
      3: () => { const n = rnd(20, 90) * 10, p = pick([12, 18, 35, 45]); const up = pick([true, false]); return { prompt: `${up ? 'Increase' : 'Decrease'} ${n} by ${p}%`, answer: String(round2(n * (up ? 1 + p / 100 : 1 - p / 100))), hints: [`Multiplier is ${up ? round2(1 + p / 100) : round2(1 - p / 100)}.`, 'One multiplication does the whole job.'] } }
    },
    slips: [
      { code: 'gave-the-change', when: (g, q) => /(Increase|Decrease) (\d+) by (\d+)%/.test(q.prompt) && (() => { const m = q.prompt.match(/(Increase|Decrease) (\d+) by (\d+)%/); return String(g) === String(round2(Number(m[2]) * Number(m[3]) / 100)) })(), fix: 'That is the size of the change. The question asks for the new amount after it is applied.' }
    ]
  },

  'y7-rp-ratio': {
    idea:
      'A ratio compares parts. To share an amount in a ratio, add the parts to find how many shares there are, divide to find one share, then multiply for each portion.',
    why:
      'Scaling, mixing, currency and proportion problems all reduce to this.',
    worked: {
      prompt: 'Share £60 in the ratio 2:3',
      steps: [
        { do: 'Add the parts: 2 + 3 = 5.', why: 'Five equal shares in total.' },
        { do: '60 ÷ 5 = 12.', why: 'One share is worth 12.' },
        { do: '2 x 12 = 24 and 3 x 12 = 36.', why: 'Each portion.' },
        { do: 'Check: 24 + 36 = 60.', why: 'It should add back to the original.' }
      ],
      answer: '24'
    },
    watchOut:
      'Dividing by one of the numbers in the ratio instead of by their total. Always add the parts first.',
    gen: {
      1: () => { const a = rnd(1, 4), b = rnd(1, 5), one = rnd(2, 15); const total = (a + b) * one; return { prompt: `Share ${total} in the ratio ${a}:${b}. What is the smaller share?`, answer: String(Math.min(a, b) * one), hints: [`There are ${a + b} shares.`, `One share is ${total} ÷ ${a + b}.`] } },
      2: () => { const a = rnd(2, 6), b = rnd(2, 7), one = rnd(3, 20); const total = (a + b) * one; return { prompt: `Share ${total} in the ratio ${a}:${b}. What is the larger share?`, answer: String(Math.max(a, b) * one), hints: ['Add the parts, then divide.', 'Multiply by the bigger part.'] } },
      3: () => { const a = rnd(2, 5), b = rnd(2, 5), c = rnd(2, 5), one = rnd(2, 12); const total = (a + b + c) * one; return { prompt: `Share ${total} in the ratio ${a}:${b}:${c}. What is the largest share?`, answer: String(Math.max(a, b, c) * one), hints: [`Total shares: ${a + b + c}.`, 'Find one share, then multiply.'] } }
    },
    slips: [
      { code: 'divided-by-part', when: (g, q) => { const m = q.prompt.match(/Share (\d+) in the ratio (\d+):(\d+)/); if (!m) return false; const t = N(m[1]); return eq(g, t / N(m[2])) || eq(g, t / N(m[3])) }, fix: 'Divide by the total number of shares, which means adding the ratio numbers first.' }
    ]
  }
}

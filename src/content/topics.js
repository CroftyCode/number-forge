// Every lesson here is written by hand, not generated at runtime.
// Structure per topic:
//   idea      what the concept actually is, in plain language
//   why       where it leads, so it does not feel arbitrary
//   worked    a fully worked example he steps through
//   watchOut  the mistake most people make
//   gen       question generators, one per difficulty (1 warm, 2 hot, 3 white hot)
//   slips     misconception detectors that fire on specific wrong answers

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b))
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b)

const frac = (n, d) => {
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g, text: `${n / g}/${d / g}` }
}

import { extraContent } from './topics-more.js'

const coreContent = {
  /* ------------------------------------------------------------------ */
  'y6-calc-order': {
    idea:
      'When a calculation has more than one operation in it, everyone has to agree on the order, otherwise the same sum gives different answers. The agreed order is brackets, then indices (powers), then multiply and divide, then add and subtract.',
    why:
      'Every formula you meet from here on assumes this order. Get it automatic now and algebra stops being guesswork later.',
    worked: {
      prompt: '5 + 3 x 4',
      steps: [
        { do: 'Look for brackets. There are none.', why: 'Nothing to do first.' },
        { do: 'Look for multiply or divide. There is 3 x 4.', why: 'Multiplying outranks adding, so it happens first.' },
        { do: '3 x 4 = 12, so the sum becomes 5 + 12.', why: 'Replace the part you have worked out.' },
        { do: '5 + 12 = 17.', why: 'Now only adding is left.' }
      ],
      answer: '17'
    },
    watchOut:
      'Working left to right and getting 32. Multiply always jumps the queue ahead of add, no matter where it sits in the line.',
    gen: {
      1: () => {
        const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9)
        return { prompt: `${a} + ${b} x ${c}`, answer: String(a + b * c), hints: ['Which part outranks the other?', `Do ${b} x ${c} first.`] }
      },
      2: () => {
        const a = rnd(2, 9), b = rnd(2, 6), c = rnd(2, 6), d = rnd(2, 9)
        return { prompt: `(${a} + ${b}) x ${c} - ${d}`, answer: String((a + b) * c - d), hints: ['Brackets come first, always.', `Work out (${a} + ${b}), then multiply by ${c}.`] }
      },
      3: () => {
        // c > d keeps the bracket positive and non-zero: (3 - 3) would
        // make the whole multiply term vanish and test nothing.
        const a = rnd(2, 5), b = rnd(2, 5), d = rnd(2, 4), c = rnd(d + 1, d + 5)
        return { prompt: `${a}² + ${b} x (${c} - ${d})`, answer: String(a * a + b * (c - d)), hints: ['Brackets, then the power, then multiply, then add.', `${a}² means ${a} x ${a}.`] }
      }
    },
    slips: [
      { code: 'left-to-right', when: (g, q) => q.prompt.includes('+') && String(g) === String(leftToRight(q.prompt)), fix: 'You worked straight across left to right. Multiply and divide always go before add and subtract.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-calc-fmp': {
    idea:
      'A factor divides into a number exactly. A multiple is what you get from a times table. A prime number has exactly two factors, itself and 1.',
    why:
      'Simplifying fractions, cancelling in algebra and finding common denominators all run on factors. This is the toolkit underneath a lot of Year 7.',
    worked: {
      prompt: 'List all the factors of 24',
      steps: [
        { do: 'Start at 1 and work in pairs. 1 x 24.', why: 'Factors always come in pairs, so you find two at a time.' },
        { do: '2 x 12, then 3 x 8, then 4 x 6.', why: 'Keep going up until the pair meets in the middle.' },
        { do: '5 does not divide 24, and after 4 x 6 the next pair would repeat.', why: 'That tells you to stop.' },
        { do: 'Factors: 1, 2, 3, 4, 6, 8, 12, 24.', why: 'Eight factors, so 24 is definitely not prime.' }
      ],
      answer: '1, 2, 3, 4, 6, 8, 12, 24'
    },
    watchOut:
      'Calling 1 a prime number. It is not, because it only has one factor. And 2 is prime even though it is even.',
    gen: {
      1: () => {
        const n = pick([12, 18, 20, 28, 30, 36, 45])
        return { prompt: `What is the largest factor of ${n} that is smaller than ${n}?`, answer: String(largestProperFactor(n)), hints: ['Try dividing by 2, then 3, then 4.', 'The biggest one is usually the number divided by its smallest prime factor.'] }
      },
      2: () => {
        const a = pick([4, 6, 8, 9, 12]), b = pick([10, 14, 15, 16, 18])
        return { prompt: `What is the highest common factor of ${a} and ${b}?`, answer: String(gcd(a, b)), hints: ['List the factors of each, then find the biggest one in both lists.', `Factors of ${a}: ${factorsOf(a).join(', ')}`] }
      },
      3: () => {
        const a = pick([6, 8, 9, 12]), b = pick([10, 14, 15, 20])
        return { prompt: `What is the lowest common multiple of ${a} and ${b}?`, answer: String(lcm(a, b)), hints: ['Count up in each number until you hit the same value.', `Multiples of ${a}: ${[1, 2, 3, 4, 5, 6].map((k) => a * k).join(', ')}`] }
      }
    },
    slips: [
      { code: 'hcf-lcm-swap', when: (g, q) => q.prompt.includes('highest common factor') && Number(g) > 0 && Number(g) % 1 === 0 && Number(g) > 12, fix: 'That looks like a common multiple, not a common factor. A factor divides into the numbers, so it has to be smaller than both.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-fr-simplify': {
    idea:
      'Two fractions are equivalent when they describe the same amount. You get from one to the other by multiplying or dividing the top and bottom by the same number. Simplifying just means dividing both by the biggest number that goes into each.',
    why:
      'Answers are marked in their simplest form, and cancelling early makes every fraction calculation smaller and safer.',
    worked: {
      prompt: 'Simplify 18/24',
      steps: [
        { do: 'Find a number that divides both 18 and 24. Both are even, so try 2.', why: 'Any common factor works, you just may need more than one round.' },
        { do: '18 ÷ 2 = 9 and 24 ÷ 2 = 12, giving 9/12.', why: 'Same amount, smaller numbers.' },
        { do: 'Both 9 and 12 divide by 3. That gives 3/4.', why: 'Keep going until nothing divides both.' },
        { do: '3 and 4 share no factors, so 3/4 is simplest.', why: 'Done.' }
      ],
      answer: '3/4'
    },
    watchOut:
      'Dividing only the top or only the bottom. Whatever you do to one, you must do to the other, or you have changed the amount.',
    gen: {
      1: () => {
        const base = pick([[1, 2], [1, 3], [2, 3], [3, 4], [1, 4]]), k = rnd(2, 5)
        const f = frac(base[0] * k, base[1] * k)
        return { prompt: `Simplify ${base[0] * k}/${base[1] * k}`, answer: f.text, hints: ['What number goes into both the top and the bottom?', `Try dividing both by ${k}.`] }
      },
      2: () => {
        const base = pick([[2, 5], [3, 5], [5, 6], [3, 8], [5, 8]]), k = rnd(3, 7)
        const f = frac(base[0] * k, base[1] * k)
        return { prompt: `Simplify ${base[0] * k}/${base[1] * k}`, answer: f.text, hints: ['Find the highest common factor of the two numbers.', `Both divide by ${k}.`] }
      },
      3: () => {
        const base = pick([[4, 7], [7, 9], [5, 12], [9, 11]]), k = rnd(4, 9)
        const f = frac(base[0] * k, base[1] * k)
        return { prompt: `Simplify ${base[0] * k}/${base[1] * k}`, answer: f.text, hints: ['Break both numbers into their factors and see what they share.', `The highest common factor is ${k}.`] }
      }
    },
    slips: [
      { code: 'one-side-only', when: (g, q) => typeof g === 'string' && g.includes('/') && sameNumerator(g, q.prompt), fix: 'You changed the bottom but left the top alone. Both parts have to be divided by the same number.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-fr-addsub': {
    idea:
      'You can only add or subtract fractions when the pieces are the same size, which means the denominators must match. Change one or both fractions into equivalent ones with a common denominator, then add the numerators only.',
    why:
      'This is the single biggest source of dropped marks moving into Year 7, and it comes back the moment algebraic fractions appear.',
    worked: {
      prompt: '2/3 + 1/4',
      steps: [
        { do: 'The pieces are different sizes: thirds and quarters.', why: 'You cannot add them as they are.' },
        { do: 'Find a number both 3 and 4 go into. 12 works.', why: 'That is the common denominator.' },
        { do: '2/3 becomes 8/12, because you multiply top and bottom by 4.', why: 'Same amount, new piece size.' },
        { do: '1/4 becomes 3/12, multiplying top and bottom by 3.', why: 'Now both are in twelfths.' },
        { do: '8/12 + 3/12 = 11/12.', why: 'Add the tops. The bottom stays as twelfths.' }
      ],
      answer: '11/12'
    },
    watchOut:
      'Adding the denominators too, so 2/3 + 1/4 becomes 3/7. The denominator is the size of the pieces, not a quantity, so it does not get added.',
    gen: {
      1: () => {
        const d = pick([5, 6, 7, 8, 9]), a = rnd(1, d - 2), b = rnd(1, d - a - 1)
        const f = frac(a + b, d)
        return { prompt: `${a}/${d} + ${b}/${d}`, answer: f.text, hints: ['The bottoms already match, so this is the easy case.', 'Add the tops and keep the bottom the same.'] }
      },
      2: () => {
        const d1 = pick([2, 3, 4]), d2 = pick([6, 8, 12])
        const den = lcm(d1, d2), a = Math.max(1, rnd(1, d1 - 1)), b = rnd(1, d2 - 1)
        const f = frac(a * (den / d1) + b * (den / d2), den)
        return { prompt: `${a}/${d1} + ${b}/${d2}`, answer: f.text, hints: [`Find a number both ${d1} and ${d2} divide into.`, `Use ${den} as the common denominator.`] }
      },
      3: () => {
        // Keep trying until the subtraction lands on a positive answer.
        for (let attempt = 0; attempt < 60; attempt++) {
          const d1 = pick([3, 4, 5]), d2 = pick([6, 8, 9, 10, 12])
          if (d1 === d2) continue
          const den = lcm(d1, d2)
          const a = rnd(1, d1 - 1), b = rnd(1, d2 - 1)
          const top = a * (den / d1) - b * (den / d2)
          if (top <= 0) continue
          const f = frac(top, den)
          return {
            prompt: `${a}/${d1} - ${b}/${d2}`,
            answer: f.text,
            hints: [`Both ${d1} and ${d2} go into ${den}.`, 'Convert both, then subtract the tops and simplify.']
          }
        }
        return { prompt: '3/4 - 1/6', answer: '7/12', hints: ['Both 4 and 6 go into 12.', 'Convert both, then subtract the tops.'] }
      }
    },
    slips: [
      { code: 'added-denominators', when: (g, q) => matchesAddedDenominators(g, q.prompt), fix: 'You added the bottoms as well as the tops. The bottom tells you the size of each piece, so it stays the same once both fractions match.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-fdp-convert': {
    idea:
      'Fractions, decimals and percentages are three ways of writing the same thing. Per cent means "out of 100", so a percentage is just a fraction with 100 on the bottom, and a decimal is that fraction written in place value columns.',
    why:
      'Year 7 switches between the three forms constantly without warning. Being fluent means you never lose time on the translation.',
    worked: {
      prompt: 'Write 3/8 as a decimal and a percentage',
      steps: [
        { do: '3/8 means 3 ÷ 8.', why: 'A fraction is a division waiting to happen.' },
        { do: '3 ÷ 8 = 0.375.', why: 'Short division, adding zeros after the decimal point.' },
        { do: 'To get a percentage, multiply by 100.', why: 'Per cent means out of 100.' },
        { do: '0.375 x 100 = 37.5%.', why: 'Move the digits two places left.' }
      ],
      answer: '0.375 and 37.5%'
    },
    watchOut:
      'Reading 0.5 as 5%. Multiplying by 100 moves the digits two columns, so 0.5 is 50%.',
    gen: {
      1: () => {
        const [n, d, dec] = pick([[1, 2, 0.5], [1, 4, 0.25], [3, 4, 0.75], [1, 5, 0.2], [1, 10, 0.1]])
        return { prompt: `Write ${n}/${d} as a decimal`, answer: String(dec), hints: [`${n}/${d} means ${n} ÷ ${d}.`, 'Think about how many of these fit into one whole.'] }
      },
      2: () => {
        const [n, d, pc] = pick([[1, 4, 25], [3, 5, 60], [7, 10, 70], [3, 8, 37.5], [5, 8, 62.5]])
        return { prompt: `Write ${n}/${d} as a percentage (just the number)`, answer: String(pc), hints: ['Turn it into a decimal first.', 'Then multiply by 100.'] }
      },
      3: () => {
        const pc = pick([12.5, 37.5, 62.5, 87.5, 45, 15])
        const f = frac(pc * 2, 200)
        return { prompt: `Write ${pc}% as a fraction in its simplest form`, answer: f.text, hints: [`${pc}% means ${pc} out of 100.`, 'Write it over 100, clear any decimal, then simplify.'] }
      }
    },
    slips: [
      { code: 'percent-shift', when: (g, q) => q.prompt.includes('percentage') && Number(g) > 0 && Math.abs(Number(g) * 10 - Number(q.answer)) < 0.001, fix: 'You moved the digits one place instead of two. Multiplying by 100 shifts them two columns.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-pc-ofamount': {
    idea:
      'To find a percentage of an amount, find a piece you can work out easily and build up from it. 10% is dividing by 10, 1% is dividing by 100, 50% is halving, 25% is halving twice.',
    why:
      'Percentage increase, decrease, interest and discount in Year 7 all sit on top of this one skill.',
    worked: {
      prompt: 'Find 35% of 80',
      steps: [
        { do: '10% of 80 = 8.', why: 'Divide by 10. This is your building block.' },
        { do: '30% = 3 x 8 = 24.', why: 'Three lots of 10%.' },
        { do: '5% is half of 10%, so 5% = 4.', why: 'Halving is easier than dividing by 20.' },
        { do: '24 + 4 = 28.', why: '30% and 5% together make 35%.' }
      ],
      answer: '28'
    },
    watchOut:
      'Dividing by the percentage instead of building from 10%. 35% of 80 is not 80 ÷ 35.',
    gen: {
      1: () => {
        const pc = pick([10, 25, 50]), n = pick([40, 60, 80, 120, 200])
        return { prompt: `Find ${pc}% of ${n}`, answer: String((pc / 100) * n), hints: [pc === 50 ? 'Half of it.' : pc === 25 ? 'Halve it, then halve again.' : 'Divide by 10.'] }
      },
      2: () => {
        const pc = pick([15, 30, 35, 45, 70]), n = pick([40, 60, 80, 140, 220])
        return { prompt: `Find ${pc}% of ${n}`, answer: String(round2((pc / 100) * n)), hints: [`Start with 10% of ${n}.`, 'Then build up with lots of 10% and a 5% if you need it.'] }
      },
      3: () => {
        const pc = pick([12, 17.5, 23, 38, 62]), n = pick([64, 90, 150, 240, 320])
        return { prompt: `Find ${pc}% of ${n}`, answer: String(round2((pc / 100) * n)), hints: [`10% of ${n}, then 1% of ${n}.`, 'Combine tens, fives and ones to reach the percentage.'] }
      }
    },
    slips: [
      { code: 'divided-by-percent', when: (g, q) => nearly(g, divideByPercent(q.prompt)), fix: 'You divided by the percentage. Build up from 10% instead, or multiply by the percentage over 100.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-rp-ratio': {
    idea:
      'A ratio like 3:2 says how many shares each part gets. Add the numbers to find the total shares, work out what one share is worth, then multiply back up.',
    why:
      'Ratio runs through recipes, scale, maps, gradients and eventually similar shapes and trigonometry.',
    worked: {
      prompt: 'Share £45 in the ratio 3:2',
      steps: [
        { do: '3 + 2 = 5 shares in total.', why: 'The whole amount is split into 5 equal shares.' },
        { do: '£45 ÷ 5 = £9 per share.', why: 'This is the key step. Always find one share.' },
        { do: 'First part: 3 x £9 = £27.', why: 'Three shares.' },
        { do: 'Second part: 2 x £9 = £18. Check: 27 + 18 = 45.', why: 'Always check the parts add back to the total.' }
      ],
      answer: '£27 and £18'
    },
    watchOut:
      'Dividing by the first number in the ratio instead of the total shares. Always add the ratio parts first.',
    gen: {
      1: () => {
        const a = rnd(1, 3), b = rnd(1, 3), share = rnd(4, 12), total = (a + b) * share
        return { prompt: `Share ${total} in the ratio ${a}:${b}. What is the larger part?`, answer: String(Math.max(a, b) * share), hints: [`There are ${a + b} shares altogether.`, `One share is ${share}.`] }
      },
      2: () => {
        const a = rnd(2, 5), b = rnd(2, 5), share = rnd(6, 15), total = (a + b) * share
        return { prompt: `Share ${total} in the ratio ${a}:${b}. What is the smaller part?`, answer: String(Math.min(a, b) * share), hints: [`Total shares: ${a} + ${b} = ${a + b}.`, `Divide ${total} by ${a + b} to find one share.`] }
      },
      3: () => {
        const a = rnd(2, 5), b = rnd(2, 5), c = rnd(2, 5), share = rnd(4, 12)
        return { prompt: `Share ${(a + b + c) * share} in the ratio ${a}:${b}:${c}. What is the largest part?`, answer: String(Math.max(a, b, c) * share), hints: ['Three parts works the same way, just more shares.', `Total shares: ${a + b + c}.`] }
      }
    },
    slips: [
      { code: 'ignored-total-shares', when: () => false, fix: 'Add the ratio parts to get the total number of shares before you divide.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y6-ge-angles': {
    idea:
      'Angles measure turn. A right angle is 90°, angles on a straight line add to 180°, angles round a point add to 360°, and the three angles inside any triangle always add to 180°.',
    why:
      'These four facts are the whole foundation of Year 7 geometry, including parallel lines and polygons.',
    worked: {
      prompt: 'Two angles sit on a straight line. One is 115°. Find the other.',
      steps: [
        { do: 'Angles on a straight line add to 180°.', why: 'That is the rule you are using, and you should say so in your working.' },
        { do: '180 - 115 = 65.', why: 'Subtract the known angle from the total.' },
        { do: 'The other angle is 65°.', why: 'Check: 115 + 65 = 180.' }
      ],
      answer: '65'
    },
    watchOut:
      'Using 360 when the angles are on a straight line. Line is 180, full turn round a point is 360.',
    gen: {
      1: () => {
        const a = rnd(20, 160)
        return { prompt: `Two angles are on a straight line. One is ${a}°. What is the other, in degrees?`, answer: String(180 - a), hints: ['Angles on a straight line add to 180°.'] }
      },
      2: () => {
        const a = rnd(30, 90), b = rnd(30, 180 - a - 10)
        return { prompt: `A triangle has angles of ${a}° and ${b}°. What is the third angle, in degrees?`, answer: String(180 - a - b), hints: ['The angles in a triangle add to 180°.', `Add ${a} and ${b} first, then subtract from 180.`] }
      },
      3: () => {
        const a = rnd(40, 110), b = rnd(40, 110), c = rnd(30, 100)
        return { prompt: `Four angles meet at a point. Three of them are ${a}°, ${b}° and ${c}°. What is the fourth, in degrees?`, answer: String(360 - a - b - c), hints: ['Angles around a point add to 360°.', 'Add the three you know, then subtract from 360.'] }
      }
    },
    slips: [
      { code: 'line-vs-point', when: (g, q) => q.prompt.includes('straight line') && Number(g) === 360 - Number(q.answer) - (180 - Number(q.answer)), fix: 'You used 360 for a straight line. A straight line is a half turn, so 180°.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y7-num-directed': {
    idea:
      'Negative numbers sit to the left of zero on the number line. Adding moves right, subtracting moves left. Two signs next to each other combine: subtracting a negative moves you right, so it behaves like adding.',
    why:
      'Directed number underpins algebra, coordinates, temperature, and every equation you rearrange from here on.',
    worked: {
      prompt: '-6 - (-4)',
      steps: [
        { do: 'Start at -6 on the number line.', why: 'Always anchor yourself at the first number.' },
        { do: 'You are subtracting negative 4. Two minus signs together.', why: 'This is the bit that trips people up.' },
        { do: 'Subtracting a negative means moving right, so it becomes -6 + 4.', why: 'Taking away a debt makes you better off.' },
        { do: '-6 + 4 = -2.', why: 'Move 4 to the right from -6.' }
      ],
      answer: '-2'
    },
    watchOut:
      'Treating -6 - 4 and -6 - (-4) as the same thing. The brackets change the direction of travel completely.',
    gen: {
      1: () => {
        const a = rnd(-9, -1), b = rnd(1, 9)
        return { prompt: `${a} + ${b}`, answer: String(a + b), hints: [`Start at ${a} and move ${b} to the right.`] }
      },
      2: () => {
        const a = rnd(-9, 9), b = rnd(1, 9)
        return { prompt: `${a} - (-${b})`, answer: String(a + b), hints: ['Two minus signs together turn into a plus.', `So this is ${a} + ${b}.`] }
      },
      3: () => {
        const a = rnd(-9, -2), b = rnd(2, 9)
        const negative = Math.random() < 0.5
        const prompt = negative ? `${a} x -${b}` : `${a} x ${b}`
        const answer = negative ? a * -b : a * b
        return { prompt, answer: String(answer), hints: ['Same signs give a positive, different signs give a negative.', `${a} and ${negative ? `-${b}` : b} have ${negative ? 'the same sign' : 'different signs'}.`] }
      }
    },
    slips: [
      { code: 'double-negative', when: (g, q) => q.prompt.includes('- (-') && Number(g) === evalSimpleSubtract(q.prompt), fix: 'You subtracted instead of adding. Two minus signs side by side cancel into a plus.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y7-alg-simplify': {
    idea:
      'A term is a chunk like 4x or 7 or 2y. Like terms have exactly the same letter part, so 4x and 3x are like terms but 4x and 4y are not. Simplifying means collecting the like terms together.',
    why:
      'Nothing in algebra works until this is automatic. Solving equations, expanding brackets and factorising all end with a tidy-up step.',
    worked: {
      prompt: 'Simplify 5x + 3y + 2x - y',
      steps: [
        { do: 'Sort the terms into groups: the x terms and the y terms.', why: 'Only matching letters can combine.' },
        { do: 'x terms: 5x + 2x = 7x.', why: 'Five lots of x plus two lots of x is seven lots.' },
        { do: 'y terms: 3y - y = 2y.', why: 'A lone y means 1y.' },
        { do: 'Answer: 7x + 2y.', why: 'It will not go further because x and y are different.' }
      ],
      answer: '7x + 2y'
    },
    watchOut:
      'Combining unlike terms, writing 5x + 3y as 8xy. If the letters differ, they stay apart.',
    gen: {
      1: () => {
        const a = rnd(2, 9), b = rnd(2, 9)
        return { prompt: `Simplify ${a}x + ${b}x`, answer: `${a + b}x`, hints: ['Both terms are lots of x.', `${a} lots plus ${b} lots.`] }
      },
      2: () => {
        const a = rnd(3, 9), b = rnd(2, 6), c = rnd(2, 8), d = rnd(1, 4)
        return { prompt: `Simplify ${a}x + ${c}y + ${b}x - ${d}y`, answer: `${a + b}x + ${c - d}y`, hints: ['Collect the x terms, then the y terms.', `x terms: ${a}x + ${b}x`] }
      },
      3: () => {
        const b = rnd(2, 5), d = rnd(1, 3)
        const c = rnd(2, 5), a = c + rnd(1, 4)
        const coeff = (k, letter) => (k === 1 ? letter : `${k}${letter}`)
        return {
          prompt: `Simplify ${coeff(a, 'a')} - ${coeff(b, 'b')} + ${d} - ${coeff(c, 'a')} + ${coeff(b * 2, 'b')}`,
          answer: `${coeff(a - c, 'a')} + ${coeff(b, 'b')} + ${d}`,
          hints: ['Three groups: a terms, b terms and plain numbers.', 'Watch the minus signs, they belong to the term after them.']
        }
      }
    },
    slips: [
      { code: 'unlike-terms', when: (g) => typeof g === 'string' && /[a-z]{2}/.test(g.replace(/\s/g, '')), fix: 'You joined two different letters together. 5x + 3y stays as 5x + 3y, it does not become 8xy.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y7-alg-equations1': {
    idea:
      'An equation is a balance. Whatever you do to one side you must do to the other, or it stops balancing. To find the letter, undo whatever has been done to it using the opposite operation.',
    why:
      'Solving equations is the single most used skill in secondary maths. Two-step equations, rearranging formulae and simultaneous equations are all extensions of this.',
    worked: {
      prompt: 'Solve x + 7 = 18',
      steps: [
        { do: 'Something has been added to x, namely 7.', why: 'Name what has happened to the letter.' },
        { do: 'The opposite of adding 7 is subtracting 7.', why: 'That is how you undo it.' },
        { do: 'Subtract 7 from both sides: x = 18 - 7.', why: 'Both sides, or the balance breaks.' },
        { do: 'x = 11. Check: 11 + 7 = 18.', why: 'Always substitute back to check.' }
      ],
      answer: '11'
    },
    watchOut:
      'Only changing one side. If you take 7 off the left, you must take 7 off the right in the same move.',
    gen: {
      1: () => {
        const x = rnd(2, 15), a = rnd(2, 12)
        return { prompt: `Solve x + ${a} = ${x + a}`, answer: String(x), hints: [`Undo the + ${a} by subtracting ${a}.`, 'Do it to both sides.'] }
      },
      2: () => {
        const x = rnd(2, 12), a = rnd(2, 9)
        return { prompt: `Solve ${a}x = ${a * x}`, answer: String(x), hints: [`${a}x means ${a} times x.`, `The opposite of multiplying by ${a} is dividing by ${a}.`] }
      },
      3: () => {
        const x = rnd(2, 12), a = rnd(2, 6)
        return { prompt: `Solve x/${a} = ${x}`, answer: String(x * a), hints: [`x has been divided by ${a}.`, `Undo it by multiplying both sides by ${a}.`] }
      }
    },
    slips: [
      { code: 'same-operation', when: (g, q) => /Solve x \+ (\d+) = (\d+)/.test(q.prompt) && Number(g) === sumOfEquation(q.prompt), fix: 'You added when you needed to subtract. To undo an addition, take it away from both sides.' }
    ]
  },

  /* ------------------------------------------------------------------ */
  'y7-alg-equations2': {
    idea:
      'When two things have happened to the letter, undo them in reverse order. Deal with the adding or subtracting first, then the multiplying or dividing.',
    why:
      'This is the standard shape of a GCSE equation, and it is where most of Year 7 algebra is heading.',
    worked: {
      prompt: 'Solve 3x + 5 = 20',
      steps: [
        { do: 'Two things happened to x: multiplied by 3, then 5 added.', why: 'Read it in the order it was built.' },
        { do: 'Undo in reverse, so remove the + 5 first.', why: 'Last thing on, first thing off.' },
        { do: 'Subtract 5 from both sides: 3x = 15.', why: 'Both sides stay balanced.' },
        { do: 'Divide both sides by 3: x = 5.', why: 'Now undo the multiplication.' },
        { do: 'Check: 3 x 5 + 5 = 20.', why: 'It works.' }
      ],
      answer: '5'
    },
    watchOut:
      'Dividing everything by 3 first while the + 5 is still there. That turns a clean question into fractions for no reason.',
    gen: {
      1: () => {
        const x = rnd(2, 9), a = rnd(2, 5), b = rnd(2, 12)
        return { prompt: `Solve ${a}x + ${b} = ${a * x + b}`, answer: String(x), hints: [`Take ${b} off both sides first.`, `Then divide both sides by ${a}.`] }
      },
      2: () => {
        const x = rnd(2, 10), a = rnd(2, 7), b = rnd(2, 15)
        return { prompt: `Solve ${a}x - ${b} = ${a * x - b}`, answer: String(x), hints: [`Add ${b} to both sides first.`, `Then divide by ${a}.`] }
      },
      3: () => {
        const x = rnd(2, 8), b = rnd(2, 9)
        const c = rnd(1, 3), a = c + rnd(1, 3)
        const term = (k) => (k === 1 ? 'x' : `${k}x`)
        return {
          prompt: `Solve ${term(a)} + ${b} = ${term(c)} + ${(a - c) * x + b}`,
          answer: String(x),
          hints: [`Get the x terms on one side: subtract ${term(c)} from both sides.`, 'Then it becomes a normal two-step equation.']
        }
      }
    },
    slips: [
      { code: 'wrong-order', when: () => false, fix: 'Undo the adding or subtracting before the multiplying or dividing.' }
    ]
  }
}

/* ---------------------- helpers used by the slips ---------------------- */

function round2(n) { return Math.round(n * 100) / 100 }
function nearly(a, b) { return b != null && Math.abs(Number(a) - Number(b)) < 0.01 }
function factorsOf(n) { const out = []; for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out }
function largestProperFactor(n) { for (let i = Math.floor(n / 2); i >= 1; i--) if (n % i === 0) return i; return 1 }

function leftToRight(prompt) {
  const m = prompt.match(/^(\d+) \+ (\d+) x (\d+)$/)
  if (!m) return null
  return (Number(m[1]) + Number(m[2])) * Number(m[3])
}

function divideByPercent(prompt) {
  const m = prompt.match(/Find ([\d.]+)% of (\d+)/)
  if (!m) return null
  return round2(Number(m[2]) / Number(m[1]))
}

function sameNumerator(given, prompt) {
  const p = prompt.match(/(\d+)\/(\d+)/)
  const g = String(given).match(/(\d+)\/(\d+)/)
  return p && g && p[1] === g[1] && p[2] !== g[2]
}

function matchesAddedDenominators(given, prompt) {
  const m = prompt.match(/(\d+)\/(\d+) \+ (\d+)\/(\d+)/)
  if (!m) return false
  const wrong = `${Number(m[1]) + Number(m[3])}/${Number(m[2]) + Number(m[4])}`
  return String(given).replace(/\s/g, '') === wrong
}

function evalSimpleSubtract(prompt) {
  const m = prompt.match(/^(-?\d+) - \(-(\d+)\)$/)
  if (!m) return null
  return Number(m[1]) - Number(m[2])
}

function sumOfEquation(prompt) {
  const m = prompt.match(/Solve x \+ (\d+) = (\d+)/)
  if (!m) return null
  return Number(m[1]) + Number(m[2])
}

/* ------------------------------ answers ------------------------------- */

// Accepts 3/4, 0.75, £27, 27, 7x + 2y with any spacing.
export function normalise(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[£$,\s]/g, '')
    .replace(/°/g, '')
    .replace(/^\+/, '')
}

export function isCorrect(given, expected) {
  const g = normalise(given)
  const e = normalise(expected)
  if (!g) return false
  if (g === e) return true

  // numeric comparison, so 0.50 matches 0.5
  const gn = Number(g), en = Number(e)
  if (!Number.isNaN(gn) && !Number.isNaN(en)) return Math.abs(gn - en) < 0.001

  // fraction against decimal
  const gf = g.match(/^(-?\d+)\/(\d+)$/)
  if (gf && !Number.isNaN(en)) return Math.abs(Number(gf[1]) / Number(gf[2]) - en) < 0.001
  const ef = e.match(/^(-?\d+)\/(\d+)$/)
  if (ef && !Number.isNaN(gn)) return Math.abs(Number(ef[1]) / Number(ef[2]) - gn) < 0.001

  return false
}

export function findSlip(topicId, given, question) {
  // A detector looks for the value a known mistake produces, and sometimes
  // that value is also the right answer (a 4 by 4 square has equal area and
  // perimeter). Never accuse someone who got it right.
  if (isCorrect(given, question?.answer)) return null

  const slips = topicContent[topicId]?.slips ?? []
  for (const s of slips) {
    try { if (s.when(given, question)) return s } catch { /* detector misfired, ignore */ }
  }
  return null
}

export function generateQuestion(topicId, difficulty) {
  const t = topicContent[topicId]
  if (!t) return null
  const gen = t.gen[difficulty] ?? t.gen[1]
  const q = gen()
  return { ...q, topicId, difficulty }
}

export const topicContent = { ...coreContent, ...extraContent }

export const hasContent = (topicId) => Boolean(topicContent[topicId])

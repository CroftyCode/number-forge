# Tests

Two node scripts, no framework. Run them before deploying.

```bash
npm run lint      # catches undefined variables, which Vite compiles happily
node sanity.mjs   # every generator x every difficulty, 1000 draws each
node slip-test.mjs
```

`sanity.mjs` asserts, for all 32 topics at all 3 difficulties:
- no NaN, undefined or empty answers or prompts
- every question has hints
- each answer validates against the app's own `isCorrect`
- no ambiguous questions (a repeated digit in "value of the 3 in ...",
  identical options in "which is larger", ties in "largest of these")
- no misconception detector fires on a correct answer
- at least 5 distinct prompts per generator

`slip-test.mjs` reconstructs the specific mistake each detector targets and
asserts the detector fires, and that none fire on correct answers.

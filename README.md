# Predate Lab — companion demo

Interactive lab for the article *All 12 Algorithms Behind Modern AI Predate
ChatGPT*. It proves the post's core claim deterministically: the math is not
new — the scale is — and the failure mode is skipping the old column.

Zero dependencies — Node 24+ only. The model layer, the UI wiring, and the
server are plain ES modules shared by the browser, the CLI-less runner, and
the test suite.

## What it proves

Pick structured tabular fraud data, enable **modern only**, and the lab shows
the exact failure the article warns about: every modern algorithm returns an
empty valid path — no calibrated probability, no reason code a regulator can
read. Turn modern-only off and the traditional column reappears: logistic
regression and the gradient-boosting row (the one the viral chart omits)
return a score, a confidence, and an explainable reason.

Controls:
- **Rows (scale)** — 1,000 to 120,000 synthetic transactions.
- **Feature trust** — how much the engineered features carry signal vs proxy
  noise. Low trust exposes the high-confidence wrong answer; high trust lets
  the modern column score well too.
- **Modern only** — hide the traditional six and watch the failure mode.

## Run it

```text
npm start        # serve the lab on :3000
npm test         # lab behavior + server
npm run check    # both
```

## Layout

- `public/lab.mjs` — the 12 algorithms + gradient boosting, the deterministic
  dataset, and the scoring engine
- `public/index.html` — the Lab tab (three-tab nav: Lab / Guide / Source)
- `public/guide.html` — the Guide tab
- `public/app.js` — UI wiring
- `app/server.js` — static allowlist server with security headers
- `test/` — `node --test "test/*.test.mjs"`

## Honest limits

- Scoring is simulated and seeded-deterministic; no real model trains in the
  browser. The point is the decision structure, not the AUC.
- "Feature trust" is a dial, not a leakage audit.
- The modern-only failure is a policy result (no explainable model survives
  the filter), not a claim that modern models cannot be probed at all.

This is an educational demo, not production infrastructure.

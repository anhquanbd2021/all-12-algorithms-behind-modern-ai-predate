import test from 'node:test';
import assert from 'node:assert/strict';
import { ALGORITHMS, DATA_SHAPES, MISSING_ROW, createDataset, runLab } from '../public/lab.mjs';

test('the chart holds 12 algorithms, oldest 1805, newest 2022', () => {
  assert.equal(ALGORITHMS.length, 12);
  const oldest = ALGORITHMS.reduce((a, b) => (a.year <= b.year ? a : b));
  const newest = ALGORITHMS.reduce((a, b) => (a.year >= b.year ? a : b));
  assert.equal(oldest.id, 'linear-regression');
  assert.equal(oldest.year, 1805);
  assert.equal(newest.id, 'post-training');
  assert.equal(newest.year, 2022);
  assert.equal(ALGORITHMS.filter(a => a.column === 'traditional').length, 6);
  assert.equal(ALGORITHMS.filter(a => a.column === 'modern').length, 6);
});

test('the chart corrections hold: self-attention is inside the transformer, gradient boosting is the missing row', () => {
  const attention = ALGORITHMS.find(a => a.id === 'self-attention');
  assert.equal(attention.partOf, 'transformer');
  assert.equal(MISSING_ROW.year, 1999);
  assert.equal(ALGORITHMS.some(a => a.id === 'gradient-boosting'), false);
  assert.equal(runLab().results.length, 13);
});

test('modern-only on tabular fraud data finds no valid path — the failure mode', () => {
  const result = runLab({ dataShape: 'tabular', modernOnly: true });
  assert.equal(result.summary.validPaths, 0);
  assert.equal(result.summary.explainablePaths, 0);
  assert.equal(result.summary.filtered, 7);
  assert.match(result.summary.headline, /No valid path/);
  for (const row of result.results.filter(r => r.column === 'traditional')) {
    assert.equal(row.verdict, 'filtered');
    assert.equal(row.confidence, null);
  }
  for (const row of result.results.filter(r => r.column === 'modern')) {
    assert.equal(row.verdict, 'no-valid-path');
    assert.ok(row.confidence > 0.85, `${row.id} should be overconfident`);
    assert.equal(row.explainable, false);
  }
});

test('turning modern-only off restores the old column with a number and a reason', () => {
  const result = runLab({ dataShape: 'tabular', modernOnly: false });
  assert.equal(result.summary.filtered, 0);
  const explainable = result.results.filter(r => r.verdict === 'valid-path' && r.explainable);
  assert.ok(explainable.some(r => r.id === 'logistic-regression'));
  assert.ok(explainable.some(r => r.id === 'gradient-boosting'));
  assert.match(result.summary.headline, /number and a reason/);
});

test('modern wins on unstructured input; the traditional column does not', () => {
  const result = runLab({ dataShape: 'language', modernOnly: false });
  const modern = result.results.filter(r => r.column === 'modern');
  assert.ok(modern.every(r => r.verdict === 'valid-path'));
  assert.ok(result.results.filter(r => r.column === 'traditional').every(r => r.verdict === 'out-of-domain'));
});

test('runs are deterministic and scale/trust only move confidence', () => {
  const a = runLab({ rows: 20000, featureTrust: 0.6 });
  const b = runLab({ rows: 20000, featureTrust: 0.6 });
  assert.deepEqual(a, b);
  const small = runLab({ rows: 1000, featureTrust: 0.6 }).results.find(r => r.id === 'logistic-regression');
  const large = runLab({ rows: 100000, featureTrust: 0.6 }).results.find(r => r.id === 'logistic-regression');
  assert.ok(large.confidence > small.confidence);
});

test('dataset is clamped, seeded, and options are validated', () => {
  assert.equal(createDataset({ rows: 5 }).rows, 100);
  assert.equal(createDataset({ rows: 999999 }).rows, 120000);
  assert.equal(createDataset({ rows: 1000, seed: 7 }).positives, createDataset({ rows: 1000, seed: 7 }).positives);
  assert.equal(runLab({ dataShape: 'bogus' }).dataShape, DATA_SHAPES[0].id);
  assert.equal(runLab({ featureTrust: 9 }).featureTrust, 1);
});

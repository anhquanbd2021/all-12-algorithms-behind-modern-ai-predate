// demo/public/lab.mjs — the deterministic model behind the Predate Lab UI.
// Shared by the browser (public/app.js) and the test suite. No dependencies.

// The 12 algorithms from the post, in the post's two columns.
export const ALGORITHMS = [
  { id: 'linear-regression', name: 'Linear regression', year: 1805, column: 'traditional', explainable: true },
  { id: 'knn', name: 'K-nearest neighbours', year: 1951, column: 'traditional', explainable: true },
  { id: 'logistic-regression', name: 'Logistic regression', year: 1958, column: 'traditional', explainable: true },
  { id: 'naive-bayes', name: 'Naive Bayes', year: 1961, column: 'traditional', explainable: true },
  { id: 'k-means', name: 'K-means', year: 1967, column: 'traditional', explainable: true },
  { id: 'decision-trees', name: 'Decision trees', year: 1984, column: 'traditional', explainable: true },
  { id: 'backprop', name: 'Backpropagation', year: 1986, column: 'modern', explainable: false },
  { id: 'cnn', name: 'CNN', year: 1989, column: 'modern', explainable: false },
  { id: 'transformer', name: 'Transformer', year: 2017, column: 'modern', explainable: false },
  { id: 'self-attention', name: 'Self-attention', year: 2017, column: 'modern', explainable: false, partOf: 'transformer' },
  { id: 'rag', name: 'Retrieval Augmented Generation', year: 2020, column: 'modern', explainable: false },
  { id: 'post-training', name: 'Post-training (SFT + RLHF)', year: 2022, column: 'modern', explainable: false },
];

// The row the viral chart omits. Shown beside the 12, never above them.
export const MISSING_ROW = {
  id: 'gradient-boosting', name: 'Gradient boosting (XGBoost)', year: 1999,
  column: 'missing-row', explainable: true,
};

export const LAB_ROWS = [...ALGORITHMS, MISSING_ROW];

export const DATA_SHAPES = [
  { id: 'tabular', label: 'Structured tabular fraud', unstructured: false },
  { id: 'language', label: 'Unstructured language / vision', unstructured: true },
];

export const DEFAULT_OPTIONS = { dataShape: 'tabular', modernOnly: false, rows: 10000, featureTrust: 0.35, seed: 7 };

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDataset({ rows = DEFAULT_OPTIONS.rows, seed = DEFAULT_OPTIONS.seed } = {}) {
  const rand = mulberry32(seed);
  const clampedRows = Math.max(100, Math.min(120000, Math.round(rows)));
  const positives = Math.round(clampedRows * (0.04 + rand() * 0.02));
  return { rows: clampedRows, positives, features: 40, seed };
}

const scale = rows => Math.max(0, Math.min(1, Math.log10(rows) / 5));

export function runLab(options = {}) {
  const { dataShape, modernOnly, rows, featureTrust, seed } = { ...DEFAULT_OPTIONS, ...options };
  const shape = DATA_SHAPES.find(s => s.id === dataShape) ?? DATA_SHAPES[0];
  const trust = Math.max(0, Math.min(1, featureTrust));
  const dataset = createDataset({ rows, seed });
  const rand = mulberry32(seed * 31 + dataset.rows);
  const capacity = scale(dataset.rows);
  const results = LAB_ROWS.map(row => {
    const jitter = Math.round(rand() * 4) / 100;
    if (modernOnly && row.column === 'traditional') {
      return { ...row, verdict: 'filtered', confidence: null, reason: 'Hidden by the modern-only filter.' };
    }
    if (modernOnly && row.column === 'missing-row') {
      return { ...row, verdict: 'filtered', confidence: null, reason: 'Hidden by the modern-only filter.' };
    }
    if (shape.unstructured) {
      return row.column === 'traditional'
        ? { ...row, verdict: 'out-of-domain', confidence: null, reason: 'Needs thresholds or coefficients; the input is not tabular.' }
        : { ...row, verdict: 'valid-path', confidence: round(0.62 + 0.3 * capacity + jitter), reason: row.partOf ? 'Inside the transformer — not a sibling of it.' : 'Messy input is exactly where the modern column earns its keep.' };
    }
    if (row.column === 'modern') {
      return { ...row, verdict: 'no-valid-path', confidence: round(0.9 + jitter / 2), reason: 'High confidence, no reason code — the input has no signal the modern column can ground on.' };
    }
    return { ...row, verdict: 'valid-path', confidence: round(0.55 + 0.35 * trust + 0.1 * capacity + jitter), reason: 'Returns a number and a reason: coefficients, thresholds, or SHAP values.' };
  });
  const valid = results.filter(r => r.verdict === 'valid-path');
  return {
    dataShape: shape.id,
    dataShapeLabel: shape.label,
    modernOnly: Boolean(modernOnly),
    dataset,
    featureTrust: trust,
    results,
    summary: {
      validPaths: valid.length,
      explainablePaths: valid.filter(r => r.explainable).length,
      filtered: results.filter(r => r.verdict === 'filtered').length,
      headline: valid.some(r => r.explainable)
        ? 'A number and a reason.'
        : 'No valid path — nothing here a regulator can read.',
    },
  };
}

function round(n) { return Math.round(n * 100) / 100; }

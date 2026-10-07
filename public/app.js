import { runLab } from '/lab.mjs';

const list = document.querySelector('#algorithm-list');
const headline = document.querySelector('#headline');
const rowsInput = document.querySelector('#rows');
const rowsOut = document.querySelector('#rows-out');
const trustInput = document.querySelector('#trust');
const trustOut = document.querySelector('#trust-out');

function options() {
  const dataShape = document.querySelector('input[name="dataShape"]:checked').value;
  return {
    dataShape,
    modernOnly: document.querySelector('#modern-only').checked,
    rows: Number(rowsInput.value),
    featureTrust: Number(trustInput.value) / 100,
  };
}

function verdictClass(verdict) {
  if (verdict === 'valid-path') return 'valid-path';
  if (verdict === 'no-valid-path') return 'no-valid-path';
  return verdict;
}

function render(result) {
  list.innerHTML = '';
  for (const row of result.results) {
    const li = document.createElement('li');
    li.className = `algorithm ${verdictClass(row.verdict)}${row.column === 'missing-row' ? ' missing-row' : ''}`;
    li.innerHTML = `
      <span class="year">${row.year}</span>
      <span class="name">${row.name}${row.column === 'missing-row' ? ' · the missing row' : ''}</span>
      <p class="reason">${row.reason}</p>
      <span class="confidence">${row.verdict === 'valid-path' ? `conf ${row.confidence.toFixed(2)}` : row.verdict.replace('-', ' ')}</span>`;
    list.appendChild(li);
  }
  headline.textContent = result.summary.headline;
  headline.className = `badge ${result.summary.validPaths ? (result.summary.explainablePaths ? 'pass' : 'warn') : 'fail'}`;
}

function refresh() {
  rowsOut.value = rowsInput.value;
  trustOut.value = (Number(trustInput.value) / 100).toFixed(2);
  render(runLab(options()));
}

for (const input of document.querySelectorAll('input')) {
  input.addEventListener('input', refresh);
  input.addEventListener('change', refresh);
}

refresh();


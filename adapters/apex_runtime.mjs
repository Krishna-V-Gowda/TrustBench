#!/usr/bin/env node
/**
 * Runtime adapter for EDA InsightLab Apex.
 *
 * The adapter reads the shipped assets/js/app.js file, extracts selected
 * function declarations from that exact source, evaluates them in an isolated
 * VM context, and exposes a small JSON protocol over stdin/stdout.
 *
 * It deliberately does not reimplement the subject algorithms. If an expected
 * function cannot be found, extraction fails closed.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import process from 'node:process';
import vm from 'node:vm';

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error('usage: node apex_runtime.mjs /path/to/assets/js/app.js');
  process.exit(64);
}

const source = fs.readFileSync(sourcePath, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(source).digest('hex');

function extractConstStatement(name) {
  const pattern = new RegExp(`\\bconst\\s+${name}\\s*=`);
  const match = pattern.exec(source);
  if (!match) throw new Error(`required constant not found: ${name}`);
  const start = match.index;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') { lineComment = true; i += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; i += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === ';') return source.slice(start, i + 1);
  }
  throw new Error(`unterminated constant statement: ${name}`);
}

function extractFunction(name) {
  const pattern = new RegExp(`\\bfunction\\s+${name}\\s*\\(`);
  const match = pattern.exec(source);
  if (!match) throw new Error(`required function not found: ${name}`);
  const start = match.index;
  const openingBrace = source.indexOf('{', start);
  if (openingBrace < 0) throw new Error(`opening brace not found for function: ${name}`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = openingBrace; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') { lineComment = true; i += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; i += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function: ${name}`);
}

const functionNames = [
  'isMissing',
  'toNumber',
  'parseCSV',
  'columnsOf',
  'quantile',
  'mean',
  'std',
  'skewness',
  'pearson',
  'inferSchema',
  'computeProfile',
  'safeName',
  'numericColumnsNow',
  'selectedTarget',
  'isTargetDerivedColumn',
  'predictorNumericColumns',
  'featureSelectionRows',
  'etaSquaredNumericByCategory',
  'cramersV',
  'maxRedundancy',
  'standardizedMatrix',
  'covarianceMatrix',
  'matVec',
  'dot',
  'norm',
  'powerIter',
  'computePCA'
];

const extracted = functionNames.map(extractFunction);
const bootstrap = `
'use strict';
${extractConstStatement('clamp')}
const fmt = (value, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
};
const state = {
  data: [],
  schema: [],
  profile: null,
  targetColumn: '',
  engineeredFeatures: []
};
const els = { targetColumn: { value: '' } };
${extracted.join('\n\n')}
globalThis.__trustbench = {
  sourceSha256: ${JSON.stringify(sourceSha256)},
  extractedFunctions: ${JSON.stringify(functionNames)},
  state,
  els,
  isMissing,
  toNumber,
  parseCSV,
  columnsOf,
  quantile,
  mean,
  std,
  skewness,
  pearson,
  inferSchema,
  computeProfile,
  featureSelectionRows,
  etaSquaredNumericByCategory,
  cramersV,
  covarianceMatrix,
  powerIter,
  computePCA
};
`;

const context = vm.createContext({ console });
vm.runInContext(bootstrap, context, { filename: 'apex-extracted-runtime.js', timeout: 2000 });
const api = context.__trustbench;

function normalise(value) {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
    return value;
  }
  if (value.constructor?.name === 'Map' && typeof value.entries === 'function') {
    return Object.fromEntries([...value.entries()].map(([k, v]) => [k, normalise(v)]));
  }
  if (Array.isArray(value)) return value.map(normalise);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalise(item)]));
}

function prepareState(data, target = '', engineeredFeatures = []) {
  api.state.data = data;
  api.state.profile = api.computeProfile(data);
  api.state.schema = api.state.profile.schema;
  api.state.targetColumn = target;
  api.state.engineeredFeatures = engineeredFeatures;
  api.els.targetColumn.value = target;
}

function dispatch(request) {
  const args = Array.isArray(request.args) ? request.args : [];
  switch (request.op) {
    case 'batch':
      if (!Array.isArray(request.requests)) throw new Error('batch requires a requests array');
      return request.requests.map((item) => dispatch(item));
    case 'manifest':
      return {
        sourceSha256: api.sourceSha256,
        extractedFunctions: api.extractedFunctions
      };
    case 'is_missing': return request.values.map((value) => api.isMissing(value));
    case 'to_number': return request.values.map((value) => api.toNumber(value));
    case 'parse_csv': return api.parseCSV(request.text);
    case 'quantile': return api.quantile(request.values, request.q);
    case 'mean': return api.mean(request.values);
    case 'std': return api.std(request.values);
    case 'skewness': return api.skewness(request.values);
    case 'pearson': return api.pearson(request.x, request.y);
    case 'schema': return api.inferSchema(request.data);
    case 'profile': return api.computeProfile(request.data);
    case 'eta_squared':
      prepareState(request.data);
      return api.etaSquaredNumericByCategory(request.numericColumn, request.categoryColumn);
    case 'cramers_v':
      prepareState(request.data);
      return api.cramersV(request.columnA, request.columnB);
    case 'feature_selection':
      prepareState(request.data, request.target, request.engineeredFeatures ?? []);
      return api.featureSelectionRows();
    case 'covariance_matrix': return api.covarianceMatrix(request.matrix);
    case 'power_iteration': return api.powerIter(request.matrix);
    case 'pca':
      prepareState(request.data, request.target ?? '', request.engineeredFeatures ?? []);
      return api.computePCA();
    case 'call':
      if (!request.name || typeof api[request.name] !== 'function') throw new Error(`unsupported function: ${request.name}`);
      return api[request.name](...args);
    default: throw new Error(`unsupported operation: ${request.op}`);
  }
}

let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const request = JSON.parse(input || '{}');
  const result = normalise(dispatch(request));
  process.stdout.write(`${JSON.stringify({ ok: true, result })}\n`);
} catch (error) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: String(error?.stack || error) })}\n`);
  process.exitCode = 1;
}

(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const fmt = (value, digits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: digits });
    if (Number.isInteger(n)) return String(n);
    return n.toLocaleString(undefined, { maximumFractionDigits: digits });
  };
  const escapeHTML = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const truncate = (value, length = 24) => {
    const text = String(value ?? '');
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  };

  const storage = (() => {
    try {
      const key = '__eda_ultra_storage_test__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return window.localStorage;
    } catch (error) {
      return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    }
  })();

  const state = {
    data: [],
    originalData: [],
    datasetName: 'Manufacturing Quality Process',
    schema: [],
    profile: null,
    selectedFocus: '',
    selectedX: '',
    selectedY: '',
    chartType: 'histogram',
    seedShift: 0,
    xp: Number(storage.getItem('eda_insightlab_apex_xp') || 0),
    quizIndex: 0,
    conceptCategory: 'All',
    showcaseIndex: 0,
    cleaningHistory: [],
    pipelineSnapshots: [],
    engineeredFeatures: [],
    lastPCA: null,
    targetColumn: ""
  };

  const els = {
    themeToggle: $('#themeToggle'),
    csvUpload: $('#csvUpload'),
    dropzone: $('#dropzone'),
    demoDataset: $('#demoDataset'),
    loadDataset: $('#loadDataset'),
    randomizeDataset: $('#randomizeDataset'),
    searchBox: $('#searchBox'),
    focusColumn: $('#focusColumn'),
    xColumn: $('#xColumn'),
    yColumn: $('#yColumn'),
    chartType: $('#chartType'),
    datasetBadge: $('#datasetBadge'),
    kpiGrid: $('#kpiGrid'),
    healthDial: $('#healthDial'),
    healthList: $('#healthList'),
    insightStack: $('#insightStack'),
    table: $('#dataTable'),
    tableTitle: $('#tableTitle'),
    previewMeta: $('#previewMeta'),
    chartCanvas: $('#chartCanvas'),
    chartTitle: $('#chartTitle'),
    chartEyebrow: $('#chartEyebrow'),
    chartCaption: $('#chartCaption'),
    columnCards: $('#columnCards'),
    columnCountChip: $('#columnCountChip'),
    impactBars: $('#impactBars'),
    cleaningLog: $('#cleaningLog'),
    resetCleaning: $('#resetCleaning'),
    codeBlock: $('#codeBlock'),
    copyCode: $('#copyCode'),
    conceptSearch: $('#conceptSearch'),
    conceptTabs: $('#conceptTabs'),
    conceptGrid: $('#conceptGrid'),
    quizBox: $('#quizBox'),
    xpBadge: $('#xpBadge'),
    buildRecipe: $('#buildRecipe'),
    recipeOutput: $('#recipeOutput'),
    reportText: $('#reportText'),
    copyReport: $('#copyReport'),
    downloadReport: $('#downloadReport'),
    downloadChart: $('#downloadChart'),
    explainChart: $('#explainChart'),
    copyExecutiveSummary: $('#copyExecutiveSummary'),
    typedInsight: $('#typedInsight'),
    heroRows: $('#heroRows'),
    heroQuality: $('#heroQuality'),
    startShowcase: $('#startShowcase'),
    floatingDemo: $('#floatingDemo'),
    loadDemoAndJump: $('#loadDemoAndJump'),
    showcasePanel: $('#showcasePanel'),
    showcaseProgress: $('#showcaseProgress'),
    showcaseTitle: $('#showcaseTitle'),
    showcaseText: $('#showcaseText'),
    nextShowcase: $('#nextShowcase'),
    prevShowcase: $('#prevShowcase'),
    exitShowcase: $('#exitShowcase'),
    openPalette: $('#openPalette'),
    closePalette: $('#closePalette'),
    palette: $('#palette'),
    paletteSearch: $('#paletteSearch'),
    paletteResults: $('#paletteResults'),
    technicalQuestion: $('#technicalQuestion'),
    technicalAnswer: $('#technicalAnswer'),
    nextTechnicalQuestion: $('#nextTechnicalQuestion'),
    
    featureA: $('#featureA'),
    featureB: $('#featureB'),
    featureCat: $('#featureCat'),
    pipelineList: $('#pipelineList'),
    featureInventory: $('#featureInventory'),
    featureInventoryCount: $('#featureInventoryCount'),
    undoLastStep: $('#undoLastStep'),
    downloadProcessedCSV: $('#downloadProcessedCSV'),
    downloadPipelineJSON: $('#downloadPipelineJSON'),
    downloadPipelinePython: $('#downloadPipelinePython'),
    targetColumn: $('#targetColumn'),
    selectionLens: $('#selectionLens'),
    runFeatureSelection: $('#runFeatureSelection'),
    selectionTable: $('#selectionTable'),
    readinessRing: $('#readinessRing'),
    readinessScore: $('#readinessScore'),
    readinessText: $('#readinessText'),
    selectionDiagnostics: $('#selectionDiagnostics'),
    runPCA: $('#runPCA'),
    addPCAColumns: $('#addPCAColumns'),
    pcaCanvas: $('#pcaCanvas'),
    pcaStats: $('#pcaStats'),
    qualityResponse: $('#qualityResponse'),
    lslInput: $('#lslInput'),
    uslInput: $('#uslInput'),
    runQualityLens: $('#runQualityLens'),
    qualityOutput: $('#qualityOutput'),
    processedPreview: $('#processedPreview'),
    processedMeta: $('#processedMeta'),
    vaultDownloadCSV: $('#vaultDownloadCSV'),
    vaultDownloadReport: $('#vaultDownloadReport'),
    assistantQuestion: $('#assistantQuestion'),
    assistantAnswer: $('#assistantAnswer'),
    askAssistant: $('#askAssistant'),
    toastRegion: $('#toastRegion'),
    cursorGlow: $('#cursorGlow')
  };

  function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    return function random() {
      t += 0x6D2B79F5;
      let x = Math.imul(t ^ (t >>> 15), 1 | t);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomNormal(rand, mean = 0, sd = 1) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function choice(rand, list) {
    return list[Math.floor(rand() * list.length)];
  }

  function maybeMissing(rand, value, probability = 0.03) {
    return rand() < probability ? '' : value;
  }

  function generateStudents(seed = 42) {
    const rand = seededRandom(seed);
    const programs = ['B.Tech DS', 'B.Tech CSE', 'BBA Analytics', 'Design + Tech'];
    const backgrounds = ['Urban', 'Semi-urban', 'Rural'];
    const access = ['High', 'Moderate', 'Low'];
    const rows = [];
    for (let i = 1; i <= 180; i++) {
      const study = clamp(randomNormal(rand, 4.9, 1.6), 1, 10);
      const attendance = clamp(randomNormal(rand, 81, 10), 40, 100);
      const sleep = clamp(randomNormal(rand, 6.7, 1.1), 3.2, 9.4);
      const stress = clamp(Math.round(7.6 - sleep * 0.55 + randomNormal(rand, 1.8, 1.2)), 1, 10);
      const assignment = clamp(52 + study * 4.7 + attendance * 0.18 - stress * 1.4 + randomNormal(rand, 0, 6), 35, 100);
      const quiz = clamp(48 + study * 4.9 + attendance * 0.16 - stress * 1.1 + randomNormal(rand, 0, 7), 28, 100);
      const participation = clamp(Math.round(randomNormal(rand, 6.2, 1.8) + (attendance - 80) / 20), 1, 10);
      const commute = clamp(Math.round(randomNormal(rand, 34, 18)), 0, 110);
      const club = clamp(randomNormal(rand, 3.5, 2.0), 0, 12);
      const finalGrade = clamp(0.42 * assignment + 0.38 * quiz + 0.12 * attendance + 0.8 * participation - 0.7 * stress + randomNormal(rand, 0, 3.4), 30, 100);
      const atRisk = finalGrade < 58 || attendance < 62 || stress > 8 ? 'Yes' : 'No';
      rows.push({
        Student_ID: `STU${String(i).padStart(3, '0')}`,
        Program: choice(rand, programs),
        Background: choice(rand, backgrounds),
        Study_Hours: Number(study.toFixed(1)),
        Attendance_pct: maybeMissing(rand, Number(attendance.toFixed(1)), 0.035),
        Sleep_Hours: Number(sleep.toFixed(1)),
        Assignment_Score: Number(assignment.toFixed(1)),
        Quiz_Average: maybeMissing(rand, Number(quiz.toFixed(1)), 0.045),
        Participation: participation,
        Internet_Access: maybeMissing(rand, choice(rand, access), 0.028),
        Scholarship: rand() > 0.58 ? 'Yes' : 'No',
        Stress_Level: stress,
        Commute_Minutes: commute,
        Club_Hours: Number(club.toFixed(1)),
        Final_Grade: Number(finalGrade.toFixed(1)),
        At_Risk: atRisk
      });
    }
    rows.push({ ...rows[8] });
    rows.push({ ...rows[32] });
    rows[14].Final_Grade = 19;
    rows[77].Study_Hours = 14.5;
    return rows;
  }

  function generateStartups(seed = 101) {
    const rand = seededRandom(seed);
    const sectors = ['FinTech', 'HealthTech', 'EdTech', 'ClimateTech', 'SaaS', 'Mobility'];
    const cities = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune', 'Chennai'];
    const stages = ['Bootstrap', 'Pre-seed', 'Seed', 'Series A'];
    const rows = [];
    for (let i = 1; i <= 150; i++) {
      const sector = choice(rand, sectors);
      const stage = choice(rand, stages);
      const team = Math.round(clamp(randomNormal(rand, stage === 'Series A' ? 64 : stage === 'Seed' ? 30 : 13, 10), 3, 95));
      const marketing = clamp(randomNormal(rand, team * 0.42, 8), 2, 80);
      const burn = clamp(team * 0.72 + marketing * 0.52 + randomNormal(rand, 9, 8), 8, 150);
      const usage = clamp(randomNormal(rand, 900 + marketing * 22 + team * 9, 190), 120, 4200);
      const revenue = clamp(usage * 0.035 + marketing * 0.9 + randomNormal(rand, 10, 14), 2, 210);
      const churn = clamp(22 - usage / 260 - revenue / 45 + randomNormal(rand, 5, 3.4), 1.5, 32);
      const cac = clamp(marketing * 18000 / Math.max(30, usage / 10) + randomNormal(rand, 4500, 1200), 800, 16000);
      const growth = clamp(revenue / Math.max(10, burn) * 22 + randomNormal(rand, 8, 7), -18, 75);
      rows.push({
        Startup_ID: `ST${String(i).padStart(3, '0')}`,
        Sector: sector,
        City: choice(rand, cities),
        Funding_Stage: stage,
        Team_Size: team,
        Burn_Rate_Lakhs: Number(burn.toFixed(1)),
        Monthly_Revenue_Lakhs: Number(revenue.toFixed(1)),
        Marketing_Spend_Lakhs: Number(marketing.toFixed(1)),
        Product_Usage_Hours: Math.round(usage),
        Churn_pct: maybeMissing(rand, Number(churn.toFixed(1)), 0.04),
        CAC_Rupees: Math.round(cac),
        MRR_Growth_pct: Number(growth.toFixed(1)),
        Runway_Months: Number(clamp(18 - burn / 13 + revenue / 35 + randomNormal(rand, 0, 2.6), 2, 30).toFixed(1)),
        Enterprise_Clients: Math.round(clamp(revenue / 18 + randomNormal(rand, 2, 3), 0, 30))
      });
    }
    rows[6].Burn_Rate_Lakhs = 205;
    rows[41].CAC_Rupees = '';
    rows.push({ ...rows[13] });
    return rows;
  }

  function generateRetail(seed = 202) {
    const rand = seededRandom(seed);
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const channels = ['Store', 'App', 'Website', 'Marketplace'];
    const categories = ['Electronics', 'Fashion', 'Grocery', 'Beauty', 'Home', 'Sports'];
    const rows = [];
    for (let i = 1; i <= 210; i++) {
      const category = choice(rand, categories);
      const channel = choice(rand, channels);
      const price = clamp(randomNormal(rand, category === 'Electronics' ? 14500 : category === 'Grocery' ? 650 : 2200, category === 'Electronics' ? 5200 : 900), 90, 40000);
      const discount = clamp(randomNormal(rand, channel === 'Marketplace' ? 18 : 11, 7), 0, 45);
      const traffic = clamp(randomNormal(rand, channel === 'App' ? 2600 : 1650, 520), 300, 5200);
      const conversion = clamp(7 + discount * 0.12 - price / 12000 + randomNormal(rand, 0, 1.2), 1.2, 18);
      const units = Math.round(clamp(traffic * conversion / 100 + randomNormal(rand, 4, 9), 2, 600));
      const returns = clamp(2.6 + discount * 0.05 + (category === 'Fashion' ? 4.5 : 0) + randomNormal(rand, 0, 1.6), 0.2, 18);
      const satisfaction = clamp(4.6 - returns / 10 + conversion / 50 + randomNormal(rand, 0, .35), 1, 5);
      rows.push({
        Order_Batch: `RB${String(i).padStart(4, '0')}`,
        Region: choice(rand, regions),
        Channel: channel,
        Category: category,
        Unit_Price: Number(price.toFixed(0)),
        Discount_pct: Number(discount.toFixed(1)),
        Traffic: Math.round(traffic),
        Conversion_pct: Number(conversion.toFixed(2)),
        Units_Sold: maybeMissing(rand, units, 0.03),
        Revenue: Number((units * price * (1 - discount / 100)).toFixed(0)),
        Return_Rate_pct: maybeMissing(rand, Number(returns.toFixed(2)), 0.04),
        Customer_Satisfaction: Number(satisfaction.toFixed(2)),
        Delivery_Days: Math.round(clamp(randomNormal(rand, 3.4, 1.2), 1, 9))
      });
    }
    rows[15].Revenue = 9100000;
    rows.push({ ...rows[4] });
    return rows;
  }



  function generateManufacturing(seed = 303) {
    const rand = seededRandom(seed);
    const lines = ['Line A', 'Line B', 'Line C', 'Line D'];
    const operators = ['O-17', 'O-22', 'O-31', 'O-44', 'O-58'];
    const shifts = ['Morning', 'Evening', 'Night'];
    const materials = ['Batch M1', 'Batch M2', 'Batch M3', 'Batch M4'];
    const rows = [];
    for (let i = 1; i <= 220; i++) {
      const temp = clamp(randomNormal(rand, 72, 4.8), 58, 88);
      const pressure = clamp(randomNormal(rand, 31, 3.2), 21, 42);
      const speed = clamp(randomNormal(rand, 420, 52), 280, 560);
      const humidity = clamp(randomNormal(rand, 44, 11), 18, 78);
      const vibration = clamp(randomNormal(rand, 3.1, 1.2), .4, 8.5);
      const defect = clamp(14 + 0.36 * Math.abs(temp - 72) + 0.28 * Math.abs(pressure - 31) + 0.018 * Math.abs(speed - 420) + 0.8 * vibration + randomNormal(rand, 0, 2.1), 2, 35);
      const yieldPct = clamp(99.2 - defect * .72 - vibration * .35 + randomNormal(rand, 0, 1.1), 70, 99.8);
      rows.push({
        Run_ID: `MQ${String(i).padStart(3, '0')}`,
        Production_Line: choice(rand, lines),
        Shift: choice(rand, shifts),
        Operator_ID: choice(rand, operators),
        Material_Batch: choice(rand, materials),
        Temperature_C: Number(temp.toFixed(2)),
        Pressure_bar: Number(pressure.toFixed(2)),
        Line_Speed_RPM: Math.round(speed),
        Humidity_pct: maybeMissing(rand, Number(humidity.toFixed(1)), .035),
        Vibration_mm_s: Number(vibration.toFixed(2)),
        Defect_Rate_pct: Number(defect.toFixed(2)),
        Yield_pct: maybeMissing(rand, Number(yieldPct.toFixed(2)), .025),
        Pass_Fail: yieldPct >= 88 && defect <= 18 ? 'Pass' : 'Fail'
      });
    }
    rows[18].Vibration_mm_s = 12.8;
    rows[58].Defect_Rate_pct = 48.5;
    rows.push({ ...rows[12] });
    return rows;
  }

  function generateDOE(seed = 404) {
    const rand = seededRandom(seed);
    const rows = [];
    const catalysts = ['A', 'B', 'C'];
    for (let i = 1; i <= 168; i++) {
      const temp = choice(rand, [60, 70, 80, 90]) + randomNormal(rand, 0, 1.4);
      const pressure = choice(rand, [20, 30, 40]) + randomNormal(rand, 0, 1.1);
      const time = choice(rand, [30, 45, 60, 75]) + randomNormal(rand, 0, 2.2);
      const catalyst = choice(rand, catalysts);
      const catalystEffect = catalyst === 'B' ? 4.2 : catalyst === 'C' ? -2.4 : 0;
      const conversion = clamp(52 + 0.72 * temp + 0.48 * pressure + 0.18 * time - 0.006 * temp * temp + 0.018 * temp * pressure + catalystEffect + randomNormal(rand, 0, 3.6), 40, 98);
      const impurity = clamp(12 + 0.08 * temp - 0.11 * pressure + (catalyst === 'C' ? 2.2 : -1.1) + randomNormal(rand, 0, 1.8), 1, 25);
      rows.push({
        Experiment_ID: `DOE${String(i).padStart(3, '0')}`,
        Temperature_C: Number(temp.toFixed(2)),
        Pressure_bar: Number(pressure.toFixed(2)),
        Reaction_Time_min: Number(time.toFixed(2)),
        Catalyst: catalyst,
        Conversion_pct: Number(conversion.toFixed(2)),
        Impurity_pct: maybeMissing(rand, Number(impurity.toFixed(2)), .03),
        Optimized: conversion > 86 && impurity < 11 ? 'Yes' : 'No'
      });
    }
    rows[5].Conversion_pct = 102;
    rows.push({ ...rows[20] });
    return rows;
  }
  const datasetFactories = {
    students: { name: 'Student Outcomes Analytics', badge: 'Student Outcomes', make: generateStudents },
    startups: { name: 'Startup Growth Intelligence', badge: 'Startup Growth', make: generateStartups },
    retail: { name: 'Retail Demand Pulse', badge: 'Retail Pulse', make: generateRetail },
    manufacturing: { name: 'Manufacturing Quality Process', badge: 'Quality Engineering', make: generateManufacturing },
    doe: { name: 'DOE Response Surface Experiment', badge: 'DOE Optimization', make: generateDOE }
  };

  function isMissing(value) {
    if (value === null || value === undefined) return true;
    const text = String(value).trim().toLowerCase();
    return text === '' || text === 'na' || text === 'n/a' || text === 'null' || text === 'nan' || text === 'undefined' || text === '-';
  }

  function toNumber(value) {
    if (isMissing(value)) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const cleaned = String(value).replaceAll(',', '').trim();
    if (cleaned === '') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let insideQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"') {
        if (insideQuotes && next === '"') {
          cell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && next === '\n') i++;
        row.push(cell.trim());
        cell = '';
        if (row.some((item) => item !== '')) rows.push(row);
        row = [];
      } else {
        cell += char;
      }
    }
    row.push(cell.trim());
    if (row.some((item) => item !== '')) rows.push(row);
    if (rows.length < 2) throw new Error('CSV requires one header row and at least one data row.');
    const usedHeaders = new Set();
    const headers = rows[0].map((header, index) => {
      const base = header || `Column_${index + 1}`;
      let candidate = base;
      let suffix = 2;
      while (usedHeaders.has(candidate)) candidate = `${base}_${suffix++}`;
      usedHeaders.add(candidate);
      return candidate;
    });
    return rows.slice(1).map((values) => {
      const obj = {};
      headers.forEach((header, index) => {
        const raw = values[index] ?? '';
        const n = toNumber(raw);
        obj[header] = raw !== '' && n !== null && /^-?\d+(\.\d+)?$/.test(String(raw).replaceAll(',', '').trim()) ? n : raw;
      });
      return obj;
    });
  }

  function columnsOf(data) {
    const set = new Set();
    data.forEach((row) => Object.keys(row).forEach((key) => set.add(key)));
    return [...set];
  }

  function quantile(sorted, q) {
    if (!sorted.length) return null;
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    return sorted[base];
  }

  function mean(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  function std(values, avg = mean(values)) {
    if (values.length < 2 || avg === null) return 0;
    return Math.sqrt(values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1));
  }

  function skewness(values) {
    const n = values.length;
    if (n < 3) return 0;
    const avg = mean(values);
    const s = std(values, avg);
    if (!s) return 0;
    const standardizedThirdMoment = values.reduce((sum, value) => sum + ((value - avg) / s) ** 3, 0);
    return (n / ((n - 1) * (n - 2))) * standardizedThirdMoment;
  }

  function pearson(xs, ys) {
    const pairs = xs.map((x, i) => [toNumber(x), toNumber(ys[i])]).filter(([x, y]) => x !== null && y !== null);
    if (pairs.length < 3) return null;
    const xVals = pairs.map((p) => p[0]);
    const yVals = pairs.map((p) => p[1]);
    const mx = mean(xVals);
    const my = mean(yVals);
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (const [x, y] of pairs) {
      num += (x - mx) * (y - my);
      dx += (x - mx) ** 2;
      dy += (y - my) ** 2;
    }
    const den = Math.sqrt(dx * dy);
    return den === 0 ? null : num / den;
  }

  function inferSchema(data) {
    const columns = columnsOf(data);
    return columns.map((column) => {
      const values = data.map((row) => row[column]);
      const present = values.filter((value) => !isMissing(value));
      const numeric = present.map(toNumber).filter((value) => value !== null);
      const numericRatio = present.length ? numeric.length / present.length : 0;
      const unique = new Set(present.map((value) => String(value))).size;
      let type = 'categorical';
      if (numericRatio >= 0.82 && numeric.length >= 3) type = 'numeric';
      const normalizedName = String(column).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const idLikeName = /(^id$|_id$|^id_|identifier|uuid|guid|account_id|customer_id|user_id|order_id|record_id|row_id|key$)/.test(normalizedName);
      if (unique === present.length && present.length > data.length * 0.7 && (type !== 'numeric' || idLikeName)) type = 'identifier';
      if (present.every((value) => ['yes', 'no', 'true', 'false', '0', '1'].includes(String(value).toLowerCase()))) type = 'binary';
      return {
        name: column,
        type,
        present: present.length,
        missing: values.length - present.length,
        missingPct: values.length ? (values.length - present.length) / values.length : 0,
        unique,
        uniquePct: present.length ? unique / present.length : 0
      };
    });
  }

  function computeProfile(data) {
    const schema = inferSchema(data);
    const columns = schema.map((column) => column.name);
    const duplicateMap = new Map();
    data.forEach((row) => {
      const key = JSON.stringify(columns.map((column) => row[column] ?? ''));
      duplicateMap.set(key, (duplicateMap.get(key) || 0) + 1);
    });
    const duplicates = [...duplicateMap.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const numericSummaries = {};
    const categoricalSummaries = {};

    schema.forEach((column) => {
      const rawValues = data.map((row) => row[column.name]);
      if (column.type === 'numeric') {
        const values = rawValues.map(toNumber).filter((value) => value !== null).sort((a, b) => a - b);
        const avg = mean(values);
        const q1 = quantile(values, .25);
        const q2 = quantile(values, .5);
        const q3 = quantile(values, .75);
        const iqr = q3 !== null && q1 !== null ? q3 - q1 : 0;
        const low = q1 !== null ? q1 - 1.5 * iqr : null;
        const high = q3 !== null ? q3 + 1.5 * iqr : null;
        const outliers = values.filter((value) => (low !== null && value < low) || (high !== null && value > high));
        numericSummaries[column.name] = {
          count: values.length,
          values,
          min: values[0] ?? null,
          max: values.at(-1) ?? null,
          mean: avg,
          median: q2,
          q1,
          q3,
          iqr,
          std: std(values, avg),
          skew: skewness(values),
          outliers: outliers.length,
          outlierPct: values.length ? outliers.length / values.length : 0,
          lowFence: low,
          highFence: high
        };
      } else {
        const counts = new Map();
        rawValues.filter((value) => !isMissing(value)).forEach((value) => {
          const key = String(value);
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        categoricalSummaries[column.name] = {
          counts,
          top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12),
          mode: [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        };
      }
    });

    const numericColumns = schema.filter((column) => column.type === 'numeric').map((column) => column.name);
    const categoricalColumns = schema.filter((column) => column.type !== 'numeric').map((column) => column.name);
    const correlations = [];
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = i + 1; j < numericColumns.length; j++) {
        const a = numericColumns[i];
        const b = numericColumns[j];
        const corr = pearson(data.map((row) => row[a]), data.map((row) => row[b]));
        if (corr !== null) correlations.push({ a, b, corr });
      }
    }
    const missingCells = schema.reduce((sum, column) => sum + column.missing, 0);
    const totalCells = Math.max(1, data.length * Math.max(1, schema.length));
    const outlierCells = Object.values(numericSummaries).reduce((sum, summary) => sum + summary.outliers, 0);
    const quality = clamp(Math.round(100 - (missingCells / totalCells) * 120 - (duplicates / Math.max(1, data.length)) * 70 - (outlierCells / Math.max(1, data.length)) * 8), 0, 100);

    return {
      rows: data.length,
      columns: schema.length,
      schema,
      numericColumns,
      categoricalColumns,
      numericSummaries,
      categoricalSummaries,
      correlations,
      duplicates,
      missingCells,
      missingPct: missingCells / totalCells,
      outlierCells,
      quality
    };
  }

  function setData(rows, name = 'Uploaded Dataset', silent = false) {
    const normalized = rows.map((row) => ({ ...row }));
    state.data = normalized;
    state.originalData = normalized.map((row) => ({ ...row }));
    state.datasetName = name;
    state.cleaningHistory = [];
    state.pipelineSnapshots = [];
    state.engineeredFeatures = [];
    state.lastPCA = null;
    updateAll(true);
    if (!silent) toast(`${name} loaded: ${normalized.length} rows ready for analysis.`);
  }

  function loadBuiltIn(key = 'students', silent = false) {
    const factory = datasetFactories[key] || datasetFactories.students;
    const seedMap = { students: 42, startups: 101, retail: 202, manufacturing: 303, doe: 404 };
    const rows = factory.make((seedMap[key] || 42) + state.seedShift);
    setData(rows, factory.name, silent);
    if (els.datasetBadge) els.datasetBadge.textContent = factory.badge;
  }

  function populateSelect(select, options, selected) {
    const current = selected || select.value;
    select.innerHTML = options.map((option) => `<option value="${escapeHTML(option)}">${escapeHTML(option)}</option>`).join('');
    if (options.includes(current)) select.value = current;
    else if (options.length) select.value = options[0];
  }

  function updateAll(resetSelections = false) {
    state.schema = inferSchema(state.data);
    state.profile = computeProfile(state.data);
    const columns = state.schema.map((column) => column.name);
    const numeric = state.profile.numericColumns;
    const categorical = state.profile.categoricalColumns;
    if (resetSelections || !columns.includes(state.selectedFocus)) state.selectedFocus = numeric[0] || columns[0] || '';
    if (resetSelections || !columns.includes(state.selectedX)) state.selectedX = numeric[0] || categorical[0] || columns[0] || '';
    if (resetSelections || !columns.includes(state.selectedY)) state.selectedY = numeric[1] || numeric[0] || columns[1] || columns[0] || '';
    state.chartType = els.chartType?.value || state.chartType;

    populateSelect(els.focusColumn, columns, state.selectedFocus);
    populateSelect(els.xColumn, columns, state.selectedX);
    populateSelect(els.yColumn, columns, state.selectedY);
    els.focusColumn.value = state.selectedFocus;
    els.xColumn.value = state.selectedX;
    els.yColumn.value = state.selectedY;
    els.chartType.value = state.chartType;

    renderKPIs();
    renderHealth();
    renderInsights();
    renderTable();
    renderColumnCards();
    renderChart();
    renderImpact();
    renderCode();
    renderReport();
    renderHeroMetrics();
    renderApexModules(resetSelections);
  }

  function renderHeroMetrics() {
    if (!state.profile) return;
    if (els.heroRows) els.heroRows.textContent = fmt(state.profile.rows, 0);
    if (els.heroQuality) els.heroQuality.textContent = fmt(state.profile.quality, 0);
  }

  function renderKPIs() {
    const p = state.profile;
    const cards = [
      ['Rows', p.rows, 'records in current dataset'],
      ['Columns', p.columns, `${p.numericColumns.length} numeric, ${p.categoricalColumns.length} categorical`],
      ['Missing', `${fmt(p.missingPct * 100, 1)}%`, `${p.missingCells} empty cells detected`],
      ['Duplicates', p.duplicates, 'exact repeated rows'],
      ['Outliers', p.outlierCells, 'IQR pressure across numeric columns'],
      ['Quality', p.quality, 'rule-based data health score']
    ];
    els.kpiGrid.innerHTML = cards.map(([label, value, note]) => `
      <article class="kpi-card tilt-card">
        <span>${escapeHTML(label)}</span>
        <strong>${escapeHTML(value)}</strong>
        <small>${escapeHTML(note)}</small>
      </article>
    `).join('');
  }

  function renderHealth() {
    const p = state.profile;
    els.healthDial.style.setProperty('--score', p.quality);
    els.healthDial.innerHTML = `<strong>${p.quality}</strong><span>/100</span>`;
    const topMissing = [...p.schema].sort((a, b) => b.missingPct - a.missingPct)[0];
    const topOutlier = Object.entries(p.numericSummaries).sort((a, b) => b[1].outlierPct - a[1].outlierPct)[0];
    const bestCorr = [...p.correlations].sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))[0];
    const lines = [
      `Missingness is ${fmt(p.missingPct * 100, 1)}% across ${fmt(p.rows * p.columns, 0)} cells.`,
      `${p.duplicates} duplicate row${p.duplicates === 1 ? '' : 's'} found.`,
      topMissing ? `Highest missing column: ${topMissing.name} (${fmt(topMissing.missingPct * 100, 1)}%).` : 'No missingness detected.',
      topOutlier ? `Strongest outlier pressure: ${topOutlier[0]} (${fmt(topOutlier[1].outlierPct * 100, 1)}%).` : 'No numeric outlier signal detected.',
      bestCorr ? `Highest correlation: ${bestCorr.a} ↔ ${bestCorr.b} (${fmt(bestCorr.corr, 2)}).` : 'Correlation requires at least two numeric columns.'
    ];
    els.healthList.innerHTML = lines.map((line) => `<li>${escapeHTML(line)}</li>`).join('');
  }

  function getInsightList() {
    const p = state.profile;
    const insights = [];
    if (p.quality >= 88) insights.push({ kind: 'good', title: 'Strong data foundation', text: `The current dataset health score is ${p.quality}/100, which is suitable for a public demo and early analysis.` });
    else if (p.quality >= 70) insights.push({ kind: 'warn', title: 'Usable but needs cleaning', text: `The dataset score is ${p.quality}/100. Clean missing values, duplicates, and outliers before final modeling.` });
    else insights.push({ kind: 'critical', title: 'High cleaning priority', text: `The dataset score is ${p.quality}/100. The next step should be data quality repair before interpretation.` });

    const missing = [...p.schema].filter((column) => column.missing > 0).sort((a, b) => b.missingPct - a.missingPct)[0];
    if (missing) insights.push({ kind: missing.missingPct > .1 ? 'critical' : 'warn', title: 'Missingness pattern', text: `${missing.name} has the highest missingness at ${fmt(missing.missingPct * 100, 1)}%. Explain whether the absence is random or linked to collection process.` });

    const corr = [...p.correlations].sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))[0];
    if (corr && Math.abs(corr.corr) > .65) insights.push({ kind: 'good', title: 'Relationship signal detected', text: `${corr.a} and ${corr.b} show a ${Math.abs(corr.corr) > .85 ? 'very strong' : 'strong'} ${corr.corr > 0 ? 'positive' : 'negative'} correlation (${fmt(corr.corr, 2)}). This is a strong storytelling moment.` });

    const skew = Object.entries(p.numericSummaries).filter(([, s]) => Math.abs(s.skew) > .8).sort((a, b) => Math.abs(b[1].skew) - Math.abs(a[1].skew))[0];
    if (skew) insights.push({ kind: 'warn', title: 'Skewed distribution', text: `${skew[0]} is ${skew[1].skew > 0 ? 'right' : 'left'}-skewed (skewness ${fmt(skew[1].skew, 2)}). Median and IQR may be more robust than mean and standard deviation.` });

    const outlier = Object.entries(p.numericSummaries).filter(([, s]) => s.outliers > 0).sort((a, b) => b[1].outlierPct - a[1].outlierPct)[0];
    if (outlier) insights.push({ kind: outlier[1].outlierPct > .05 ? 'critical' : 'warn', title: 'Outlier diagnostic', text: `${outlier[0]} has ${outlier[1].outliers} IQR outlier${outlier[1].outliers === 1 ? '' : 's'}. Confirm whether these are valid extreme cases or data-entry errors.` });

    const highCardinality = p.schema.filter((column) => column.type !== 'numeric' && column.uniquePct > .7 && column.unique > 20)[0];
    if (highCardinality) insights.push({ kind: 'warn', title: 'High-cardinality feature', text: `${highCardinality.name} behaves like an identifier. It should usually be excluded from aggregate EDA charts and predictive modeling features.` });

    if (p.duplicates > 0) insights.push({ kind: 'warn', title: 'Duplicate rows present', text: `${p.duplicates} duplicate row${p.duplicates === 1 ? '' : 's'} may inflate counts and bias aggregate statistics. Deduplicate before reporting totals.` });

    insights.push({ kind: 'good', title: 'Recommended demo path', text: 'Show health score → correlation heatmap → missingness map → cleaning lab → generated report. That gives executives and developers both product value and technical substance.' });
    return insights.slice(0, 7);
  }

  function renderInsights() {
    const insights = getInsightList();
    els.insightStack.innerHTML = insights.map((item) => `
      <article class="insight-card ${item.kind}">
        <b>${escapeHTML(item.title)}</b>
        <p>${escapeHTML(item.text)}</p>
      </article>
    `).join('');
  }

  function renderTable() {
    const query = els.searchBox.value.trim().toLowerCase();
    const columns = state.schema.map((column) => column.name);
    const filtered = query
      ? state.data.filter((row) => columns.some((column) => String(row[column] ?? '').toLowerCase().includes(query)))
      : state.data;
    const visible = filtered.slice(0, 24);
    els.tableTitle.textContent = `First ${Math.min(24, visible.length)} records`;
    els.previewMeta.textContent = `${filtered.length} matching rows`;
    els.table.innerHTML = `
      <thead><tr>${columns.map((column) => `<th>${escapeHTML(column)}</th>`).join('')}</tr></thead>
      <tbody>${visible.map((row) => `<tr>${columns.map((column) => `<td>${isMissing(row[column]) ? '<em>missing</em>' : escapeHTML(row[column])}</td>`).join('')}</tr>`).join('')}</tbody>
    `;
  }

  function renderColumnCards() {
    const p = state.profile;
    els.columnCountChip.textContent = `${p.columns} columns`;
    els.columnCards.innerHTML = p.schema.map((column) => {
      const summary = column.type === 'numeric' ? p.numericSummaries[column.name] : p.categoricalSummaries[column.name];
      const detail = column.type === 'numeric'
        ? `mean ${fmt(summary.mean)}, median ${fmt(summary.median)}, range ${fmt(summary.min)} → ${fmt(summary.max)}, outliers ${summary.outliers}`
        : `${column.unique} unique values; top value ${summary.mode ?? '—'}`;
      const spark = column.type === 'numeric' ? sparkBars(summary.values) : sparkBars([...summary.counts.values()]);
      return `
        <article class="column-card">
          <header><b>${escapeHTML(column.name)}</b><span class="type-chip">${escapeHTML(column.type)}</span></header>
          <p>${escapeHTML(detail)}</p>
          <p>Missing: ${fmt(column.missingPct * 100, 1)}% · Present: ${column.present}</p>
          <div class="spark" aria-hidden="true">${spark}</div>
        </article>
      `;
    }).join('');
  }

  function sparkBars(values) {
    const clean = values.map(Number).filter(Number.isFinite);
    if (!clean.length) return Array.from({ length: 10 }, () => '<i style="height:10%"></i>').join('');
    const max = Math.max(...clean) || 1;
    const take = clean.length > 18 ? clean.filter((_, i) => i % Math.ceil(clean.length / 18) === 0).slice(0, 18) : clean;
    return take.map((value) => `<i style="height:${clamp((value / max) * 100, 8, 100)}%"></i>`).join('');
  }

  function scaleLinear(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const span = d1 - d0 || 1;
    return (value) => r0 + ((value - d0) / span) * (r1 - r0);
  }

  function svgWrap(width, height, content) {
    return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${defs()}${content}</svg>`;
  }

  function defs() {
    return `
      <defs>
        <linearGradient id="barGrad" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#7c5cff" />
          <stop offset="0.55" stop-color="#00d5ff" />
          <stop offset="1" stop-color="#39ffb6" />
        </linearGradient>
        <linearGradient id="pinkGrad" x1="0" x2="1" y1="0" y2="0">
          <stop stop-color="#ff5edb" />
          <stop offset="1" stop-color="#ffd166" />
        </linearGradient>
        <filter id="chartGlow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#00d5ff" flood-opacity="0.32"/></filter>
      </defs>
    `;
  }

  function axisGrid(width, height, margin, yTicks = 5) {
    let lines = '';
    for (let i = 0; i <= yTicks; i++) {
      const y = margin.top + (height - margin.top - margin.bottom) * (i / yTicks);
      lines += `<line class="chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${y}" y2="${y}" />`;
    }
    return lines;
  }

  function chooseNumericColumn(preferred) {
    return state.profile.numericColumns.includes(preferred) ? preferred : state.profile.numericColumns[0];
  }

  function chooseCategoricalColumn(preferred) {
    return state.profile.categoricalColumns.includes(preferred) ? preferred : state.profile.categoricalColumns[0];
  }

  function renderChart() {
    const type = state.chartType;
    let result;
    if (type === 'histogram') result = chartHistogram();
    else if (type === 'boxplot') result = chartBoxplot();
    else if (type === 'scatter') result = chartScatter();
    else if (type === 'bar') result = chartBar();
    else if (type === 'line') result = chartLine();
    else if (type === 'heatmap') result = chartHeatmap();
    else if (type === 'missingness') result = chartMissingness();
    else result = chartProfile();
    els.chartEyebrow.textContent = result.eyebrow;
    els.chartTitle.textContent = result.title;
    els.chartCanvas.innerHTML = result.svg;
    els.chartCaption.textContent = result.caption;
    attachSvgTooltips();
  }

  function noChart(message) {
    return {
      eyebrow: 'Needs data',
      title: 'Chart unavailable',
      caption: message,
      svg: svgWrap(900, 520, `<text x="450" y="260" text-anchor="middle" fill="currentColor" class="chart-title-svg">${escapeHTML(message)}</text>`)
    };
  }

  function chartHistogram() {
    const col = chooseNumericColumn(state.selectedFocus || state.selectedX);
    if (!col) return noChart('Histogram requires at least one numeric column.');
    const s = state.profile.numericSummaries[col];
    const values = s.values;
    const width = 900;
    const height = 520;
    const margin = { top: 42, right: 32, bottom: 66, left: 68 };
    const binsCount = Math.min(16, Math.max(8, Math.round(Math.sqrt(values.length))));
    const min = s.min;
    const max = s.max;
    const binSize = (max - min || 1) / binsCount;
    const bins = Array.from({ length: binsCount }, (_, i) => ({ start: min + i * binSize, end: min + (i + 1) * binSize, count: 0 }));
    values.forEach((value) => {
      const index = clamp(Math.floor((value - min) / binSize), 0, binsCount - 1);
      bins[index].count++;
    });
    const x = scaleLinear([min, max || min + 1], [margin.left, width - margin.right]);
    const y = scaleLinear([0, Math.max(1, ...bins.map((bin) => bin.count))], [height - margin.bottom, margin.top]);
    const bars = bins.map((bin) => {
      const bx = x(bin.start) + 2;
      const bw = Math.max(3, x(bin.end) - x(bin.start) - 4);
      const bh = height - margin.bottom - y(bin.count);
      return `<rect x="${bx}" y="${y(bin.count)}" width="${bw}" height="${bh}" rx="8" fill="url(#barGrad)" filter="url(#chartGlow)" data-tip="${escapeHTML(`${fmt(bin.start)} to ${fmt(bin.end)}: ${bin.count} rows`)}" />`;
    }).join('');
    const labels = [0, .25, .5, .75, 1].map((t) => `<text class="chart-label" x="${margin.left + (width - margin.left - margin.right) * t}" y="${height - 24}" text-anchor="middle">${fmt(min + (max - min) * t, 1)}</text>`).join('');
    const svg = svgWrap(width, height, `
      ${axisGrid(width, height, margin)}
      <text class="chart-title-svg" x="${margin.left}" y="28">Distribution of ${escapeHTML(col)}</text>
      ${bars}
      ${labels}
      <text class="chart-label" x="${width / 2}" y="${height - 4}" text-anchor="middle">${escapeHTML(col)}</text>
      <text class="chart-label" transform="translate(18 ${height / 2}) rotate(-90)" text-anchor="middle">Frequency</text>
    `);
    return { eyebrow: 'Histogram', title: `Distribution of ${col}`, svg, caption: `${col} has mean ${fmt(s.mean)}, median ${fmt(s.median)}, and skewness ${fmt(s.skew, 2)}. Use this chart to explain symmetry, skew, and typical values.` };
  }

  function chartBoxplot() {
    const col = chooseNumericColumn(state.selectedFocus || state.selectedY);
    if (!col) return noChart('Box plot requires at least one numeric column.');
    const s = state.profile.numericSummaries[col];
    const width = 900;
    const height = 520;
    const margin = { top: 60, right: 60, bottom: 70, left: 70 };
    const x = scaleLinear([s.min, s.max || s.min + 1], [margin.left, width - margin.right]);
    const cy = height / 2;
    const boxH = 120;
    const outliers = s.values.filter((value) => value < s.lowFence || value > s.highFence).slice(0, 50);
    const svg = svgWrap(width, height, `
      ${axisGrid(width, height, margin, 4)}
      <text class="chart-title-svg" x="${margin.left}" y="34">Box plot of ${escapeHTML(col)}</text>
      <line x1="${x(Math.max(s.min, s.lowFence))}" x2="${x(Math.min(s.max, s.highFence))}" y1="${cy}" y2="${cy}" stroke="url(#barGrad)" stroke-width="8" stroke-linecap="round" />
      <rect x="${x(s.q1)}" y="${cy - boxH / 2}" width="${Math.max(2, x(s.q3) - x(s.q1))}" height="${boxH}" rx="18" fill="rgba(0,213,255,.18)" stroke="url(#barGrad)" stroke-width="3" />
      <line x1="${x(s.median)}" x2="${x(s.median)}" y1="${cy - boxH / 2 - 22}" y2="${cy + boxH / 2 + 22}" stroke="#39ffb6" stroke-width="5" stroke-linecap="round" />
      <line x1="${x(Math.max(s.min, s.lowFence))}" x2="${x(Math.max(s.min, s.lowFence))}" y1="${cy - 54}" y2="${cy + 54}" stroke="var(--muted)" stroke-width="3" />
      <line x1="${x(Math.min(s.max, s.highFence))}" x2="${x(Math.min(s.max, s.highFence))}" y1="${cy - 54}" y2="${cy + 54}" stroke="var(--muted)" stroke-width="3" />
      ${outliers.map((value, i) => `<circle cx="${x(value)}" cy="${cy + (i % 2 ? -92 : 92)}" r="6" fill="#ff6575" data-tip="Outlier: ${fmt(value)}" />`).join('')}
      ${[s.min, s.q1, s.median, s.q3, s.max].map((value) => `<text class="chart-label" x="${x(value)}" y="${height - 34}" text-anchor="middle">${fmt(value, 1)}</text>`).join('')}
      <text class="chart-label" x="${x(s.q1)}" y="${cy - boxH / 2 - 16}" text-anchor="middle">Q1</text>
      <text class="chart-label" x="${x(s.median)}" y="${cy - boxH / 2 - 16}" text-anchor="middle">Median</text>
      <text class="chart-label" x="${x(s.q3)}" y="${cy - boxH / 2 - 16}" text-anchor="middle">Q3</text>
    `);
    return { eyebrow: 'Box Plot', title: `Spread and outliers in ${col}`, svg, caption: `The middle 50% of ${col} lies between ${fmt(s.q1)} and ${fmt(s.q3)}. The IQR method flags ${s.outliers} possible outlier${s.outliers === 1 ? '' : 's'}.` };
  }

  function chartScatter() {
    let xCol = chooseNumericColumn(state.selectedX);
    let yCol = chooseNumericColumn(state.selectedY);
    if (!xCol || !yCol) return noChart('Scatter plot requires two numeric columns.');
    if (xCol === yCol) yCol = state.profile.numericColumns.find((column) => column !== xCol) || yCol;
    const xValues = state.data.map((row) => toNumber(row[xCol]));
    const yValues = state.data.map((row) => toNumber(row[yCol]));
    const pairs = state.data.map((row) => ({ x: toNumber(row[xCol]), y: toNumber(row[yCol]), row })).filter((p) => p.x !== null && p.y !== null);
    const xMin = Math.min(...pairs.map((p) => p.x));
    const xMax = Math.max(...pairs.map((p) => p.x));
    const yMin = Math.min(...pairs.map((p) => p.y));
    const yMax = Math.max(...pairs.map((p) => p.y));
    const corr = pearson(xValues, yValues);
    const width = 900;
    const height = 520;
    const margin = { top: 54, right: 38, bottom: 70, left: 78 };
    const x = scaleLinear([xMin, xMax || xMin + 1], [margin.left, width - margin.right]);
    const y = scaleLinear([yMin, yMax || yMin + 1], [height - margin.bottom, margin.top]);
    const points = pairs.slice(0, 650).map((p, i) => `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="5.5" fill="${i % 3 === 0 ? '#7c5cff' : i % 3 === 1 ? '#00d5ff' : '#39ffb6'}" opacity=".72" data-tip="${escapeHTML(`${xCol}: ${fmt(p.x)} · ${yCol}: ${fmt(p.y)}`)}" />`).join('');
    const labels = [0, .25, .5, .75, 1].map((t) => `
      <text class="chart-label" x="${margin.left + (width - margin.left - margin.right) * t}" y="${height - 32}" text-anchor="middle">${fmt(xMin + (xMax - xMin) * t, 1)}</text>
      <text class="chart-label" x="${margin.left - 14}" y="${height - margin.bottom - (height - margin.top - margin.bottom) * t}" text-anchor="end" dominant-baseline="middle">${fmt(yMin + (yMax - yMin) * t, 1)}</text>
    `).join('');
    const svg = svgWrap(width, height, `
      ${axisGrid(width, height, margin)}
      <text class="chart-title-svg" x="${margin.left}" y="34">${escapeHTML(xCol)} vs ${escapeHTML(yCol)}</text>
      ${points}
      ${labels}
      <text class="chart-label" x="${width / 2}" y="${height - 6}" text-anchor="middle">${escapeHTML(xCol)}</text>
      <text class="chart-label" transform="translate(22 ${height / 2}) rotate(-90)" text-anchor="middle">${escapeHTML(yCol)}</text>
      <text class="chart-label" x="${width - margin.right}" y="34" text-anchor="end">r = ${fmt(corr, 2)}</text>
    `);
    return { eyebrow: 'Scatter Plot', title: `${xCol} vs ${yCol}`, svg, caption: `Pearson correlation is ${fmt(corr, 2)}. This chart is ideal for explaining direction, strength, clusters, and outliers between two numeric variables.` };
  }

  function chartBar() {
    const col = chooseCategoricalColumn(state.selectedX || state.selectedFocus);
    if (!col) return noChart('Bar chart requires at least one categorical column.');
    const top = state.profile.categoricalSummaries[col].top.slice(0, 12);
    const max = Math.max(...top.map(([, count]) => count), 1);
    const width = 900;
    const height = 520;
    const margin = { top: 54, right: 32, bottom: 120, left: 64 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const bw = innerW / top.length;
    const y = scaleLinear([0, max], [height - margin.bottom, margin.top]);
    const bars = top.map(([label, count], i) => {
      const x = margin.left + i * bw + bw * .14;
      const h = height - margin.bottom - y(count);
      return `<g><rect x="${x}" y="${y(count)}" width="${bw * .72}" height="${h}" rx="10" fill="url(#barGrad)" data-tip="${escapeHTML(`${label}: ${count} rows`)}" /><text class="chart-label" x="${x + bw * .36}" y="${height - 92}" transform="rotate(-38 ${x + bw * .36} ${height - 92})" text-anchor="end">${escapeHTML(truncate(label, 13))}</text></g>`;
    }).join('');
    const svg = svgWrap(width, height, `
      ${axisGrid(width, height, margin)}
      <text class="chart-title-svg" x="${margin.left}" y="34">Category frequency: ${escapeHTML(col)}</text>
      ${bars}
      <text class="chart-label" x="${width / 2}" y="${height - 12}" text-anchor="middle">Top categories</text>
      <text class="chart-label" transform="translate(20 ${height / 2}) rotate(-90)" text-anchor="middle">Rows</text>
    `);
    return { eyebrow: 'Categorical Bar', title: `Frequency of ${col}`, svg, caption: `${col} has ${state.schema.find((c) => c.name === col).unique} unique values. Bar charts are best for comparing category frequency and identifying class imbalance.` };
  }

  function chartLine() {
    let yCol = chooseNumericColumn(state.selectedY || state.selectedFocus);
    let xCol = state.selectedX;
    if (!yCol) return noChart('Trend line requires at least one numeric Y column.');
    const points = state.data.map((row, index) => ({ x: toNumber(row[xCol]), y: toNumber(row[yCol]), label: row[xCol] ?? index + 1, index })).filter((p) => p.y !== null).slice(0, 140);
    const useNumericX = points.filter((p) => p.x !== null).length > points.length * .8;
    if (useNumericX) points.sort((a, b) => a.x - b.x);
    const xDomain = useNumericX ? [Math.min(...points.map((p) => p.x)), Math.max(...points.map((p) => p.x))] : [0, Math.max(1, points.length - 1)];
    const yDomain = [Math.min(...points.map((p) => p.y)), Math.max(...points.map((p) => p.y))];
    const width = 900;
    const height = 520;
    const margin = { top: 54, right: 42, bottom: 72, left: 78 };
    const x = scaleLinear(xDomain, [margin.left, width - margin.right]);
    const y = scaleLinear(yDomain, [height - margin.bottom, margin.top]);
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(useNumericX ? p.x : i)} ${y(p.y)}`).join(' ');
    const circles = points.filter((_, i) => i % Math.ceil(points.length / 28) === 0).map((p, i) => `<circle cx="${x(useNumericX ? p.x : p.index)}" cy="${y(p.y)}" r="5" fill="#39ffb6" data-tip="${escapeHTML(`${xCol}: ${p.label} · ${yCol}: ${fmt(p.y)}`)}" />`).join('');
    const svg = svgWrap(width, height, `
      ${axisGrid(width, height, margin)}
      <text class="chart-title-svg" x="${margin.left}" y="34">Trend of ${escapeHTML(yCol)}</text>
      <path d="${path}" fill="none" stroke="url(#barGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#chartGlow)" />
      ${circles}
      <text class="chart-label" x="${width / 2}" y="${height - 8}" text-anchor="middle">${escapeHTML(useNumericX ? xCol : 'Record order')}</text>
      <text class="chart-label" transform="translate(22 ${height / 2}) rotate(-90)" text-anchor="middle">${escapeHTML(yCol)}</text>
    `);
    return { eyebrow: 'Trend Line', title: `Trend of ${yCol}`, svg, caption: `Line charts are useful when record order, time, or an ordered numeric field carries meaning. Here it shows how ${yCol} changes across the selected ordering.` };
  }

  function chartHeatmap() {
    const cols = state.profile.numericColumns.slice(0, 9);
    if (cols.length < 2) return noChart('Correlation heatmap requires at least two numeric columns.');
    const width = 900;
    const height = 560;
    const margin = { top: 90, right: 34, bottom: 120, left: 150 };
    const size = Math.min((width - margin.left - margin.right) / cols.length, (height - margin.top - margin.bottom) / cols.length);
    const corrValue = (a, b) => a === b ? 1 : pearson(state.data.map((row) => row[a]), state.data.map((row) => row[b]));
    const cells = cols.map((a, i) => cols.map((b, j) => {
      const corr = corrValue(a, b) ?? 0;
      const strength = Math.abs(corr);
      const color = corr >= 0 ? `rgba(0, 213, 255, ${0.14 + strength * .76})` : `rgba(255, 94, 219, ${0.14 + strength * .76})`;
      return `<rect x="${margin.left + j * size}" y="${margin.top + i * size}" width="${size - 3}" height="${size - 3}" rx="10" fill="${color}" data-tip="${escapeHTML(`${a} ↔ ${b}: r=${fmt(corr, 2)}`)}" /><text x="${margin.left + j * size + size / 2}" y="${margin.top + i * size + size / 2 + 4}" text-anchor="middle" fill="var(--text)" font-size="11">${fmt(corr, 2)}</text>`;
    }).join('')).join('');
    const xLabels = cols.map((col, i) => `<text class="chart-label" x="${margin.left + i * size + size / 2}" y="${margin.top - 12}" text-anchor="start" transform="rotate(-38 ${margin.left + i * size + size / 2} ${margin.top - 12})">${escapeHTML(truncate(col, 14))}</text>`).join('');
    const yLabels = cols.map((col, i) => `<text class="chart-label" x="${margin.left - 12}" y="${margin.top + i * size + size / 2 + 4}" text-anchor="end">${escapeHTML(truncate(col, 18))}</text>`).join('');
    const svg = svgWrap(width, height, `
      <text class="chart-title-svg" x="${margin.left}" y="38">Correlation heatmap</text>
      ${xLabels}${yLabels}${cells}
      <text class="chart-label" x="${margin.left}" y="${height - 26}">Cyan = positive relationship · Pink = negative relationship · Deeper color = stronger absolute correlation</text>
    `);
    const strongest = [...state.profile.correlations].sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))[0];
    const caption = strongest ? `The strongest relationship is ${strongest.a} ↔ ${strongest.b} with r=${fmt(strongest.corr, 2)}. This supports discussion of multicollinearity and feature relationships.` : 'No correlation pairs available.';
    return { eyebrow: 'Correlation Heatmap', title: 'Numeric relationship map', svg, caption };
  }

  function chartMissingness() {
    const cols = state.schema.slice(0, 18).map((column) => column.name);
    const rows = state.data.slice(0, 70);
    const width = 900;
    const height = 560;
    const margin = { top: 82, right: 28, bottom: 86, left: 84 };
    const cellW = (width - margin.left - margin.right) / cols.length;
    const cellH = Math.min(9, (height - margin.top - margin.bottom) / rows.length);
    const cells = rows.map((row, r) => cols.map((col, c) => {
      const miss = isMissing(row[col]);
      return `<rect x="${margin.left + c * cellW}" y="${margin.top + r * cellH}" width="${Math.max(3, cellW - 2)}" height="${Math.max(3, cellH - 1)}" rx="2" fill="${miss ? '#ff6575' : 'rgba(57,255,182,.42)'}" data-tip="${escapeHTML(`${col} row ${r + 1}: ${miss ? 'missing' : 'present'}`)}" />`;
    }).join('')).join('');
    const labels = cols.map((col, i) => `<text class="chart-label" x="${margin.left + i * cellW + cellW / 2}" y="${margin.top - 12}" text-anchor="start" transform="rotate(-42 ${margin.left + i * cellW + cellW / 2} ${margin.top - 12})">${escapeHTML(truncate(col, 13))}</text>`).join('');
    const svg = svgWrap(width, height, `
      <text class="chart-title-svg" x="${margin.left}" y="36">Missingness map</text>
      ${labels}${cells}
      <text class="chart-label" x="${margin.left}" y="${height - 38}">Green = present · Red = missing · Showing first ${rows.length} rows and first ${cols.length} columns</text>
    `);
    return { eyebrow: 'Missingness Map', title: 'Where the data is incomplete', svg, caption: `The map shows missing values by position. This is useful for detecting whether missingness is isolated, column-wise, or clustered by row groups.` };
  }

  function chartProfile() {
    const col = state.selectedFocus || state.schema[0]?.name;
    const meta = state.schema.find((column) => column.name === col);
    if (!meta) return noChart('No column selected.');
    if (meta.type === 'numeric') return chartHistogram();
    return chartBar();
  }

  function attachSvgTooltips() {
    let tooltip = $('.tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      document.body.appendChild(tooltip);
    }
    $$('[data-tip]', els.chartCanvas).forEach((node) => {
      node.addEventListener('pointermove', (event) => {
        tooltip.textContent = node.getAttribute('data-tip');
        tooltip.style.left = `${event.clientX}px`;
        tooltip.style.top = `${event.clientY}px`;
        tooltip.style.opacity = '1';
      });
      node.addEventListener('pointerleave', () => {
        tooltip.style.opacity = '0';
      });
    });
  }

  function renderImpact() {
    const p = state.profile;
    const metrics = [
      ['Quality score', p.quality, 100],
      ['Completeness', Math.round((1 - p.missingPct) * 100), 100],
      ['Uniqueness', Math.round((1 - p.duplicates / Math.max(1, p.rows)) * 100), 100],
      ['Outlier control', Math.round((1 - p.outlierCells / Math.max(1, p.rows * Math.max(1, p.numericColumns.length))) * 100), 100]
    ];
    els.impactBars.innerHTML = metrics.map(([label, value, max]) => `
      <div class="impact-row">
        <header><span>${escapeHTML(label)}</span><b>${fmt(value, 0)}%</b></header>
        <div class="impact-track"><div class="impact-fill" style="width:${clamp(value / max * 100, 2, 100)}%"></div></div>
      </div>
    `).join('');
  }

  function applyCleaning(action) {
    if (action === 'impute') {
      state.schema.forEach((column) => {
        if (column.type === 'numeric') {
          const median = state.profile.numericSummaries[column.name]?.median ?? 0;
          state.data.forEach((row) => { if (isMissing(row[column.name])) row[column.name] = Number(median.toFixed(3)); });
        } else {
          const mode = state.profile.categoricalSummaries[column.name]?.mode ?? 'Unknown';
          state.data.forEach((row) => { if (isMissing(row[column.name])) row[column.name] = mode; });
        }
      });
      state.cleaningHistory.push('Imputed missing values using median for numeric columns and mode for categorical columns.');
      els.cleaningLog.textContent = 'Missing values imputed. This is appropriate for a controlled demo because it preserves rows while making completeness visible. In real analysis, missingness mechanism should be investigated first.';
      toast('Missing values imputed.');
    }
    if (action === 'duplicates') {
      const columns = state.schema.map((column) => column.name);
      const seen = new Set();
      const before = state.data.length;
      state.data = state.data.filter((row) => {
        const key = JSON.stringify(columns.map((column) => row[column] ?? ''));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const removed = before - state.data.length;
      state.cleaningHistory.push(`Removed ${removed} exact duplicate row(s).`);
      els.cleaningLog.textContent = `Removed ${removed} duplicate row(s). This prevents repeated records from inflating totals, category counts, and summary statistics.`;
      toast(`${removed} duplicate row(s) removed.`);
    }
    if (action === 'outliers') {
      let capped = 0;
      state.profile.numericColumns.forEach((column) => {
        const s = state.profile.numericSummaries[column];
        state.data.forEach((row) => {
          const n = toNumber(row[column]);
          if (n === null) return;
          if (n < s.lowFence) { row[column] = Number(s.lowFence.toFixed(3)); capped++; }
          if (n > s.highFence) { row[column] = Number(s.highFence.toFixed(3)); capped++; }
        });
      });
      state.cleaningHistory.push(`Capped ${capped} numeric outlier value(s) using IQR fences.`);
      els.cleaningLog.textContent = `Capped ${capped} outlier value(s) using IQR fences. This is a conservative choice when extremes are likely errors or would dominate visualization scale.`;
      toast(`${capped} outlier value(s) capped.`);
    }
    if (action === 'encode') {
      state.cleaningHistory.push('Recommended encoding: one-hot for nominal categories, ordinal mapping only when a real order exists.');
      els.cleaningLog.textContent = 'Encoding recommendation generated. Use one-hot encoding for nominal categories like Program or Region. Use ordinal encoding only if the levels have a meaningful order.';
      toast('Encoding strategy added to report.');
    }
    if (action === 'scale') {
      state.cleaningHistory.push('Recommended scaling: standardization for distance-based and gradient-based models; keep original units for EDA interpretation.');
      els.cleaningLog.textContent = 'Scaling recommendation generated. Keep original values for EDA explainability, but standardize features before algorithms that depend on distance or gradient scale.';
      toast('Scaling strategy added to report.');
    }
    updateAll(false);
  }

  function renderCode() {
    const focus = state.selectedFocus || 'selected_column';
    const x = state.selectedX || 'x_column';
    const y = state.selectedY || 'y_column';
    const code = `# EDA InsightLab Apex - Python companion snippet
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# 1. Load dataset
df = pd.read_csv("your_dataset.csv")

# 2. Basic structure
print(df.shape)
print(df.info())
print(df.describe(include="all"))

# 3. Data quality audit
missing = df.isna().mean().sort_values(ascending=False) * 100
duplicates = df.duplicated().sum()
print("Missing % by column:\n", missing)
print("Duplicate rows:", duplicates)

# 4. Focus column profile
focus_col = "${focus}"
print(df[focus_col].describe())

# 5. Visualization example
x_col = "${x}"
y_col = "${y}"
if pd.api.types.is_numeric_dtype(df[x_col]) and pd.api.types.is_numeric_dtype(df[y_col]):
    sns.scatterplot(data=df, x=x_col, y=y_col)
    plt.title(f"{x_col} vs {y_col}")
    plt.show()

# 6. Robust numeric imputation
for col in df.select_dtypes(include=np.number).columns:
    df[col] = df[col].fillna(df[col].median())

# 7. Categorical imputation
for col in df.select_dtypes(exclude=np.number).columns:
    df[col] = df[col].fillna(df[col].mode(dropna=True).iloc[0])

# 8. Duplicate removal
df = df.drop_duplicates()

# 9. IQR outlier report
for col in df.select_dtypes(include=np.number).columns:
    q1 = df[col].quantile(0.25)
    q3 = df[col].quantile(0.75)
    iqr = q3 - q1
    outliers = df[(df[col] < q1 - 1.5 * iqr) | (df[col] > q3 + 1.5 * iqr)]
    print(col, len(outliers))`;
    els.codeBlock.textContent = code;
  }

  function executiveSummary() {
    const p = state.profile;
    const top = getInsightList().slice(0, 4).map((item) => `- ${item.title}: ${item.text}`).join('\n');
    return `EDA InsightLab Apex analyzed ${state.datasetName} with ${p.rows} rows and ${p.columns} columns. The current data health score is ${p.quality}/100. Missingness is ${fmt(p.missingPct * 100, 1)}%, duplicate rows are ${p.duplicates}, and ${p.numericColumns.length} numeric variables are available for statistical profiling.\n\nKey insights:\n${top}`;
  }

  function renderReport() {
    const p = state.profile;
    const insights = getInsightList().map((item) => `- **${item.title}:** ${item.text}`).join('\n');
    const columns = p.schema.map((column) => `- ${column.name}: ${column.type}; missing ${fmt(column.missingPct * 100, 1)}%; unique ${column.unique}`).join('\n');
    const cleaning = state.cleaningHistory.length ? state.cleaningHistory.map((item) => `- ${item}`).join('\n') : '- No cleaning actions applied yet. Recommended first actions: inspect missingness, remove duplicates, and validate outliers.';
    const corr = [...p.correlations].sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr)).slice(0, 5).map((item) => `- ${item.a} ↔ ${item.b}: r = ${fmt(item.corr, 2)}`).join('\n') || '- Not enough numeric columns for correlation analysis.';
    els.reportText.value = `# EDA InsightLab Apex - Statistical Discovery Report

**Product:** EDA InsightLab Apex  
**Dataset:** ${state.datasetName}  
**Generated:** ${new Date().toISOString()}  
**Processing model:** Local-first browser analysis

## 1. Dataset Overview
The dataset contains ${p.rows} rows and ${p.columns} columns. It includes ${p.numericColumns.length} numeric column(s) and ${p.categoricalColumns.length} categorical or identifier column(s). The current rule-based data health score is ${p.quality}/100.

## 2. Schema Summary
${columns}

## 3. Data Quality Findings
- Missing cells: ${p.missingCells} (${fmt(p.missingPct * 100, 1)}%)
- Duplicate rows: ${p.duplicates}
- IQR outlier pressure: ${p.outlierCells} flagged numeric value(s)

## 4. Relationship Findings
${corr}

## 5. Insight Engine Output
${insights}

## 6. Transformation History
${cleaning}

## 7. Recommended Analysis Narrative
1. Define the decision context and data-generating process.
2. Validate schema, measurement units, identifiers, target variables, and leakage risks.
3. Explain data quality before interpreting patterns.
4. Use distributions and relationship views to describe structure and uncertainty.
5. Document preprocessing and feature decisions with rationale.
6. Validate conclusions with domain experts and task-appropriate evaluation.

## 8. Responsible Use and Limitations
- The data health score and feature ranking are transparent educational heuristics, not substitutes for domain review.
- Correlation does not establish causation.
- PCA requires standardized numeric inputs and trades interpretability for compression.
- Final model readiness depends on target definition, leakage review, train-test strategy, and task-specific validation.

## 9. Product Roadmap
- Add validated server-side statistical libraries for larger datasets.
- Add project versioning, schema contracts, automated tests, and audit trails.
- Add collaborative workspaces and governed AI explanations grounded in computed statistics.
- Add model evaluation, experiment tracking, and deployment monitoring.
`;
  }

  const concepts = [
    ['Fundamentals', 'What is EDA?', 'EDA is the first investigation of a dataset to understand structure, quality, distributions, relationships, and anomalies before modeling.', 'Use it before every formal analysis.'],
    ['Fundamentals', 'Variable Types', 'Numeric, categorical, binary, ordinal, identifier, and datetime columns each require different summaries and visualizations.', 'Wrong type inference leads to wrong charts.'],
    ['Quality', 'Missing Values', 'Missingness can be MCAR, MAR, or MNAR. The treatment depends on why values are absent, not only how many are absent.', 'Always inspect patterns before imputing.'],
    ['Quality', 'Duplicates', 'Duplicates can inflate counts and bias summary statistics, especially in transactional and survey data.', 'Use exact and fuzzy duplicate checks.'],
    ['Quality', 'Outliers', 'Outliers may be errors, rare but valid cases, or important signals. IQR and z-score rules are diagnostics, not automatic delete commands.', 'Validate context first.'],
    ['Quality', 'Data Leakage', 'Leakage occurs when information unavailable at prediction time enters the analysis or model.', 'It can make results look falsely excellent.'],
    ['Visuals', 'Histogram', 'A histogram reveals distribution shape, skewness, concentration, and modality for numeric variables.', 'Change bin size to avoid misleading impressions.'],
    ['Visuals', 'Box Plot', 'A box plot summarizes median, IQR, whiskers, and possible outliers compactly.', 'Excellent for comparing spread across groups.'],
    ['Visuals', 'Scatter Plot', 'A scatter plot shows relationship, direction, strength, clusters, and outliers between two numeric variables.', 'Correlation is not causation.'],
    ['Visuals', 'Correlation Heatmap', 'A heatmap shows pairwise linear relationships among numeric variables.', 'Watch out for multicollinearity.'],
    ['Visuals', 'Bar Chart', 'Bar charts compare category counts or aggregates across groups.', 'Sort bars when ranking is important.'],
    ['Visuals', 'Missingness Map', 'A missingness map shows where data is absent by row and column position.', 'Useful for detecting clustered missingness.'],
    ['Statistics', 'Mean vs Median', 'Mean is sensitive to extreme values; median is robust for skewed data.', 'Use both in EDA.'],
    ['Statistics', 'Standard Deviation', 'Standard deviation measures spread around the mean and is most interpretable for roughly symmetric distributions.', 'Pair it with IQR for robustness.'],
    ['Statistics', 'Skewness', 'Adjusted Fisher–Pearson skewness describes asymmetry. Positive skew has a long right tail; negative skew has a long left tail.', 'Estimator choice matters; this release uses the bias-corrected sample definition.'],
    ['Cleaning', 'Imputation', 'Imputation fills missing values using strategies such as median, mode, KNN, or model-based methods.', 'Do not hide meaningful missingness.'],
    ['Cleaning', 'Encoding', 'Encoding converts categorical variables into numeric representations for algorithms.', 'One-hot is safe for nominal variables.'],
    ['Cleaning', 'Scaling', 'Scaling normalizes numeric feature ranges and is essential for distance-based models.', 'Keep original units for human-facing EDA.'],
    ['Cleaning', 'Winsorization', 'Winsorization caps extreme values instead of removing rows.', 'Useful when extremes distort visual scale.'],
    ['Communication', 'Data Storytelling', 'A strong EDA story moves from context to quality to patterns to decisions.', 'Charts need interpretation.'],
    ['Communication', 'Limitations', 'Limitations explain what the analysis cannot prove due to data quality, scope, bias, or assumptions.', 'This improves credibility.'],
    ['Model Prep', 'Feature Engineering', 'Feature engineering creates more useful variables from existing data.', 'EDA reveals candidate features.'],
    ['Model Prep', 'Multicollinearity', 'Highly correlated predictors can destabilize linear models and inflate interpretation problems.', 'Correlation heatmaps help detect it.'],
    ['Ethics', 'Privacy', 'EDA should avoid exposing sensitive or identifiable information unnecessarily.', 'Use aggregation and anonymization.']
  ];

  function renderConceptTabs() {
    const categories = ['All', ...new Set(concepts.map((item) => item[0]))];
    els.conceptTabs.innerHTML = categories.map((category) => `<button type="button" class="${category === state.conceptCategory ? 'active' : ''}" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join('');
  }

  function renderConcepts() {
    renderConceptTabs();
    const q = els.conceptSearch.value.trim().toLowerCase();
    const filtered = concepts.filter(([category, title, body, tip]) => {
      const categoryMatch = state.conceptCategory === 'All' || category === state.conceptCategory;
      const queryMatch = !q || `${category} ${title} ${body} ${tip}`.toLowerCase().includes(q);
      return categoryMatch && queryMatch;
    });
    els.conceptGrid.innerHTML = filtered.map(([category, title, body, tip]) => `
      <article class="concept-card tilt-card">
        <span class="tag">${escapeHTML(category)}</span>
        <h3>${escapeHTML(title)}</h3>
        <p>${escapeHTML(body)}</p>
        <small>${escapeHTML(tip)}</small>
      </article>
    `).join('');
  }

  const quiz = [
    ['Why should EDA be done before modeling?', ['To understand data quality, structure, and assumptions', 'To avoid writing code', 'To guarantee accuracy', 'To remove all categorical columns'], 0, 'EDA reveals quality issues, distributions, relationships, and assumptions before formal modeling.'],
    ['Which statistic is more robust for a right-skewed distribution?', ['Mean', 'Median', 'Maximum', 'Count'], 1, 'The median is less affected by extreme right-tail values.'],
    ['What does a correlation near +1 indicate?', ['Strong positive linear relationship', 'Guaranteed causation', 'No relationship', 'Perfect category balance'], 0, 'Correlation measures linear association, not causation.'],
    ['Which chart is best for seeing numeric distribution shape?', ['Histogram', 'Pie chart', 'Data table', 'Logo'], 0, 'Histograms reveal skewness, modality, and concentration.'],
    ['What is a duplicate row risk?', ['It can inflate aggregates and bias summaries', 'It always improves accuracy', 'It converts numbers to text', 'It creates null values'], 0, 'Repeated records can distort counts, totals, and averages.'],
    ['When should one-hot encoding be used?', ['Nominal categories without order', 'Only numeric columns', 'Only target variables', 'Never'], 0, 'One-hot encoding is appropriate for nominal categories.'],
    ['What does IQR stand for?', ['Interquartile Range', 'Internal Query Result', 'Indexed Quality Rank', 'Input Quantile Ratio'], 0, 'IQR is Q3 minus Q1, the spread of the middle 50%.'],
    ['Why show limitations in an EDA report?', ['To improve credibility and define scope', 'To reduce marks', 'To avoid analysis', 'To hide results'], 0, 'Clear limitations make the analysis more trustworthy.']
  ];

  function renderQuiz() {
    const item = quiz[state.quizIndex % quiz.length];
    els.xpBadge.textContent = `${state.xp} XP`;
    els.quizBox.innerHTML = `
      <div class="quiz-question"><b>Q${(state.quizIndex % quiz.length) + 1}.</b> ${escapeHTML(item[0])}</div>
      <div class="quiz-options">${item[1].map((option, index) => `<button type="button" data-quiz="${index}">${escapeHTML(option)}</button>`).join('')}</div>
      <div class="quiz-feedback" id="quizFeedback">Choose an answer to get instant feedback.</div>
      <button class="secondary-btn compact" id="nextQuiz" type="button">Next question</button>
    `;
  }

  function answerQuiz(index) {
    const item = quiz[state.quizIndex % quiz.length];
    const feedback = $('#quizFeedback');
    if (index === item[2]) {
      state.xp += 20;
      storage.setItem('eda_insightlab_apex_xp', String(state.xp));
      els.xpBadge.textContent = `${state.xp} XP`;
      feedback.textContent = `Correct. ${item[3]}`;
      feedback.style.color = 'var(--green)';
      burstConfetti();
    } else {
      feedback.textContent = `Not quite. ${item[3]}`;
      feedback.style.color = 'var(--amber)';
    }
  }

  function buildRecipe(showToast = true) {
    const selected = $$('.recipe-options input:checked').map((input) => input.value);
    const steps = [];
    if (selected.includes('quality')) steps.push('Audit shape, schema, missing values, duplicate rows, invalid types, and impossible values.');
    if (selected.includes('distribution')) steps.push('Profile numeric distributions with histograms, box plots, mean, median, IQR, skewness, and outlier diagnostics.');
    if (selected.includes('relationship')) steps.push('Study relationships using scatter plots, grouped bar charts, correlation heatmaps, and category comparisons.');
    if (selected.includes('cleaning')) steps.push('Apply cleaning only after rationale: impute missing values, deduplicate rows, validate outliers, encode categories, and scale where needed.');
    if (selected.includes('communication')) steps.push('Convert findings into a story: context, quality, patterns, decisions, limitations, and future scope.');
    els.recipeOutput.innerHTML = steps.map((step) => `<li>${escapeHTML(step)}</li>`).join('');
    if (showToast) toast('EDA workflow recipe generated.');
  }

  const technicalQuestions = [
    ['What is the purpose of EDA?', 'EDA helps understand dataset structure, quality, distributions, relationships, anomalies, and assumptions before formal modeling.'],
    ['Why did you build a website instead of a notebook?', 'A product interface makes the workflow easier to inspect, demonstrate, and reuse than a collection of disconnected notebook cells, while still preserving transparent logic.'],
    ['What makes your project industry-relevant?', 'Organizations need fast data quality checks and explainable insights before analytics decisions. The platform demonstrates a structured version of that workflow.'],
    ['How is the data processed?', 'The site parses CSV files locally in the browser, infers column types, computes summary statistics, identifies missingness and duplicates, renders charts, and generates rule-based insights.'],
    ['Why is missing value treatment not automatic in real projects?', 'Because missingness may carry meaning. The analyst should understand whether missingness is random, systematic, or caused by collection process before choosing imputation or deletion.'],
    ['What is the limitation of correlation?', 'Correlation captures linear association but does not prove causation. It can also miss nonlinear patterns and be influenced by outliers.'],
    ['What future improvements would you add?', 'Validated server-side statistics, project versioning, collaborative workspaces, richer tests, and governed AI explanations with privacy controls.'],
    ['What did you personally learn?', 'The project demonstrates how statistics, visualization, software design, communication, and responsible data handling combine into one practical workflow.']
  ];

  function nextTechnicalQuestion() {
    const item = choice(Math.random, technicalQuestions);
    els.technicalQuestion.textContent = item[0];
    els.technicalAnswer.textContent = item[1];
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  function downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadChart() {
    const svg = $('svg', els.chartCanvas);
    if (!svg) return toast('No chart available to export.');
    downloadFile('eda_insightlab_chart.svg', new XMLSerializer().serializeToString(svg), 'image/svg+xml');
    toast('SVG chart exported.');
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    els.toastRegion.appendChild(node);
    setTimeout(() => {
      node.style.opacity = '0';
      node.style.transform = 'translateY(18px)';
      setTimeout(() => node.remove(), 260);
    }, 1800);
  }

  function burstConfetti() {
    const colors = ['#7c5cff', '#00d5ff', '#39ffb6', '#ff5edb', '#ffd166'];
    for (let i = 0; i < 38; i++) {
      const piece = document.createElement('i');
      piece.style.position = 'fixed';
      piece.style.left = `${50 + (Math.random() - .5) * 18}%`;
      piece.style.top = '52%';
      piece.style.width = `${6 + Math.random() * 7}px`;
      piece.style.height = `${9 + Math.random() * 11}px`;
      piece.style.borderRadius = '2px';
      piece.style.background = choice(Math.random, colors);
      piece.style.pointerEvents = 'none';
      piece.style.zIndex = '200';
      piece.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(piece);
      const dx = (Math.random() - .5) * 520;
      const dy = -160 - Math.random() * 220;
      piece.animate([
        { transform: piece.style.transform, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${720 * Math.random()}deg)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.16,.84,.44,1)' }).onfinish = () => piece.remove();
    }
  }

  const showcaseSlides = [
    { target: '#hero', title: 'Opening', text: 'Start with the problem: analytical discovery is often fragmented across notebooks and ad hoc scripts. This unifies the workflow into an interactive product.' },
    { target: '#studio', title: 'Live Data Upload', text: 'Show the command center. Emphasize that CSV processing happens locally in the browser, which is safe for a demo.' },
    { target: '#studio', title: 'Dataset Health', text: 'Point to rows, columns, missingness, duplicates, outlier pressure, and the quality score.' },
    { target: '#visuals', title: 'Visual Explanation', text: 'Switch to heatmap or scatter. Explain that each chart has an interpretation layer, not just graphics.' },
    { target: '#cleaning', title: 'Cleaning Lab', text: 'Apply imputation or duplicate removal. Explain the rationale and show generated Python code.' },
    { target: '#learn', title: 'Learning Layer', text: 'Show concept atlas and quiz. This demonstrates that the product explains methods and assumptions, not only outputs.' },
    { target: '#report', title: 'Report Forge', text: 'Show the auto-generated storyboard. This connects computation to a reproducible written narrative.' },
    { target: '#warroom', title: 'Closing', text: 'End with the 30-second product pitch and future scope: validated statistics, collaboration, governance, and AI-assisted explanations.' }
  ];

  function startShowcase() {
    document.body.classList.add('showcase-active');
    els.showcasePanel.hidden = false;
    state.showcaseIndex = 0;
    goShowcase(0);
    toast('Guided tour started. Press P to exit.');
  }

  function goShowcase(index) {
    state.showcaseIndex = clamp(index, 0, showcaseSlides.length - 1);
    const slide = showcaseSlides[state.showcaseIndex];
    els.showcaseTitle.textContent = slide.title;
    els.showcaseText.textContent = slide.text;
    els.showcaseProgress.style.width = `${((state.showcaseIndex + 1) / showcaseSlides.length) * 100}%`;
    $(slide.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function exitShowcase() {
    document.body.classList.remove('showcase-active');
    els.showcasePanel.hidden = true;
    toast('Guided tour closed.');
  }

  function runNinetySecondDemo() {
    els.demoDataset.value = 'manufacturing';
    loadBuiltIn('manufacturing');
    state.chartType = 'heatmap';
    els.chartType.value = 'heatmap';
    updateAll(false);
    $('#studio')?.scrollIntoView({ behavior: 'smooth' });
    startShowcase();
  }

  const paletteActions = [
    ['Launch live studio', 'Scroll to profiling cockpit', 'studio upload data', () => $('#studio').scrollIntoView({ behavior: 'smooth' })],
    ['Run guided demo', 'Loads manufacturing data and starts the guided tour', 'demo guided tour present', runNinetySecondDemo],
    ['Load student dataset', 'Curated educational dataset', 'student dataset load', () => { els.demoDataset.value = 'students'; loadBuiltIn('students'); }],
    ['Load startup dataset', 'Business-facing sample data', 'startup dataset load mnc', () => { els.demoDataset.value = 'startups'; loadBuiltIn('startups'); }],
    ['Load retail dataset', 'Retail demand sample data', 'retail dataset load', () => { els.demoDataset.value = 'retail'; loadBuiltIn('retail'); }],
    ['Correlation heatmap', 'Show numeric relationship map', 'chart heatmap correlation', () => { state.chartType = 'heatmap'; els.chartType.value = 'heatmap'; renderChart(); $('#visuals').scrollIntoView({ behavior: 'smooth' }); }],
    ['Missingness map', 'Show completeness pattern', 'chart missing missingness quality', () => { state.chartType = 'missingness'; els.chartType.value = 'missingness'; renderChart(); $('#visuals').scrollIntoView({ behavior: 'smooth' }); }],
    ['Cleaning lab', 'Jump to cleaning decisions', 'clean impute duplicate outlier', () => $('#cleaning').scrollIntoView({ behavior: 'smooth' })],
    ['Methods atlas', 'Jump to methods, pitfalls, and knowledge checks', 'learn quiz concepts', () => $('#learn').scrollIntoView({ behavior: 'smooth' })],
    ['Discovery report', 'Jump to the generated analysis narrative', 'report export markdown', () => $('#report').scrollIntoView({ behavior: 'smooth' })],
    ['Toggle theme', 'Switch light / dark interface', 'theme light dark', () => toggleTheme()],
    ['Copy executive summary', 'Put summary on clipboard', 'copy executive summary', () => copyText(executiveSummary()).then(() => toast('Executive summary copied.'))]
  ];

  function openPalette() {
    els.palette.hidden = false;
    els.paletteSearch.value = '';
    renderPalette();
    setTimeout(() => els.paletteSearch.focus(), 10);
  }

  function closePalette() {
    els.palette.hidden = true;
  }

  function renderPalette() {
    const q = els.paletteSearch.value.trim().toLowerCase();
    const matches = paletteActions.filter(([title, subtitle, keywords]) => !q || `${title} ${subtitle} ${keywords}`.toLowerCase().includes(q)).slice(0, 9);
    els.paletteResults.innerHTML = matches.map(([title, subtitle], index) => `
      <button class="palette-result" type="button" data-palette-index="${paletteActions.indexOf(matches[index])}">
        <b>${escapeHTML(title)}</b><span>${escapeHTML(subtitle)}</span>
      </button>
    `).join('');
  }

  function toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    storage.setItem('eda_insightlab_apex_theme', next);
    toast(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled.`);
  }

  function initAurora() {
    const canvas = $('#auroraCanvas');
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    const particles = Array.from({ length: 70 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - .5) * .00035,
      vy: (Math.random() - .5) * .00035,
      r: 1.5 + Math.random() * 2.8,
      phase: Math.random() * Math.PI * 2,
      hue: i % 3
    }));
    function resize() {
      width = canvas.width = window.innerWidth * devicePixelRatio;
      height = canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }
    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      const grd = ctx.createRadialGradient(width * .5, height * .18, 0, width * .5, height * .18, Math.max(width, height) * .9);
      grd.addColorStop(0, 'rgba(124,92,255,.14)');
      grd.addColorStop(.45, 'rgba(0,213,255,.075)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        const px = p.x * width;
        const py = p.y * height;
        ctx.beginPath();
        const alpha = .35 + .25 * Math.sin(time / 900 + p.phase);
        ctx.fillStyle = p.hue === 0 ? `rgba(124,92,255,${alpha})` : p.hue === 1 ? `rgba(0,213,255,${alpha})` : `rgba(57,255,182,${alpha})`;
        ctx.arc(px, py, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 * devicePixelRatio) {
            ctx.strokeStyle = `rgba(0,213,255,${(1 - dist / (150 * devicePixelRatio)) * .12})`;
            ctx.lineWidth = 1 * devicePixelRatio;
            ctx.beginPath();
            ctx.moveTo(a.x * width, a.y * height);
            ctx.lineTo(b.x * width, b.y * height);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }

  function initTyping() {
    const lines = [
      'Detecting missingness pattern...',
      'Building correlation heatmap...',
      'Flagging outlier pressure...',
      'Generating report storyboard...',
      'Preparing a concise analytical explanation...'
    ];
    let index = 0;
    setInterval(() => {
      if (!els.typedInsight) return;
      els.typedInsight.textContent = lines[index % lines.length];
      index++;
    }, 1800);
  }

  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    $$('.reveal').forEach((node) => observer.observe(node));
  }

  function initTilt() {
    document.addEventListener('pointermove', (event) => {
      if (els.cursorGlow) {
        els.cursorGlow.style.left = `${event.clientX}px`;
        els.cursorGlow.style.top = `${event.clientY}px`;
      }
    });
    $$('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }


  function snapshotPipeline(label) {
    state.pipelineSnapshots.push({ label, data: state.data.map((row) => ({ ...row })), features: [...state.engineeredFeatures], history: [...state.cleaningHistory] });
    if (state.pipelineSnapshots.length > 20) state.pipelineSnapshots.shift();
  }

  function addPipelineStep(title, detail) {
    state.cleaningHistory.push(`${title}: ${detail}`);
  }

  function safeName(name) {
    return String(name).replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 44) || 'feature';
  }

  function numericColumnsNow() { return state.profile?.numericColumns || []; }
  function categoricalColumnsNow() { return state.schema.filter((c) => c.type !== 'numeric' && c.type !== 'identifier').map((c) => c.name); }
  function selectedTarget() { return state.targetColumn || els.targetColumn?.value || ''; }
  function isTargetDerivedColumn(name, target = selectedTarget()) {
    if (!target || !name) return false;
    const safeTarget = safeName(target);
    if (name === target || name.startsWith(`${safeTarget}_`)) return true;
    if (state.data.length >= 3 && state.data.every((row) => {
      const candidate = row[name];
      const targetValue = row[target];
      const candidateMissing = isMissing(candidate);
      const targetMissing = isMissing(targetValue);
      if (candidateMissing || targetMissing) return candidateMissing === targetMissing;
      const candidateNumber = toNumber(candidate);
      const targetNumber = toNumber(targetValue);
      if (candidateNumber !== null && targetNumber !== null) return candidateNumber === targetNumber;
      return String(candidate) === String(targetValue);
    })) return true;
    const feature = state.engineeredFeatures.find((item) => item.name === name);
    if (!feature) return false;
    const source = String(feature.source || '');
    return source === target || source.startsWith(`${target} `) || source.includes(`${target} ==`) || source.includes(`${target} z-score`) || source.includes(`${target}^`);
  }
  function predictorNumericColumns() { return numericColumnsNow().filter((name) => !isTargetDerivedColumn(name)); }
  function predictorCategoricalColumns() { return categoricalColumnsNow().filter((name) => !isTargetDerivedColumn(name)); }

  function preferredTargetColumn(allCols = state.schema.map((c) => c.name)) {
    const datasetDefaults = {
      'Manufacturing Quality Process': 'Yield_pct',
      'DOE Response Surface Experiment': 'Conversion_pct',
      'Student Outcomes Analytics': 'Final_Grade',
      'Startup Growth Intelligence': 'Monthly_Revenue_Lakhs',
      'Retail Demand Pulse': 'Revenue'
    };
    const explicit = datasetDefaults[state.datasetName];
    if (explicit && allCols.includes(explicit)) return explicit;

    const normalized = new Map(allCols.map((name) => [String(name).toLowerCase().replace(/[^a-z0-9]+/g, ''), name]));
    const semanticCandidates = ['target', 'label', 'outcome', 'response', 'score', 'yield', 'conversion', 'revenue', 'grade'];
    for (const candidate of semanticCandidates) {
      if (normalized.has(candidate)) return normalized.get(candidate);
      const fuzzy = allCols.find((name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '').includes(candidate));
      if (fuzzy) return fuzzy;
    }

    const eligible = state.schema.filter((c) => c.type !== 'identifier');
    const numeric = eligible.filter((c) => c.type === 'numeric');
    return numeric.at(-1)?.name || eligible.at(-1)?.name || allCols.at(-1) || allCols[0] || '';
  }

  function renderApexModules(resetSelections = false) {
    if (!els.featureA || !state.profile) return;
    const nums = numericColumnsNow();
    const cats = categoricalColumnsNow();
    const allCols = state.schema.map((c) => c.name);
    const selectedA = resetSelections ? (nums[0] || '') : (els.featureA.value || nums[0] || '');
    const selectedB = resetSelections ? (nums[1] || nums[0] || '') : (els.featureB.value || nums[1] || nums[0] || '');
    const selectedCat = resetSelections ? (cats[0] || '') : (els.featureCat.value || cats[0] || '');
    populateSelect(els.featureA, nums, selectedA);
    populateSelect(els.featureB, nums, selectedB);
    if (nums.length > 1 && els.featureB.value === els.featureA.value) {
      els.featureB.value = nums.find((name) => name !== els.featureA.value) || nums[1];
    }
    populateSelect(els.featureCat, cats, selectedCat);
    const targetDefault = preferredTargetColumn(allCols);
    populateSelect(els.targetColumn, allCols, resetSelections ? targetDefault : (state.targetColumn || targetDefault));
    populateSelect(els.qualityResponse, nums, resetSelections ? (nums.includes(targetDefault) ? targetDefault : (nums.at(-1) || nums[0] || '')) : (els.qualityResponse.value || (nums.includes(targetDefault) ? targetDefault : (nums.at(-1) || nums[0] || ''))));
    state.targetColumn = els.targetColumn.value || state.targetColumn;
    renderPipelineList();
    renderFeatureInventory();
    renderFeatureSelection();
    renderReadiness();
    computeAndRenderPCA(false);
    renderProcessedPreview();
    renderQualityLens(false);
    appendApexReportSections();
    appendApexCodeBlock();
  }

  function renderPipelineList() {
    if (!els.pipelineList) return;
    const items = state.cleaningHistory.length ? state.cleaningHistory : ['Loaded dataset and computed profile.'];
    els.pipelineList.innerHTML = items.map((item, i) => {
      const [title, ...rest] = String(item).split(':');
      return `<div class="pipeline-step"><i>${i + 1}</i><div><b>${escapeHTML(title)}</b><span>${escapeHTML(rest.join(':').trim() || 'Transformation tracked for reproducible analysis.')}</span></div></div>`;
    }).join('');
  }

  function renderFeatureInventory() {
    if (!els.featureInventory) return;
    const features = state.engineeredFeatures.length ? state.engineeredFeatures.slice(-8).reverse() : [{ name: 'No engineered features yet', type: 'Start with ratio, interaction, binning, one-hot, z-scores, or complete preprocessing.', source: 'Feature Factory ready' }];
    els.featureInventoryCount.textContent = `${state.engineeredFeatures.length} engineered`;
    els.featureInventory.innerHTML = features.map((f) => { const name = escapeHTML(f.name).replace(/([_\/.:\-])/g, '$1<wbr>'); const type = escapeHTML(f.type || '').replace(/([_\/.:\-])/g, '$1<wbr>'); const source = escapeHTML(f.source || '').replace(/([_\/.:\-])/g, '$1<wbr>'); return `<article class="feature-card"><b>${name}</b><span>${type}<br><em>${source}</em></span></article>`; }).join('');
  }

  function applyApexAction(action) {
    const a = els.featureA.value;
    const b = els.featureB.value;
    const cat = els.featureCat.value;
    if (!state.data.length) return;
    snapshotPipeline(action);
    if (action === 'ratio' && a && b) {
      const name = `${safeName(a)}_per_${safeName(b)}`;
      state.data.forEach((row) => { const av = toNumber(row[a]); const bv = toNumber(row[b]); row[name] = av !== null && bv ? Number((av / bv).toFixed(5)) : ''; });
      state.engineeredFeatures.push({ name, type: 'Ratio feature', source: `${a} / ${b}` });
      addPipelineStep('Feature engineering', `Created ratio feature ${name}.`);
      toast(`Created ${name}`);
    }
    if (action === 'interaction' && a && b) {
      const name = `${safeName(a)}_x_${safeName(b)}`;
      state.data.forEach((row) => { const av = toNumber(row[a]); const bv = toNumber(row[b]); row[name] = av !== null && bv !== null ? Number((av * bv).toFixed(5)) : ''; });
      state.engineeredFeatures.push({ name, type: 'Interaction feature', source: `${a} multiplied by ${b}` });
      addPipelineStep('Feature engineering', `Created interaction feature ${name}.`);
      toast(`Created ${name}`);
    }
    if (action === 'squared' && a) {
      const name = `${safeName(a)}_squared`;
      state.data.forEach((row) => { const av = toNumber(row[a]); row[name] = av !== null ? Number((av * av).toFixed(5)) : ''; });
      state.engineeredFeatures.push({ name, type: 'Polynomial feature', source: `${a}^2` });
      addPipelineStep('Feature engineering', `Created polynomial feature ${name}.`);
      toast(`Created ${name}`);
    }
    if (action === 'bin' && a) {
      const vals = state.data.map((r) => toNumber(r[a])).filter((v) => v !== null).sort((x, y) => x - y);
      const q1 = quantile(vals, .33), q2 = quantile(vals, .66);
      const name = `${safeName(a)}_bin`;
      state.data.forEach((row) => { const v = toNumber(row[a]); row[name] = v === null ? '' : v <= q1 ? 'Low' : v <= q2 ? 'Medium' : 'High'; });
      state.engineeredFeatures.push({ name, type: 'Quantile-binned feature', source: `${a} split into Low/Medium/High` });
      addPipelineStep('Feature engineering', `Created quantile bin feature ${name}.`);
      toast(`Created ${name}`);
    }
    if (action === 'onehot' && cat) {
      if (isTargetDerivedColumn(cat)) {
        toast('The selected target is protected from predictor encoding. Choose another categorical feature.');
      } else {
        const meta = state.schema.find((column) => column.name === cat);
        const counts = state.profile.categoricalSummaries[cat]?.top || [];
        if (!meta || meta.type === 'identifier' || meta.unique > 12) {
          toast('Choose a low-cardinality categorical feature for one-hot encoding.');
        } else counts.slice(0, 8).forEach(([level]) => {
          const name = `${safeName(cat)}_${safeName(level)}`;
          state.data.forEach((row) => { row[name] = String(row[cat]) === String(level) ? 1 : 0; });
          state.engineeredFeatures.push({ name, type: 'One-hot encoded column', source: `${cat} == ${level}` });
        });
        if (meta && meta.type !== 'identifier' && meta.unique <= 12) {
          addPipelineStep('Encoding', `One-hot encoded ${cat} into ${Math.min(8, counts.length)} dummy columns.`);
          toast(`One-hot encoded ${cat}`);
        }
      }
    }
    if (action === 'zscore') {
      predictorNumericColumns().slice(0, 12).forEach((col) => {
        const s = state.profile.numericSummaries[col];
        const name = `${safeName(col)}_z`;
        state.data.forEach((row) => { const v = toNumber(row[col]); row[name] = v !== null && s.std ? Number(((v - s.mean) / s.std).toFixed(5)) : ''; });
        state.engineeredFeatures.push({ name, type: 'Standardized z-score', source: `${col} centered and scaled` });
      });
      addPipelineStep('Scaling', 'Added z-score scaled versions of numeric predictors.');
      toast('Added standardized numeric features');
    }
    if (action === 'automl') {
      buildCompletePreprocessedDataset();
      toast('Complete preprocessed dataset created');
    }
    updateAll(false);
  }

  function buildCompletePreprocessedDataset() {
    state.schema.forEach((column) => {
      if (column.type === 'numeric') {
        const median = state.profile.numericSummaries[column.name]?.median ?? 0;
        state.data.forEach((row) => { if (isMissing(row[column.name])) row[column.name] = Number(Number(median).toFixed(5)); });
      } else {
        const mode = state.profile.categoricalSummaries[column.name]?.mode ?? 'Unknown';
        state.data.forEach((row) => { if (isMissing(row[column.name])) row[column.name] = mode; });
      }
    });
    const columns = state.schema.map((c) => c.name);
    const seen = new Set();
    state.data = state.data.filter((row) => { const key = JSON.stringify(columns.map((c) => row[c] ?? '')); if (seen.has(key)) return false; seen.add(key); return true; });
    state.profile.numericColumns.forEach((column) => {
      const s = state.profile.numericSummaries[column];
      state.data.forEach((row) => { const n = toNumber(row[column]); if (n === null) return; if (n < s.lowFence) row[column] = Number(s.lowFence.toFixed(5)); if (n > s.highFence) row[column] = Number(s.highFence.toFixed(5)); });
    });
    predictorCategoricalColumns().slice(0, 8).forEach((cat) => {
      const top = state.profile.categoricalSummaries[cat]?.top || [];
      const meta = state.schema.find((column) => column.name === cat);
      if (!meta || meta.unique > 12 || meta.unique < 2) return;
      top.forEach(([level]) => {
        const name = `${safeName(cat)}_${safeName(level)}`;
        if (columnsOf(state.data).includes(name)) return;
        state.data.forEach((row) => { row[name] = String(row[cat]) === String(level) ? 1 : 0; });
        state.engineeredFeatures.push({ name, type: 'Auto one-hot encoded', source: `${cat} == ${level}` });
      });
    });
    predictorNumericColumns().slice(0, 12).forEach((col) => {
      const s = state.profile.numericSummaries[col];
      const name = `${safeName(col)}_z`;
      if (columnsOf(state.data).includes(name)) return;
      state.data.forEach((row) => { const v = toNumber(row[col]); row[name] = v !== null && s.std ? Number(((v - s.mean) / s.std).toFixed(5)) : 0; });
      state.engineeredFeatures.push({ name, type: 'Auto standardized feature', source: `${col} z-score` });
    });
    addPipelineStep('Complete preprocessing', 'Imputed missing values, removed duplicates, capped IQR outliers, encoded low-cardinality predictors, and standardized numeric predictors while protecting the selected target.');
  }

  function undoLastPipelineStep() {
    const snap = state.pipelineSnapshots.pop();
    if (!snap) return toast('No pipeline step to undo.');
    state.data = snap.data.map((row) => ({ ...row }));
    state.engineeredFeatures = [...snap.features];
    state.cleaningHistory = [...snap.history];
    updateAll(false);
    toast(`Undid ${snap.label}`);
  }

  function featureSelectionRows() {
    const target = state.targetColumn || els.targetColumn?.value;
    if (!target) return [];
    const p = state.profile;
    const targetMeta = state.schema.find((c) => c.name === target);
    const targetVals = state.data.map((r) => r[target]);
    return state.schema.filter((c) => c.type !== 'identifier' && !isTargetDerivedColumn(c.name, target)).map((col) => {
      let relevance = 0;
      let reason = 'quality/redundancy score';
      if (col.type === 'numeric' && targetMeta?.type === 'numeric') {
        const corr = pearson(state.data.map((r) => r[col.name]), targetVals);
        relevance = corr === null ? 0 : Math.abs(corr);
        reason = `|r with target| = ${fmt(relevance, 2)}`;
      } else if (col.type === 'numeric' && targetMeta?.type !== 'numeric') {
        relevance = etaSquaredNumericByCategory(col.name, target);
        reason = `group separation = ${fmt(relevance, 2)}`;
      } else if (col.type !== 'numeric' && targetMeta?.type !== 'numeric') {
        relevance = cramersV(col.name, target);
        reason = `categorical association = ${fmt(relevance, 2)}`;
      } else if (col.type !== 'numeric' && targetMeta?.type === 'numeric') {
        relevance = etaSquaredNumericByCategory(target, col.name);
        reason = `target group separation = ${fmt(relevance, 2)}`;
      } else {
        relevance = 0;
        reason = 'unsupported relevance pairing';
      }
      const missingPenalty = col.missingPct * .5;
      const lowVariancePenalty = col.unique <= 1 ? .7 : 0;
      const redundancy = maxRedundancy(col.name, target) * .2;
      const score = clamp(Math.round((relevance * 100) - missingPenalty * 100 - lowVariancePenalty * 100 - redundancy * 100 + 18), 0, 100);
      return { name: col.name, type: col.type, score, reason, status: score >= 55 ? 'Keep' : score >= 35 ? 'Review' : 'Drop' };
    }).sort((a, b) => b.score - a.score);
  }

  function etaSquaredNumericByCategory(numericCol, categoryCol) {
    const pairs = state.data.map((r) => [toNumber(r[numericCol]), r[categoryCol]]).filter(([v, g]) => v !== null && !isMissing(g));
    if (pairs.length < 3) return 0;
    const values = pairs.map(([v]) => v);
    const overall = mean(values);
    const groups = new Map();
    pairs.forEach(([v, g]) => { const k = String(g); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(v); });
    const between = [...groups.values()].reduce((sum, arr) => sum + arr.length * (mean(arr) - overall) ** 2, 0);
    const total = values.reduce((sum, v) => sum + (v - overall) ** 2, 0) || 1;
    return clamp(between / total, 0, 1);
  }

  function cramersV(a, b) {
    const rows = state.data.filter((r) => !isMissing(r[a]) && !isMissing(r[b]));
    if (rows.length < 3) return 0;
    const rowCounts = new Map();
    const columnCounts = new Map();
    const jointCounts = new Map();
    rows.forEach((row) => {
      const left = String(row[a]);
      const right = String(row[b]);
      rowCounts.set(left, (rowCounts.get(left) || 0) + 1);
      columnCounts.set(right, (columnCounts.get(right) || 0) + 1);
      if (!jointCounts.has(left)) jointCounts.set(left, new Map());
      const nested = jointCounts.get(left);
      nested.set(right, (nested.get(right) || 0) + 1);
    });
    const total = rows.length;
    let observedSquaredOverExpected = 0;
    jointCounts.forEach((nested, left) => nested.forEach((observed, right) => {
      const expected = rowCounts.get(left) * columnCounts.get(right) / total;
      if (expected) observedSquaredOverExpected += (observed ** 2) / expected;
    }));
    const chi = Math.max(0, observedSquaredOverExpected - total);
    const k = Math.min(rowCounts.size - 1, columnCounts.size - 1);
    return k > 0 ? clamp(Math.sqrt(chi / (total * k)), 0, 1) : 0;
  }

  function maxRedundancy(col, target) {
    if (!state.profile.numericColumns.includes(col)) return 0;
    return Math.max(0, ...state.profile.correlations.filter((c) => (c.a === col || c.b === col) && c.a !== target && c.b !== target).map((c) => Math.abs(c.corr)));
  }

  function renderFeatureSelection() {
    if (!els.selectionTable || !state.profile) return;
    const rows = featureSelectionRows();
    els.selectionTable.innerHTML = rows.slice(0, 10).map((row) => `
      <div class="feature-row">
        <b title="${escapeHTML(row.name)}">${escapeHTML(row.name)}</b>
        <div><div class="score-track"><div class="score-fill" style="width:${row.score}%"></div></div><small>${escapeHTML(row.reason)} · ${escapeHTML(row.type)}</small></div>
        <span class="${row.status === 'Drop' ? 'drop-chip' : 'keep-chip'}">${row.status} · ${row.score}</span>
      </div>
    `).join('') || '<p class="chart-caption">Choose a target variable to rank features.</p>';
    if (els.selectionDiagnostics) {
      const keep = rows.filter((r) => r.status === 'Keep').length;
      const review = rows.filter((r) => r.status === 'Review').length;
      const drop = rows.filter((r) => r.status === 'Drop').length;
      els.selectionDiagnostics.innerHTML = `<article><b>${keep} keep</b><span>Strong candidates for task-aware validation.</span></article><article><b>${review} review</b><span>Requires domain review, transformation, or cross-validation.</span></article><article><b>${drop} drop</b><span>Weak, redundant, target-derived, or quality-risk candidates.</span></article>`;
    }
  }

  function renderReadiness() {
    if (!els.readinessScore) return;
    const p = state.profile;
    const hasTarget = Boolean(selectedTarget());
    const predictorCount = state.schema.filter((column) => column.type !== 'identifier' && !isTargetDerivedColumn(column.name)).length;
    const hasPipeline = state.cleaningHistory.length > 0;
    const score = clamp(Math.round(
      p.quality * .45 +
      Math.min(20, predictorCount * 1.6) +
      (state.engineeredFeatures.length ? 9 : 0) +
      (hasTarget ? 8 : 0) +
      (hasPipeline ? 8 : 0)
    ), 0, 92);
    els.readinessRing.style.setProperty('--score', score);
    els.readinessScore.textContent = score;
    els.readinessText.innerHTML = `Preprocessing readiness is <strong>${score}/100</strong>. This reflects data quality, predictor availability, target definition, and pipeline completeness - <strong>not expected model accuracy</strong>. Target-derived columns are excluded from feature ranking and PCA to reduce leakage risk. Final modeling still requires a leakage-safe split, train-only fitting, domain validation, and task-appropriate metrics.`;
  }

  function standardizedMatrix(cols) {
    const columnStats = cols.map((col) => {
      const observed = state.data.map((row) => toNumber(row[col])).filter((value) => value !== null);
      const avg = mean(observed) ?? 0;
      const filled = state.data.map((row) => toNumber(row[col]) ?? avg);
      return { mean: avg, std: std(filled, avg), filled };
    });
    return state.data.map((_, rowIndex) => cols.map((__, columnIndex) => {
      const stats = columnStats[columnIndex];
      return stats.std ? (stats.filled[rowIndex] - stats.mean) / stats.std : 0;
    }));
  }

  function covarianceMatrix(matrix) {
    const n = matrix.length, m = matrix[0]?.length || 0;
    const cov = Array.from({ length: m }, () => Array(m).fill(0));
    if (n < 2) return cov;
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) cov[i][j] = matrix.reduce((sum, row) => sum + row[i] * row[j], 0) / (n - 1);
    return cov;
  }

  function matVec(A, v) { return A.map((row) => row.reduce((sum, x, i) => sum + x * v[i], 0)); }
  function dot(a, b) { return a.reduce((sum, x, i) => sum + x * b[i], 0); }
  function norm(v) { return Math.sqrt(dot(v, v)) || 1; }
  function powerIter(A) {
    let v = Array(A.length).fill(0).map((_, i) => i === 0 ? 1 : .5 / (i + 1));
    for (let k = 0; k < 80; k++) { const Av = matVec(A, v); const n = norm(Av); v = Av.map((x) => x / n); }
    const lambda = dot(v, matVec(A, v));
    return { vector: v, value: Math.max(0, lambda) };
  }

  function computePCA() {
    const cols = predictorNumericColumns();
    if (cols.length < 2 || state.data.length < 3) return null;
    const X = standardizedMatrix(cols);
    const A = covarianceMatrix(X);
    const pc1 = powerIter(A);
    const A2 = A.map((row, i) => row.map((val, j) => val - pc1.value * pc1.vector[i] * pc1.vector[j]));
    const pc2 = powerIter(A2);
    const scores = X.map((row, i) => ({ i, pc1: dot(row, pc1.vector), pc2: dot(row, pc2.vector) }));
    const total = A.reduce((sum, row, i) => sum + row[i], 0) || 1;
    return { cols, pc1, pc2, scores, exp1: pc1.value / total, exp2: pc2.value / total };
  }

  function computeAndRenderPCA(showToast = false) {
    if (!els.pcaCanvas) return;
    const result = computePCA();
    if (!result) { els.pcaCanvas.innerHTML = '<div class="chart-caption" style="padding:2rem">Need at least two numeric columns for PCA.</div>'; return; }
    state.lastPCA = result;
    const width = 900, height = 480;
    const margin = { top: 50, right: 40, bottom: 70, left: 70 };
    const xs = result.scores.map((s) => s.pc1), ys = result.scores.map((s) => s.pc2);
    const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const sx = (x) => margin.left + (x - xmin) / ((xmax - xmin) || 1) * (width - margin.left - margin.right);
    const sy = (y) => height - margin.bottom - (y - ymin) / ((ymax - ymin) || 1) * (height - margin.top - margin.bottom);
    const points = result.scores.slice(0, 600).map((s, i) => `<circle cx="${sx(s.pc1)}" cy="${sy(s.pc2)}" r="5" fill="${i % 3 === 0 ? '#00d5ff' : i % 3 === 1 ? '#39ffb6' : '#7c5cff'}" opacity=".78" data-tip="row ${s.i + 1}: PC1 ${fmt(s.pc1, 2)}, PC2 ${fmt(s.pc2, 2)}" />`).join('');
    const screeW = 160, screeX = width - 220;
    const bar1 = clamp(result.exp1 * 220, 8, 180), bar2 = clamp(result.exp2 * 220, 8, 180);
    els.pcaCanvas.innerHTML = svgWrap(width, height, `
      <text class="chart-title-svg" x="${margin.left}" y="32">PCA projection of standardized predictor features</text>
      <path d="M${margin.left} ${height - margin.bottom}H${width - margin.right}M${margin.left} ${margin.top}V${height - margin.bottom}" stroke="rgba(255,255,255,.25)" />
      ${points}
      <text class="chart-label" x="${width/2}" y="${height-22}" text-anchor="middle">PC1 (${fmt(result.exp1*100,1)}% variance explained)</text>
      <text class="chart-label" x="22" y="${height/2}" text-anchor="middle" transform="rotate(-90 22 ${height/2})">PC2 (${fmt(result.exp2*100,1)}%)</text>
      <text class="chart-label" x="${screeX}" y="72">Scree mini view</text>
      <rect x="${screeX}" y="95" width="${bar1}" height="28" rx="8" fill="#00d5ff"/><text class="chart-label" x="${screeX+bar1+8}" y="114">PC1 ${fmt(result.exp1*100,1)}%</text>
      <rect x="${screeX}" y="135" width="${bar2}" height="28" rx="8" fill="#39ffb6"/><text class="chart-label" x="${screeX+bar2+8}" y="154">PC2 ${fmt(result.exp2*100,1)}%</text>
    `);
    els.pcaStats.textContent = `PCA used ${result.cols.length} numeric predictor features after excluding the selected target and target-derived columns. PC1 explains ${fmt(result.exp1*100,1)}% and PC2 explains ${fmt(result.exp2*100,1)}%, giving a compact multivariate map for clusters, leverage points, and dimension reduction.`;
    attachSvgTooltips();
    if (showToast) toast('PCA map generated.');
  }

  function addPCAColumns() {
    const res = state.lastPCA || computePCA();
    if (!res) return toast('PCA needs at least two numeric columns.');
    snapshotPipeline('add PCA columns');
    state.data.forEach((row, i) => { row.PC1 = Number(res.scores[i].pc1.toFixed(5)); row.PC2 = Number(res.scores[i].pc2.toFixed(5)); });
    state.engineeredFeatures.push({ name: 'PC1', type: 'Principal component', source: `${fmt(res.exp1*100,1)}% variance explained` });
    state.engineeredFeatures.push({ name: 'PC2', type: 'Principal component', source: `${fmt(res.exp2*100,1)}% variance explained` });
    addPipelineStep('Dimension reduction', 'Added PC1 and PC2 scores to the final dataset.');
    updateAll(false);
    toast('PC1 and PC2 added to dataset.');
  }

  function renderQualityLens(update = true) {
    if (!els.qualityOutput || !state.profile) return;
    const col = els.qualityResponse?.value || state.profile.numericColumns[0];
    const s = state.profile.numericSummaries[col];
    if (!col || !s) { els.qualityOutput.textContent = 'Choose a numeric response column.'; return; }
    const lsl = Number(els.lslInput?.value || s.mean - 2 * s.std);
    const usl = Number(els.uslInput?.value || s.mean + 2 * s.std);
    const cp = s.std ? (usl - lsl) / (6 * s.std) : 0;
    const cpk = s.std ? Math.min((usl - s.mean) / (3 * s.std), (s.mean - lsl) / (3 * s.std)) : 0;
    const target = state.targetColumn || els.targetColumn?.value || col;
    const strongest = [...state.profile.correlations].filter((c) => c.a === col || c.b === col).sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))[0];
    els.qualityOutput.innerHTML = `<strong>Capability for ${escapeHTML(col)}</strong><br>Mean = ${fmt(s.mean,2)}, Std = ${fmt(s.std,2)}, Cp = ${fmt(cp,2)}, Cpk = ${fmt(cpk,2)}.<br><br><strong>DOE-style response thinking:</strong> ${strongest ? `${escapeHTML(strongest.a)} and ${escapeHTML(strongest.b)} show r=${fmt(strongest.corr,2)}. In a design-of-experiments discussion, these can be treated as candidate factors to investigate response movement, not proof of causality.` : 'Need more numeric factors for response-surface discussion.'}<br><br><strong>Interpretation:</strong> This module links EDA to quality engineering by moving from distribution to specification limits, process capability, and factor-response reasoning.`;
    if (update) toast('Quality and DOE lens updated.');
  }

  function renderProcessedPreview() {
    if (!els.processedPreview) return;
    const rows = state.data.slice(0, 8);
    const cols = columnsOf(state.data).slice(0, 12);
    els.processedMeta.textContent = `${state.data.length} rows · ${columnsOf(state.data).length} columns`;
    els.processedPreview.innerHTML = `<table><thead><tr>${cols.map((c) => `<th>${escapeHTML(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${escapeHTML(truncate(r[c], 18))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function toCSV(rows) {
    if (!rows.length) return '';
    const cols = columnsOf(rows);
    const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s; };
    return [cols.map(esc).join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  }

  function pythonPipelineCode() {
    const target = state.targetColumn || 'target_column';
    return `# EDA InsightLab Apex - Leakage-aware preprocessing template
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

TARGET = '${target}'
df = pd.read_csv('raw_dataset.csv').drop_duplicates()

# Keep the target separate so transformations cannot leak target information.
X = df.drop(columns=[TARGET])
y = df[TARGET]
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y if y.nunique() < 20 else None,
)

numeric_features = X_train.select_dtypes(include='number').columns.tolist()
categorical_features = X_train.select_dtypes(exclude='number').columns.tolist()

numeric_pipeline = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
])

categorical_pipeline = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='most_frequent')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
])

preprocessor = ColumnTransformer(
    transformers=[
        ('numeric', numeric_pipeline, numeric_features),
        ('categorical', categorical_pipeline, categorical_features),
    ],
    remainder='drop',
    sparse_threshold=0,
)

# Fit on training data only; transform held-out data with learned parameters.
X_train_ready = preprocessor.fit_transform(X_train)
X_test_ready = preprocessor.transform(X_test)
feature_names = preprocessor.get_feature_names_out()

train_ready = pd.DataFrame(X_train_ready, columns=feature_names, index=X_train.index)
test_ready = pd.DataFrame(X_test_ready, columns=feature_names, index=X_test.index)
train_ready[TARGET] = y_train
test_ready[TARGET] = y_test

train_ready.to_csv('train_preprocessed.csv', index=False)
test_ready.to_csv('test_preprocessed.csv', index=False)
print('Train shape:', train_ready.shape)
print('Test shape:', test_ready.shape)
`;
  }

  function appendApexCodeBlock() {
    if (!els.codeBlock || els.codeBlock.dataset.apexAppended === String(state.data.length) + ':' + columnsOf(state.data).length) return;
    els.codeBlock.textContent += `

# 10. Target-aware model preparation
TARGET = '${state.targetColumn || 'target_column'}'
X = df.drop(columns=[TARGET])
y = df[TARGET]

# Split before fitting imputers, encoders, scalers, selectors, or PCA.
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42,
    stratify=y if y.nunique() < 20 else None
)

# Fit preprocessing on X_train only, then transform X_test.
# Exclude TARGET and any target-derived columns from feature selection and PCA.
`;
    els.codeBlock.dataset.apexAppended = String(state.data.length) + ':' + columnsOf(state.data).length;
  }

  function appendApexReportSections() {
    if (!els.reportText || els.reportText.value.includes('## 9. Apex Statistical Discovery Additions')) return;
    const rows = featureSelectionRows().slice(0, 5).map((r) => `- ${r.name}: ${r.status}, score ${r.score}/100 (${r.reason})`).join('\n') || '- Feature selection not run yet.';
    const pca = state.lastPCA ? `PC1 explains ${fmt(state.lastPCA.exp1*100,1)}% and PC2 explains ${fmt(state.lastPCA.exp2*100,1)}% of standardized numeric variance.` : 'PCA is available for numeric datasets and can add PC1/PC2 to the final preprocessed table.';
    els.reportText.value += `\n## 9. Apex Statistical Discovery Additions\n- Feature engineering module: ratio, interaction, polynomial, binning, one-hot encoding, and z-score features.\n- Feature selection module: target-aware ranking with quality, redundancy, and target-leakage guards.\n- Dimension reduction module: PCA projection and optional PC1/PC2 export.\n- Final data vault: downloadable final preprocessed CSV, pipeline JSON, and Python preprocessing script.\n\n## 10. Feature Selection Summary\n${rows}\n\n## 11. Dimension Reduction Summary\n${pca}\n\n## 12. Final Preprocessed Dataset\nThe final dataset currently contains ${state.data.length} rows and ${columnsOf(state.data).length} columns. It can be exported as CSV for use in Python, R, Excel, or BI tools. Downstream modeling still requires a leakage-safe split and train-only fitting.\n`;
  }

  function answerAssistant() {
    const q = (els.assistantQuestion.value || '').toLowerCase();
    const p = state.profile;
    const rows = featureSelectionRows().slice(0, 4);
    let answer = '';
    if (q.includes('visitor') || q.includes('show') || q.includes('present') || q.includes('expert')) {
      answer = `Present the product as a statistical discovery bridge: raw CSV to profile, visual EDA, data cleaning, feature engineering, feature selection, PCA, quality/DOE reasoning, and final preprocessed data export. Emphasize reproducibility: every transformation is logged and exportable.`;
    } else if (q.includes('feature') || q.includes('select') || q.includes('keep')) {
      answer = `The strongest features right now are: ${rows.map((r) => `${r.name} (${r.score}/100)`).join(', ') || 'run feature selection first'}. Explain that selection combines target relevance with missingness and redundancy risk.`;
    } else if (q.includes('preprocess') || q.includes('changed') || q.includes('final')) {
      answer = `The final dataset has ${p.rows} rows, ${p.columns} columns, ${fmt(p.missingPct*100,1)}% missing cells, ${p.duplicates} duplicates, and ${state.engineeredFeatures.length} engineered features. Use Build Complete Preprocessed Dataset, then Download final CSV.`;
    } else if (q.includes('pca') || q.includes('dimension')) {
      answer = state.lastPCA ? `PCA reduced ${state.lastPCA.cols.length} standardized numeric variables into PC1 and PC2. PC1 explains ${fmt(state.lastPCA.exp1*100,1)}% and PC2 explains ${fmt(state.lastPCA.exp2*100,1)}% of variance.` : 'Run PCA to generate PC1/PC2, then add them to the final dataset for dimension-reduced export.';
    } else {
      answer = `Dataset health is ${p.quality}/100. Recommended demo: load dataset, show health score, run complete preprocessing, create engineered features, run feature selection, run PCA, show quality lens, then download the final preprocessed CSV.`;
    }
    els.assistantAnswer.innerHTML = `<strong>Assistant answer:</strong><br>${escapeHTML(answer)}`;
  }

  function initEvents() {
    els.themeToggle.addEventListener('click', toggleTheme);
    els.loadDataset.addEventListener('click', () => loadBuiltIn(els.demoDataset.value));
    els.randomizeDataset.addEventListener('click', () => { state.seedShift += 1000; loadBuiltIn(els.demoDataset.value); });
    els.demoDataset.addEventListener('change', () => loadBuiltIn(els.demoDataset.value));
    els.searchBox.addEventListener('input', renderTable);
    els.focusColumn.addEventListener('change', () => { state.selectedFocus = els.focusColumn.value; renderChart(); renderCode(); renderReport(); });
    els.xColumn.addEventListener('change', () => { state.selectedX = els.xColumn.value; renderChart(); renderCode(); renderReport(); });
    els.yColumn.addEventListener('change', () => { state.selectedY = els.yColumn.value; renderChart(); renderCode(); renderReport(); });
    els.chartType.addEventListener('change', () => { state.chartType = els.chartType.value; renderChart(); });
    els.csvUpload.addEventListener('change', (event) => handleFile(event.target.files?.[0]));
    ['dragenter', 'dragover'].forEach((name) => els.dropzone.addEventListener(name, (event) => { event.preventDefault(); els.dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((name) => els.dropzone.addEventListener(name, (event) => { event.preventDefault(); els.dropzone.classList.remove('dragover'); }));
    els.dropzone.addEventListener('drop', (event) => handleFile(event.dataTransfer.files?.[0]));

    $$('.clean-action').forEach((button) => button.addEventListener('click', () => applyCleaning(button.dataset.action)));
    els.resetCleaning.addEventListener('click', () => { state.data = state.originalData.map((row) => ({ ...row })); state.cleaningHistory = []; state.pipelineSnapshots = []; state.engineeredFeatures = []; state.lastPCA = null; updateAll(false); toast('Dataset restored to original loaded state.'); });
    els.copyCode.addEventListener('click', () => copyText(els.codeBlock.textContent).then(() => toast('Python snippet copied.')));

    if (els.featureA) {
      $$('.apex-action').forEach((button) => button.addEventListener('click', () => applyApexAction(button.dataset.apex)));
      els.undoLastStep.addEventListener('click', undoLastPipelineStep);
      els.downloadProcessedCSV.addEventListener('click', () => downloadFile('eda-insightlab-apex-preprocessed-data.csv', toCSV(state.data), 'text/csv'));
      els.downloadPipelineJSON.addEventListener('click', () => downloadFile('eda-insightlab-apex-pipeline.json', JSON.stringify({ dataset: state.datasetName, steps: state.cleaningHistory, engineeredFeatures: state.engineeredFeatures }, null, 2), 'application/json'));
      els.downloadPipelinePython.addEventListener('click', () => downloadFile('eda-insightlab-apex-pipeline.py', pythonPipelineCode(), 'text/x-python'));
      els.runFeatureSelection.addEventListener('click', renderFeatureSelection);
      els.targetColumn.addEventListener('change', () => { state.targetColumn = els.targetColumn.value; renderFeatureSelection(); renderReport(); });
      els.selectionLens.addEventListener('change', renderFeatureSelection);
      els.runPCA.addEventListener('click', () => { computeAndRenderPCA(true); });
      els.addPCAColumns.addEventListener('click', addPCAColumns);
      els.runQualityLens.addEventListener('click', renderQualityLens);
      els.vaultDownloadCSV.addEventListener('click', () => downloadFile('eda-insightlab-apex-final-data.csv', toCSV(state.data), 'text/csv'));
      els.vaultDownloadReport.addEventListener('click', () => downloadFile('eda-insightlab-apex-discovery-report.md', els.reportText.value, 'text/markdown'));
      els.askAssistant.addEventListener('click', answerAssistant);
    }

    els.copyExecutiveSummary.addEventListener('click', () => copyText(executiveSummary()).then(() => toast('Executive summary copied.')));
    els.downloadChart.addEventListener('click', downloadChart);
    els.explainChart.addEventListener('click', () => toast(els.chartCaption.textContent));

    els.conceptSearch.addEventListener('input', renderConcepts);
    els.conceptTabs.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      state.conceptCategory = button.dataset.category;
      renderConcepts();
    });
    els.quizBox.addEventListener('click', (event) => {
      const answer = event.target.closest('[data-quiz]');
      if (answer) answerQuiz(Number(answer.dataset.quiz));
      if (event.target.closest('#nextQuiz')) { state.quizIndex++; renderQuiz(); }
    });
    els.buildRecipe.addEventListener('click', buildRecipe);

    els.copyReport.addEventListener('click', () => copyText(els.reportText.value).then(() => toast('Report storyboard copied.')));
    els.downloadReport.addEventListener('click', () => downloadFile('eda-insightlab-apex-analysis-report.md', els.reportText.value, 'text/markdown'));
    els.nextTechnicalQuestion.addEventListener('click', nextTechnicalQuestion);

    els.startShowcase.addEventListener('click', startShowcase);
    els.floatingDemo.addEventListener('click', startShowcase);
    els.loadDemoAndJump.addEventListener('click', runNinetySecondDemo);
    els.nextShowcase.addEventListener('click', () => goShowcase(state.showcaseIndex + 1));
    els.prevShowcase.addEventListener('click', () => goShowcase(state.showcaseIndex - 1));
    els.exitShowcase.addEventListener('click', exitShowcase);

    els.openPalette.addEventListener('click', openPalette);
    els.closePalette.addEventListener('click', closePalette);
    els.palette.addEventListener('click', (event) => { if (event.target === els.palette) closePalette(); });
    els.paletteSearch.addEventListener('input', renderPalette);
    els.paletteResults.addEventListener('click', (event) => {
      const button = event.target.closest('[data-palette-index]');
      if (!button) return;
      const action = paletteActions[Number(button.dataset.paletteIndex)];
      closePalette();
      action?.[3]?.();
    });

    document.addEventListener('keydown', (event) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const typing = ['input', 'textarea', 'select'].includes(tag);
      if ((event.key === '/' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) && !typing) {
        event.preventDefault(); openPalette();
      }
      if (event.key === 'Escape') { closePalette(); if (!els.showcasePanel.hidden) exitShowcase(); }
      if (!typing && event.key.toLowerCase() === 't') toggleTheme();
      if (!typing && event.key.toLowerCase() === 'd') runNinetySecondDemo();
      if (!typing && event.key.toLowerCase() === 'p') {
        if (els.showcasePanel.hidden) startShowcase(); else exitShowcase();
      }
      if (!els.showcasePanel.hidden && event.key === 'ArrowRight') goShowcase(state.showcaseIndex + 1);
      if (!els.showcasePanel.hidden && event.key === 'ArrowLeft') goShowcase(state.showcaseIndex - 1);
    });
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result));
        setData(rows, file.name.replace(/\.csv$/i, ''));
        els.datasetBadge.textContent = 'Uploaded CSV';
      } catch (error) {
        toast(error.message || 'Could not parse CSV file.');
      }
    };
    reader.onerror = () => toast('Could not read file.');
    reader.readAsText(file);
  }

  function initTheme() {
    const stored = storage.getItem('eda_insightlab_apex_theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
  }

  function init() {
    initTheme();
    initEvents();
    initAurora();
    initTyping();
    initReveal();
    renderConcepts();
    renderQuiz();
    buildRecipe(false);
    nextTechnicalQuestion();
    loadBuiltIn('manufacturing', true);
  }

  init();
})();

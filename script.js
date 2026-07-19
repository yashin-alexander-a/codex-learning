const form = document.querySelector('#calculator-form');
const message = document.querySelector('#message');

const fields = {
  adSpend: document.querySelector('#ad-spend'),
  revenue: document.querySelector('#revenue'),
  otherCosts: document.querySelector('#other-costs'),
  impressions: document.querySelector('#impressions'),
  clicks: document.querySelector('#clicks'),
  leads: document.querySelector('#leads'),
};

const outputs = {
  ctr: document.querySelector('#ctr'),
  cpc: document.querySelector('#cpc'),
  conversion: document.querySelector('#conversion'),
  cpl: document.querySelector('#cpl'),
  romi: document.querySelector('#romi'),
  roi: document.querySelector('#roi'),
};

function parseField(input, label) {
  const rawValue = input.value.trim();

  if (rawValue === '') {
    return { error: `Заполните поле «${label}».` };
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value)) {
    return { error: `Поле «${label}» должно быть числом.` };
  }

  if (value < 0) {
    return { error: `Поле «${label}» не может быть отрицательным.` };
  }

  return { value };
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat('ru-RU', options).format(value).replace(/\s/g, ' ');
}

function formatPercent(value) {
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatMoney(value) {
  return `${formatNumber(value, { maximumFractionDigits: 2 })} ₽`;
}

function safeDivide(numerator, denominator) {
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function showEmptyResult() {
  Object.values(outputs).forEach((output) => {
    output.textContent = '—';
  });
}

function clearMessage() {
  message.textContent = '';
  message.className = 'message';
}

function validateMetrics({ impressions, clicks, leads }) {
  if (clicks > impressions) {
    return 'Количество кликов не может быть больше количества показов';
  }

  if (leads > clicks) {
    return 'Количество заявок не может быть больше количества кликов';
  }

  return null;
}

function calculateMetrics({ adSpend, revenue, otherCosts, impressions, clicks, leads }) {
  const ctr = safeDivide(clicks, impressions);
  const cpc = safeDivide(adSpend, clicks);
  const conversion = safeDivide(leads, clicks);
  const cpl = safeDivide(adSpend, leads);
  const romi = safeDivide(revenue - adSpend, adSpend);
  const roi = safeDivide(revenue - adSpend - otherCosts, adSpend + otherCosts);

  return {
    ctr: ctr === null ? 'Нельзя рассчитать' : formatPercent(ctr * 100),
    cpc: cpc === null ? 'Нельзя рассчитать' : formatMoney(cpc),
    conversion: conversion === null ? 'Нельзя рассчитать' : formatPercent(conversion * 100),
    cpl: cpl === null ? 'Нельзя рассчитать' : formatMoney(cpl),
    romi: romi === null ? 'Нельзя рассчитать' : formatPercent(romi * 100),
    roi: roi === null ? 'Нельзя рассчитать' : formatPercent(roi * 100),
  };
}

function showMessage(text, type = 'error') {
  message.textContent = text;
  message.className = `message ${type}`;
}

function showResults(results) {
  Object.entries(results).forEach(([metric, value]) => {
    outputs[metric].textContent = value;
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const adSpend = parseField(fields.adSpend, 'Рекламный расход');
  const revenue = parseField(fields.revenue, 'Выручка от рекламы');
  const otherCosts = parseField(fields.otherCosts, 'Прочие затраты');
  const impressions = parseField(fields.impressions, 'Количество показов');
  const clicks = parseField(fields.clicks, 'Количество кликов');
  const leads = parseField(fields.leads, 'Количество заявок');
  const parsedFields = [adSpend, revenue, otherCosts, impressions, clicks, leads];
  const invalidField = parsedFields.find((field) => field.error);

  if (invalidField) {
    showEmptyResult();
    showMessage(invalidField.error);
    return;
  }

  const values = {
    adSpend: adSpend.value,
    revenue: revenue.value,
    otherCosts: otherCosts.value,
    impressions: impressions.value,
    clicks: clicks.value,
    leads: leads.value,
  };
  const validationError = validateMetrics(values);

  if (validationError) {
    showEmptyResult();
    showMessage(validationError);
    return;
  }

  const results = calculateMetrics(values);

  showResults(results);
  showMessage('Расчет выполнен.', 'success');
});

form.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('input')) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('reset', () => {
  showEmptyResult();
  clearMessage();
});

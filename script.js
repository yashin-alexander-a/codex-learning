const form = document.querySelector('#calculator-form');
const message = document.querySelector('#message');

const fields = {
  adSpend: document.querySelector('#ad-spend'),
  impressions: document.querySelector('#impressions'),
  clicks: document.querySelector('#clicks'),
  leads: document.querySelector('#leads'),
  revenue: document.querySelector('#revenue'),
  otherCosts: document.querySelector('#other-costs'),
};

const targetFields = {
  ctr: document.querySelector('#target-ctr'),
  cpc: document.querySelector('#target-cpc'),
  conversion: document.querySelector('#target-conversion'),
  cpl: document.querySelector('#target-cpl'),
  romi: document.querySelector('#target-romi'),
  roi: document.querySelector('#target-roi'),
};

const outputs = {
  ctr: document.querySelector('#ctr'),
  cpc: document.querySelector('#cpc'),
  conversion: document.querySelector('#conversion'),
  cpl: document.querySelector('#cpl'),
  romi: document.querySelector('#romi'),
  roi: document.querySelector('#roi'),
};

function parseRequiredField(input, label) {
  const rawValue = input.value.trim();

  if (rawValue === '') {
    return { error: `Заполните поле «${label}».` };
  }

  return parseOptionalNumber(input, label, true);
}

function parseOptionalField(input, label) {
  return parseOptionalNumber(input, label, false);
}

function parseOptionalNumber(input, label, isRequired) {
  const rawValue = input.value.trim();

  if (rawValue === '') {
    return isRequired ? { error: `Заполните поле «${label}».` } : { value: null };
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

function getTargetValues() {
  return {
    ctr: parseOptionalField(targetFields.ctr, 'Целевой CTR'),
    cpc: parseOptionalField(targetFields.cpc, 'Целевой CPC'),
    conversion: parseOptionalField(targetFields.conversion, 'Целевая конверсия'),
    cpl: parseOptionalField(targetFields.cpl, 'Целевой CPL'),
    romi: parseOptionalField(targetFields.romi, 'Целевой ROMI'),
    roi: parseOptionalField(targetFields.roi, 'Целевой ROI'),
  };
}

function getFirstError(parsedFields) {
  return Object.values(parsedFields).find((field) => field.error);
}

function calculateMetrics({ adSpend, revenue, otherCosts, impressions, clicks, leads }) {
  const ctr = safeDivide(clicks, impressions);
  const cpc = safeDivide(adSpend, clicks);
  const conversion = safeDivide(leads, clicks);
  const cpl = safeDivide(adSpend, leads);
  const romi = revenue === null ? null : safeDivide(revenue - adSpend, adSpend);
  const roi = revenue === null || otherCosts === null
    ? null
    : safeDivide(revenue - adSpend - otherCosts, adSpend + otherCosts);

  return {
    ctr: ctr === null ? 'Нельзя рассчитать' : formatPercent(ctr * 100),
    cpc: cpc === null ? 'Нельзя рассчитать' : formatMoney(cpc),
    conversion: conversion === null ? 'Нельзя рассчитать' : formatPercent(conversion * 100),
    cpl: cpl === null ? 'Нельзя рассчитать' : formatMoney(cpl),
    romi: romi === null ? '—' : formatPercent(romi * 100),
    roi: roi === null ? '—' : formatPercent(roi * 100),
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

  const campaignFields = {
    adSpend: parseRequiredField(fields.adSpend, 'Рекламный расход'),
    impressions: parseRequiredField(fields.impressions, 'Количество показов'),
    clicks: parseRequiredField(fields.clicks, 'Количество кликов'),
    leads: parseRequiredField(fields.leads, 'Количество заявок'),
    revenue: parseOptionalField(fields.revenue, 'Выручка от рекламы'),
    otherCosts: parseOptionalField(fields.otherCosts, 'Прочие затраты'),
  };
  const targetValues = getTargetValues();
  const invalidField = getFirstError({ ...campaignFields, ...targetValues });

  if (invalidField) {
    showEmptyResult();
    showMessage(invalidField.error);
    return;
  }

  const values = {
    adSpend: campaignFields.adSpend.value,
    impressions: campaignFields.impressions.value,
    clicks: campaignFields.clicks.value,
    leads: campaignFields.leads.value,
    revenue: campaignFields.revenue.value,
    otherCosts: campaignFields.otherCosts.value,
    targets: Object.fromEntries(
      Object.entries(targetValues).map(([metric, field]) => [metric, field.value]),
    ),
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

const form = document.querySelector('#calculator-form');
const message = document.querySelector('#message');

const fields = {
  adSpend: document.querySelector('#ad-spend'),
  impressions: document.querySelector('#impressions'),
  clicks: document.querySelector('#clicks'),
  leads: document.querySelector('#leads'),
};

const outputs = {
  ctr: document.querySelector('#ctr'),
  cpc: document.querySelector('#cpc'),
  conversion: document.querySelector('#conversion'),
  cpl: document.querySelector('#cpl'),
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

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function formatMoney(value) {
  return `${value.toFixed(2)} ₽`;
}

function safeDivide(numerator, denominator) {
  if (denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

function showEmptyResult() {
  outputs.ctr.textContent = '—';
  outputs.cpc.textContent = '—';
  outputs.conversion.textContent = '—';
  outputs.cpl.textContent = '—';
}

function calculateMetrics({ adSpend, impressions, clicks, leads }) {
  const ctr = safeDivide(clicks, impressions);
  const cpc = safeDivide(adSpend, clicks);
  const conversion = safeDivide(leads, clicks);
  const cpl = safeDivide(adSpend, leads);

  return {
    ctr: ctr === null ? 'Нельзя рассчитать' : formatPercent(ctr * 100),
    cpc: cpc === null ? 'Нельзя рассчитать' : formatMoney(cpc),
    conversion: conversion === null ? 'Нельзя рассчитать' : formatPercent(conversion * 100),
    cpl: cpl === null ? 'Нельзя рассчитать' : formatMoney(cpl),
  };
}

function showMessage(text, type = 'error') {
  message.textContent = text;
  message.className = `message ${type}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const adSpend = parseField(fields.adSpend, 'Рекламный расход');
  const impressions = parseField(fields.impressions, 'Количество показов');
  const clicks = parseField(fields.clicks, 'Количество кликов');
  const leads = parseField(fields.leads, 'Количество заявок');
  const parsedFields = [adSpend, impressions, clicks, leads];
  const invalidField = parsedFields.find((field) => field.error);

  if (invalidField) {
    showEmptyResult();
    showMessage(invalidField.error);
    return;
  }

  const results = calculateMetrics({
    adSpend: adSpend.value,
    impressions: impressions.value,
    clicks: clicks.value,
    leads: leads.value,
  });

  outputs.ctr.textContent = results.ctr;
  outputs.cpc.textContent = results.cpc;
  outputs.conversion.textContent = results.conversion;
  outputs.cpl.textContent = results.cpl;
  showMessage('Расчет выполнен.', 'success');
});

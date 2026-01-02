// code.js - Mejoras: validación, formato y cálculos robustos (tasa en porcentaje)
document.addEventListener('DOMContentLoaded', () => {
  const deudaEl = document.getElementById('deuda');
  const tasaEl = document.getElementById('tasa');
  const periodosEl = document.getElementById('periodos');
  const calcularBtn = document.getElementById('calcular');
  const resultadoEl = document.getElementById('resultado');

  // Formatea número con separador de miles y 2 decimales según locale
  function formatNumber(num) {
    return Number(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function showError(msg) {
    resultadoEl.innerHTML = `<span class="error">${msg}</span>`;
    resultadoEl.setAttribute('aria-live','polite');
  }

  // Pago de una anualidad (cuota constante). r = tasa por periodo (decimal), n = número de periodos
  function calculateAnnuity(P, r, n) {
    if (r === 0) return P / n; // tasa 0: cuota simple
    return P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function sanitizeNumberInput(value) {
    if (typeof value !== 'string') value = String(value);
    // Quitar separadores, espacios y símbolo de porcentaje si el usuario lo ingresó
    return value.replace(/[,%\s]/g, '').trim();
  }

  function handleCalculate() {
    const P = parseFloat(sanitizeNumberInput(deudaEl.value));
    const tasaInput = parseFloat(sanitizeNumberInput(tasaEl.value));
    const n = parseInt(sanitizeNumberInput(periodosEl.value), 10);

    if (!isFinite(P) || P <= 0) { showError('Ingrese un monto válido mayor que 0.'); return; }
    if (!isFinite(tasaInput) || tasaInput < 0) { showError('Ingrese una tasa válida (0 o positiva).'); return; }
    if (!Number.isInteger(n) || n <= 0) { showError('Ingrese un número de períodos válido (entero mayor que 0).'); return; }

    // Interpretación fija: la tasa debe ingresarse en porcentaje (ej. 1 = 1%)
    const r = tasaInput / 100;

    const cuota = calculateAnnuity(P, r, n);
    const totalPagado = cuota * n;
    const interesTotal = totalPagado - P;

    resultadoEl.innerHTML = `
      <div class="result-box">
        <p>Cuota por período: <span class="result-value">${formatNumber(cuota)}</span></p>
        <p>Total pagado: <span class="result-value">${formatNumber(totalPagado)}</span></p>
        <p>Interés total: <span class="result-value">${formatNumber(interesTotal)}</span></p>
        <p class="muted">La tasa se ingresa en porcentaje (ej. 1 = 1%).</p>
      </div>
    `;
    resultadoEl.setAttribute('aria-live','polite');
  }

  calcularBtn.addEventListener('click', handleCalculate);

  // Formatea 'Valor deuda' en vivo con separadores de miles mientras el usuario escribe
  function formatDebtInput(e) {
    const input = e.target;
    const raw = input.value;
    // posición original (antes de limpiar/format)
    const selStart = input.selectionStart || 0;
    // contar dígitos antes del cursor
    const digitsBeforeCursor = (raw.slice(0, selStart).replace(/[^0-9]/g, '')).length;

    // limpiar caracteres no numéricos excepto punto decimal
    const cleaned = raw.replace(/[^0-9.]/g, '');
    // dividir parte entera y decimal
    const [intPartRaw, decPartRaw] = cleaned.split('.');
    let intPart = intPartRaw || '';
    // eliminar ceros a la izquierda salvo que sea '0'
    if (intPart.length > 1) intPart = intPart.replace(/^0+/, '') || '0';
    const decPart = decPartRaw || '';

    const formattedInt = intPart ? Number(intPart).toLocaleString() : '';
    const newValue = decPart ? `${formattedInt}.${decPart}` : formattedInt;

    input.value = newValue;

    // Recalcular posición del cursor
    const intDigits = intPart.length;
    let newPos = 0;
    if (digitsBeforeCursor > intDigits) {
      // cursor en parte decimal
      const decBefore = digitsBeforeCursor - intDigits;
      newPos = (formattedInt ? formattedInt.length : 0) + 1 + Math.min(decBefore, decPart.length);
    } else {
      // cursor en parte entera: buscar la posición en formattedInt que tiene la misma cantidad de dígitos
      let digitsCount = 0;
      let pos = 0;
      const FI = formattedInt || '';
      while (pos < FI.length && digitsCount < digitsBeforeCursor) {
        if (/\d/.test(FI[pos])) digitsCount++;
        pos++;
      }
      newPos = pos;
    }

    // asegurar dentro de límites
    newPos = Math.max(0, Math.min(newPos, input.value.length));
    input.setSelectionRange(newPos, newPos);
  }

  // Formatear al escribir y al pegar
  deudaEl.addEventListener('input', formatDebtInput);
  deudaEl.addEventListener('paste', (e) => {
    setTimeout(() => formatDebtInput({ target: deudaEl }), 0);
  });

  // COMPONENTES DE LA TABLA DE AMORTIZACIÓN
  const showScheduleEl = document.getElementById('show-schedule');
  const downloadCsvBtn = document.getElementById('download-csv');
  const amortContainer = document.getElementById('amortization-container');
  const amortTableBody = document.querySelector('#amortization-table tbody');

  function addMonths(date, months) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // Manejar final de mes
    if (d.getDate() !== day) {
      d.setDate(0);
    }
    return d;
  }

  function computeAmortizationSchedule(P, r, n, cuota, startDate) {
    const schedule = [];
    let balance = P;

    // Agregar periodo 0 con saldo inicial
    schedule.push({ period: 0, date: startDate || null, payment: 0, interest: 0, principal: 0, balance: Number(P) });

    for (let i = 1; i <= n; i++) {
      const interest = r === 0 ? 0 : balance * r;
      let principal = cuota - interest;
      // En el último pago, ajustar por errores de redondeo para dejar saldo en 0
      if (i === n) {
        principal = balance;
      }
      const payment = interest + principal;
      balance = Math.max(0, balance - principal);
      const periodDate = startDate ? addMonths(startDate, i - 1) : null;
      schedule.push({ period: i, date: periodDate, payment, interest, principal, balance });
    }
    return schedule;
  }

  function formatPeriodDate(date) {
    if (!date) return '';
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${m}/${y}`; // formato MM/YYYY
  }

  function renderAmortizationTable(schedule) {
    amortTableBody.innerHTML = '';
    schedule.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.period}</td>
        <td>${formatPeriodDate(row.date)}</td>
        <td>${formatNumber(row.payment)}</td>
        <td>${formatNumber(row.interest)}</td>
        <td>${formatNumber(row.principal)}</td>
        <td>${formatNumber(row.balance)}</td>
      `;
      amortTableBody.appendChild(tr);
    });
  }

  function downloadCSV(schedule) {
    const header = ['Periodo', 'Fecha', 'Cuota', 'Interes', 'Abono a capital', 'Saldo'];
    const rows = schedule.map(r => [r.period, r.date ? `${String(r.date.getMonth()+1).padStart(2,'0')}/${r.date.getFullYear()}` : '', r.payment.toFixed(2), r.interest.toFixed(2), r.principal.toFixed(2), r.balance.toFixed(2)]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amortization.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Mostrar/ocultar tabla al marcar checkbox
  showScheduleEl.addEventListener('change', () => {
    if (showScheduleEl.checked && lastSchedule) {
      amortContainer.style.display = 'block';
      downloadCsvBtn.style.display = 'inline-block';
      renderAmortizationTable(lastSchedule);
      amortContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      amortContainer.style.display = 'none';
      downloadCsvBtn.style.display = 'none';
    }
  });

  downloadCsvBtn.addEventListener('click', () => {
    if (lastSchedule) downloadCSV(lastSchedule);
  });

  // Guardamos última tabla generada para render/descarga bajo demanda
  let lastSchedule = null;

  // Permitir Enter para calcular en los inputs (incluye fecha de desembolso)
  const desembolsoMesEl = document.getElementById('desembolso-mes');
  const desembolsoAnoEl = document.getElementById('desembolso-ano');

  [deudaEl, tasaEl, periodosEl, desembolsoMesEl, desembolsoAnoEl].forEach(el => {
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCalculateWithSchedule();
    });
  });

  // al perder foco, normalizar decimales (dos decimales si hay parte decimal)
  deudaEl.addEventListener('blur', () => {
    const v = deudaEl.value.replace(/,/g, '');
    if (v.includes('.')) {
      const num = Number(v);
      if (isFinite(num)) {
        deudaEl.value = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
  });

  // Actualizar lastSchedule cuando se calcula
  const originalHandle = handleCalculate;
  function handleCalculateWithSchedule() {
    originalHandle();
    // Si ocurrió error, resultado muestra .error; no sobrescribimos schedule
    const errorEl = resultadoEl.querySelector('.error');
    if (errorEl) return;

    // RE-CALC: volver a calcular valores limpios para generar la tabla
    const P = parseFloat(sanitizeNumberInput(deudaEl.value));
    const tasaInput = parseFloat(sanitizeNumberInput(tasaEl.value));
    const n = parseInt(sanitizeNumberInput(periodosEl.value), 10);
    const r = tasaInput / 100;
    const cuota = calculateAnnuity(P, r, n);

    // Obtener fecha de desembolso (mes y año) — opcional
    const monthRaw = (document.getElementById('desembolso-mes').value || '').trim();
    const yearRaw = (document.getElementById('desembolso-ano').value || '').trim();
    let startDate = null;

    if (monthRaw === '' && yearRaw === '') {
      // opcional: no se especificó fecha
      startDate = null;
    } else {
      const month = parseInt(sanitizeNumberInput(monthRaw), 10);
      const year = parseInt(sanitizeNumberInput(yearRaw), 10);
      if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 1900) {
        showError('Ingrese una fecha de desembolso válida (mes 1-12 y año >= 1900), o deje ambos campos vacíos.');
        return;
      }
      startDate = new Date(year, month - 1, 1);
    }

    const schedule = computeAmortizationSchedule(P, r, n, cuota, startDate);
    lastSchedule = schedule;

    downloadCsvBtn.style.display = 'inline-block';
    if (showScheduleEl.checked) {
      amortContainer.style.display = 'block';
      renderAmortizationTable(schedule);
      amortContainer.scrollIntoView({ behavior: 'smooth' });
    } else {
      amortContainer.style.display = 'none';
    }
  }

  // Rebind calculate button to new handler that also prepares the table
  calcularBtn.removeEventListener('click', handleCalculate);
  calcularBtn.addEventListener('click', handleCalculateWithSchedule);
});

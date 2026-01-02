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

  // Permitir Enter para calcular en los inputs
  [tasaEl, periodosEl].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCalculate();
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
});

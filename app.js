const STORAGE_KEY = "alysson-finance-v1";
const locale = "pt-BR";
const currencyFormatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2
});
const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long" });

const state = {
  entries: loadEntries(),
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  toastTimer: null
};

const els = {
  calendarView: document.getElementById("calendarView"),
  monthView: document.getElementById("monthView"),
  calendarTitle: document.getElementById("calendarTitle"),
  yearSummary: document.getElementById("yearSummary"),
  monthsGrid: document.getElementById("monthsGrid"),
  monthTitle: document.getElementById("monthTitle"),
  monthNetButtonWrap: document.getElementById("monthNetButtonWrap"),
  daysTableBody: document.getElementById("daysTableBody"),
  prevYear: document.getElementById("prevYear"),
  nextYear: document.getElementById("nextYear"),
  todayButton: document.getElementById("todayButton"),
  backButton: document.getElementById("backButton"),
  monthModal: document.getElementById("monthModal"),
  closeModal: document.getElementById("closeModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalIncome: document.getElementById("modalIncome"),
  modalExpense: document.getElementById("modalExpense"),
  modalNet: document.getElementById("modalNet"),
  toast: document.getElementById("toast")
};

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function dateKey(year, monthIndex, day) {
  return [
    String(year),
    String(monthIndex + 1).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getEntry(key) {
  return state.entries[key] || { income: 0, expense: 0 };
}

function valueToNumber(value) {
  const normalized = String(value).replace(",", ".").trim();
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) return 0;
  return number;
}

function formatMoney(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function monthName(monthIndex) {
  return monthFormatter.format(new Date(2026, monthIndex, 1));
}

function monthTotals(year, monthIndex) {
  let income = 0;
  let expense = 0;

  for (let day = 1; day <= daysInMonth(year, monthIndex); day += 1) {
    const entry = getEntry(dateKey(year, monthIndex, day));
    income += valueToNumber(entry.income);
    expense += valueToNumber(entry.expense);
  }

  return { income, expense, net: income - expense };
}

function yearTotals(year) {
  return Array.from({ length: 12 }, (_, monthIndex) => monthTotals(year, monthIndex))
    .reduce(
      (acc, month) => ({
        income: acc.income + month.income,
        expense: acc.expense + month.expense,
        net: acc.net + month.net
      }),
      { income: 0, expense: 0, net: 0 }
    );
}

function renderCalendar() {
  els.calendarTitle.textContent = String(state.year);
  const totals = yearTotals(state.year);

  els.yearSummary.innerHTML =
    summaryCard("Ganho no ano", formatMoney(totals.income)) +
    summaryCard("Despesas no ano", formatMoney(totals.expense)) +
    summaryCard("Lucro líquido no ano", formatMoney(totals.net), totals.net);

  const now = new Date();
  els.monthsGrid.innerHTML = "";

  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const totals = monthTotals(state.year, monthIndex);
    const isCurrent = now.getFullYear() === state.year && now.getMonth() === monthIndex;
    const card = document.createElement("button");
    card.type = "button";
    card.className = "month-card" + (isCurrent ? " is-current" : "");
    card.innerHTML =
      '<div class="month-card-header">' +
        '<span class="month-name">' + monthName(monthIndex) + '</span>' +
        '<span class="month-status">' + (isCurrent ? "Mês atual" : "Abrir") + '</span>' +
      '</div>' +
      '<div class="month-net-label">Lucro líquido</div>' +
      '<div class="month-net ' + netClass(totals.net) + '">' + formatMoney(totals.net) + '</div>';

    card.addEventListener("click", () => openMonth(state.year, monthIndex));
    els.monthsGrid.appendChild(card);
  }
}

function summaryCard(label, value, signedValue = null) {
  const className = signedValue === null ? "" : netClass(signedValue);
  return (
    '<div class="summary-card">' +
      '<span>' + label + '</span>' +
      '<strong class="' + className + '">' + value + '</strong>' +
    '</div>'
  );
}

function netClass(value) {
  return value > 0 ? "positive" : value < 0 ? "negative" : "";
}

function openMonth(year, monthIndex) {
  state.year = year;
  state.month = monthIndex;
  els.calendarView.classList.add("hidden");
  els.monthView.classList.remove("hidden");
  renderMonth();
  window.scrollTo({ top: 0, behavior: "smooth" });

  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() === monthIndex) {
    requestAnimationFrame(() => {
      const todayRow = els.daysTableBody.querySelector(".is-today");
      todayRow?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }
}

function renderMonth() {
  const year = state.year;
  const month = state.month;
  const totals = monthTotals(year, month);
  const title = capitalize(monthName(month)) + " " + year;

  els.monthTitle.textContent = title;
  els.monthNetButtonWrap.innerHTML =
    '<button id="openMonthTotals" class="month-net-button" type="button">' +
      '<div>' +
        '<span>Total líquido mensal</span>' +
        '<strong class="' + netClass(totals.net) + '">' + formatMoney(totals.net) + '</strong>' +
      '</div>' +
    '</button>';

  document.getElementById("openMonthTotals").addEventListener("click", openMonthModal);

  const today = new Date();
  els.daysTableBody.innerHTML = "";

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    const key = dateKey(year, month, day);
    const entry = getEntry(key);
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;

    const net = valueToNumber(entry.income) - valueToNumber(entry.expense);
    const row = document.createElement("tr");
    row.className = isToday ? "is-today" : "";

    row.innerHTML =
      '<td class="day-cell">' +
        String(day).padStart(2, "0") +
        (isToday ? '<span class="today-badge">Hoje</span>' : "") +
      '</td>' +
      '<td>' +
        '<input class="money-input" type="number" min="0" step="0.01" inputmode="decimal" ' +
          'aria-label="Ganho total do dia ' + day + '" data-field="income" data-key="' + key + '" ' +
          'value="' + (entry.income || "") + '" placeholder="0,00">' +
      '</td>' +
      '<td>' +
        '<input class="money-input" type="number" min="0" step="0.01" inputmode="decimal" ' +
          'aria-label="Despesa total do dia ' + day + '" data-field="expense" data-key="' + key + '" ' +
          'value="' + (entry.expense || "") + '" placeholder="0,00">' +
      '</td>' +
      '<td class="net-cell ' + netValueClass(net) + '" data-net-key="' + key + '">' + formatMoney(net) + '</td>';

    els.daysTableBody.appendChild(row);
  }

  els.daysTableBody.querySelectorAll(".money-input").forEach((input) => {
    input.addEventListener("input", handleInput);
    input.addEventListener("blur", handleBlur);
    input.addEventListener("keydown", handleInputKeydown);
  });
}

function handleInput(event) {
  const input = event.currentTarget;
  const key = input.dataset.key;
  const field = input.dataset.field;
  const number = valueToNumber(input.value);

  if (!state.entries[key]) {
    state.entries[key] = { income: 0, expense: 0 };
  }

  state.entries[key][field] = number;
  saveEntries();
  updateDayAndMonthTotals(key);
}

function handleBlur(event) {
  const input = event.currentTarget;
  if (input.value !== "") {
    input.value = valueToNumber(input.value).toFixed(2);
  }
  showToast("Salvo automaticamente");
}

function handleInputKeydown(event) {
  if (event.key !== "Enter") return;

  event.preventDefault();
  const inputs = Array.from(els.daysTableBody.querySelectorAll(".money-input"));
  const index = inputs.indexOf(event.currentTarget);
  const next = inputs[index + 1];

  if (next) {
    next.focus();
    next.select();
  }
}

function updateDayAndMonthTotals(key) {
  const rowNetCell = els.daysTableBody.querySelector('[data-net-key="' + key + '"]');
  const entry = getEntry(key);
  const net = valueToNumber(entry.income) - valueToNumber(entry.expense);

  if (rowNetCell) {
    rowNetCell.textContent = formatMoney(net);
    rowNetCell.className = "net-cell " + netValueClass(net);
  }

  const totals = monthTotals(state.year, state.month);
  const monthlyStrong = els.monthNetButtonWrap.querySelector("strong");
  if (monthlyStrong) {
    monthlyStrong.textContent = formatMoney(totals.net);
    monthlyStrong.className = netClass(totals.net);
  }
}

function netValueClass(value) {
  return value > 0 ? "value-positive" : value < 0 ? "value-negative" : "";
}

function openMonthModal() {
  const totals = monthTotals(state.year, state.month);
  els.modalTitle.textContent = capitalize(monthName(state.month)) + " " + state.year;
  els.modalIncome.textContent = formatMoney(totals.income);
  els.modalExpense.textContent = formatMoney(totals.expense);
  els.modalNet.textContent = formatMoney(totals.net);
  els.modalNet.className = netClass(totals.net);
  els.monthModal.classList.remove("hidden");
  els.closeModal.focus();
}

function closeMonthModal() {
  els.monthModal.classList.add("hidden");
}

function goToToday() {
  const now = new Date();
  state.year = now.getFullYear();
  state.month = now.getMonth();
  openMonth(state.year, state.month);

  requestAnimationFrame(() => {
    const todayRow = els.daysTableBody.querySelector(".is-today");
    todayRow?.scrollIntoView({ block: "center", behavior: "smooth" });
    const todayInput = todayRow?.querySelector(".money-input");
    todayInput?.focus();
  });
}

function backToCalendar() {
  closeMonthModal();
  els.monthView.classList.add("hidden");
  els.calendarView.classList.remove("hidden");
  renderCalendar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1400);
}

els.prevYear.addEventListener("click", () => {
  state.year -= 1;
  renderCalendar();
});
els.nextYear.addEventListener("click", () => {
  state.year += 1;
  renderCalendar();
});
els.todayButton.addEventListener("click", goToToday);
els.backButton.addEventListener("click", backToCalendar);
els.closeModal.addEventListener("click", closeMonthModal);

els.monthModal.addEventListener("click", (event) => {
  if (event.target === els.monthModal) closeMonthModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.monthModal.classList.contains("hidden")) {
    closeMonthModal();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

renderCalendar();

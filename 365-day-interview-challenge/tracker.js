const TOTAL_DAYS = 365;
const DEFAULT_START_DATE = "2026-11-09";
const STORAGE_KEY = "channelcraft.interview-challenge.v1";
const PAGE_SIZE = 25;
const PHASES = [
  { through: 30, focus: "Foundations and baseline" },
  { through: 90, focus: "Core data structures" },
  { through: 150, focus: "Advanced problem patterns" },
  { through: 210, focus: "Practical engineering" },
  { through: 270, focus: "Communication and role preparation" },
  { through: 330, focus: "Mock interview cycle" },
  { through: 365, focus: "Review and readiness" },
];
const STATUSES = ["Not started", "In progress", "Done", "Rest day"];

function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dateOffset(dateKey, offset) {
  if (!isValidDateKey(dateKey) || !Number.isInteger(offset)) throw new TypeError("Provide a valid date and whole-day offset.");
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function createChallengeDays(startDate = DEFAULT_START_DATE) {
  if (!isValidDateKey(startDate)) throw new TypeError("Challenge start date must be a valid YYYY-MM-DD date.");
  return Array.from({ length: TOTAL_DAYS }, (_, index) => {
    const day = index + 1;
    return {
      day,
      date: dateOffset(startDate, index),
      focus: PHASES.find((phase) => day <= phase.through).focus,
      status: "Not started",
      practice: "",
      learned: "",
      confidence: "",
      reviewDate: "",
    };
  });
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function createChallengeCsv(days) {
  const headers = ["Day", "Date", "Focus", "Status", "Practice / prompt", "What I learned", "Confidence (1-5)", "Review date"];
  const rows = days.map((item) => [
    item.day,
    item.date,
    item.focus,
    item.status,
    item.practice,
    item.learned,
    item.confidence,
    item.reviewDate,
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_START_DATE, TOTAL_DAYS, createChallengeCsv, createChallengeDays, dateOffset, isValidDateKey };
}

if (typeof document !== "undefined") {
  const elements = {
    startDate: document.getElementById("start-date"),
    exportButton: document.getElementById("export-csv"),
    resetButton: document.getElementById("reset-progress"),
    completedCount: document.getElementById("completed-count"),
    completionRate: document.getElementById("completion-rate"),
    currentDay: document.getElementById("current-day"),
    saveStatus: document.getElementById("save-status"),
    search: document.getElementById("search-days"),
    statusFilter: document.getElementById("status-filter"),
    rows: document.getElementById("tracker-rows"),
    previous: document.getElementById("previous-page"),
    next: document.getElementById("next-page"),
    pageLabel: document.getElementById("page-label"),
  };
  let page = 0;
  let entries = {};

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function showSaveStatus(message, failed = false) {
    elements.saveStatus.textContent = message;
    elements.saveStatus.classList.toggle("is-error", failed);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startDate: elements.startDate.value,
        entries,
      }));
      showSaveStatus("Saved on this browser. Export a CSV for a portable backup.");
    } catch (error) {
      console.error("Could not save interview challenge progress:", error);
      showSaveStatus(`Could not save progress in this browser: ${error.message}`, true);
    }
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      if (isValidDateKey(saved.startDate)) elements.startDate.value = saved.startDate;
      if (saved.entries && typeof saved.entries === "object" && !Array.isArray(saved.entries)) {
        entries = Object.fromEntries(Object.entries(saved.entries).filter(([day, item]) =>
          /^\d{1,3}$/.test(day) && Number(day) >= 1 && Number(day) <= TOTAL_DAYS &&
          item && typeof item === "object" && !Array.isArray(item)
        ));
      }
    } catch (error) {
      console.error("Could not load interview challenge progress:", error);
      showSaveStatus(`Saved progress could not be loaded: ${error.message}. Your new edits can still be exported.`, true);
    }
  }

  function getDays() {
    return createChallengeDays(elements.startDate.value).map((day) => {
      const saved = entries[day.day] || {};
      return {
        ...day,
        status: STATUSES.includes(saved.status) ? saved.status : day.status,
        practice: typeof saved.practice === "string" ? saved.practice : "",
        learned: typeof saved.learned === "string" ? saved.learned : "",
        confidence: [1, 2, 3, 4, 5].includes(Number(saved.confidence)) ? String(saved.confidence) : "",
        reviewDate: isValidDateKey(saved.reviewDate) ? saved.reviewDate : "",
      };
    });
  }

  function render() {
    const days = getDays();
    const query = elements.search.value.trim().toLocaleLowerCase();
    const status = elements.statusFilter.value;
    const visible = days.filter((item) =>
      (status === "all" || item.status === status) &&
      (!query || `${item.day} ${item.date} ${item.focus} ${item.practice} ${item.learned}`.toLocaleLowerCase().includes(query))
    );
    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    page = Math.min(page, pageCount - 1);
    const pageItems = visible.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const currentDay = Math.max(1, Math.min(TOTAL_DAYS, Math.floor(
      (Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${elements.startDate.value}T00:00:00Z`)) / 86_400_000
    ) + 1));
    const completed = days.filter((item) => item.status === "Done").length;
    elements.completedCount.textContent = `${completed} / ${TOTAL_DAYS}`;
    elements.completionRate.textContent = `${Math.round(completed / TOTAL_DAYS * 100)}%`;
    elements.currentDay.textContent = `Day ${currentDay}`;
    elements.pageLabel.textContent = `Page ${page + 1} of ${pageCount} · ${visible.length} days`;
    elements.previous.disabled = page === 0;
    elements.next.disabled = page >= pageCount - 1;

    elements.rows.innerHTML = pageItems.map((item) => {
      const rowClass = [item.date === dateOffset(todayKey, 0) ? "is-today" : "", item.status === "Done" ? "is-done" : ""].filter(Boolean).join(" ");
      const options = STATUSES.map((option) => `<option value="${option}"${item.status === option ? " selected" : ""}>${option}</option>`).join("");
      return `<tr class="${rowClass}" data-day="${item.day}">
        <td class="day-cell">Day ${item.day}<br>${item.date}</td>
        <td class="focus-cell">${escapeHtml(item.focus)}</td>
        <td><select data-field="status" aria-label="Day ${item.day} status">${options}</select></td>
        <td><input data-field="practice" aria-label="Day ${item.day} practice or prompt" maxlength="240" placeholder="Add a practice prompt" value="${escapeHtml(item.practice)}"></td>
        <td><input data-field="learned" aria-label="Day ${item.day} learning note" maxlength="240" placeholder="What clicked?" value="${escapeHtml(item.learned)}"></td>
        <td><select class="confidence-input" data-field="confidence" aria-label="Day ${item.day} confidence"><option value="">—</option>${[1, 2, 3, 4, 5].map((score) => `<option value="${score}"${String(item.confidence) === String(score) ? " selected" : ""}>${score} / 5</option>`).join("")}</select></td>
        <td><input data-field="reviewDate" aria-label="Day ${item.day} next review date" type="date" value="${escapeHtml(item.reviewDate)}"></td>
      </tr>`;
    }).join("");
  }

  elements.rows.addEventListener("input", (event) => {
    const field = event.target.dataset.field;
    const day = event.target.closest("tr")?.dataset.day;
    if (!field || !day || field === "status" || field === "confidence") return;
    entries[day] = { ...(entries[day] || {}), [field]: event.target.value };
    save();
    const completed = Object.values(entries).filter((entry) => entry.status === "Done").length;
    elements.completedCount.textContent = `${completed} / ${TOTAL_DAYS}`;
    elements.completionRate.textContent = `${Math.round(completed / TOTAL_DAYS * 100)}%`;
  });
  elements.rows.addEventListener("change", (event) => {
    if (event.target.dataset.field === "status" || event.target.dataset.field === "confidence") {
      const row = event.target.closest("tr");
      if (row) {
        const day = row.dataset.day;
        entries[day] = { ...(entries[day] || {}), [event.target.dataset.field]: event.target.value };
        save();
      }
      render();
    }
  });
  elements.startDate.addEventListener("change", () => {
    if (!isValidDateKey(elements.startDate.value)) {
      showSaveStatus("Choose a valid challenge start date.", true);
      return;
    }
    page = 0;
    save();
    render();
  });
  elements.search.addEventListener("input", () => { page = 0; render(); });
  elements.statusFilter.addEventListener("change", () => { page = 0; render(); });
  elements.previous.addEventListener("click", () => { page = Math.max(0, page - 1); render(); });
  elements.next.addEventListener("click", () => { page += 1; render(); });
  elements.exportButton.addEventListener("click", () => {
    const csv = `\uFEFF${createChallengeCsv(getDays())}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `365-day-interview-challenge-${elements.startDate.value}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    showSaveStatus("Excel-compatible CSV exported. Keep a backup somewhere safe.");
  });
  elements.resetButton.addEventListener("click", () => {
    if (!window.confirm("Clear all saved challenge notes and progress from this browser? Export a CSV backup first if you need one.")) return;
    entries = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
      elements.startDate.value = DEFAULT_START_DATE;
      page = 0;
      render();
      showSaveStatus("Saved progress cleared. Your challenge begins on November 9, 2026.");
    } catch (error) {
      console.error("Could not clear interview challenge progress:", error);
      showSaveStatus(`Could not clear saved progress: ${error.message}`, true);
    }
  });

  load();
  render();
}

const SUBJECTS = ["English", "Mathematics", "Physics", "Chemistry", "Biology"];

const GRADE_SCALE = [
  { min: 70, grade: "A", remark: "Excellent" },
  { min: 60, grade: "B", remark: "Very good" },
  { min: 50, grade: "C", remark: "Good" },
  { min: 45, grade: "D", remark: "Fair" },
  { min: 40, grade: "E", remark: "Pass" },
  { min: 0, grade: "F", remark: "Fail" }
];

function assignGrade(average) {
  const band = GRADE_SCALE.find(b => average >= b.min);
  return band ? band : GRADE_SCALE[GRADE_SCALE.length - 1];
}

function validateName(name) {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value) return "Enter the student's name.";
  if (value.length < 2) return "Name must be at least 2 characters.";
  if (!/^[A-Za-z][A-Za-z' -]*$/.test(value)) return "Use letters, spaces, hyphens and apostrophes only.";
  return "";
}

function validateScore(raw) {
  if (raw === "" || raw === null || raw === undefined) return "Enter a score.";
  const text = String(raw).trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return "Score must be a number.";
  const n = Number(text);
  if (n < 0 || n > 100) return "Score must be between 0 and 100.";
  return "";
}

function calculateStudentResult(name, scores) {
  const nameError = validateName(name);
  if (nameError) throw new Error(nameError);
  if (!Array.isArray(scores) || scores.length !== SUBJECTS.length) {
    throw new Error("Exactly " + SUBJECTS.length + " scores are required.");
  }
  scores.forEach((s, i) => {
    const err = validateScore(s);
    if (err) throw new Error(SUBJECTS[i] + ": " + err);
  });
  const numeric = scores.map(Number);
  const total = numeric.reduce((a, b) => a + b, 0);
  const average = total / numeric.length;
  const band = assignGrade(average);
  return {
    name: name.trim().replace(/\s+/g, " "),
    scores: numeric,
    total: Math.round(total * 100) / 100,
    average: Math.round(average * 100) / 100,
    grade: band.grade,
    remark: band.remark
  };
}

function findTopStudent(results) {
  if (!results.length) return null;
  return results.reduce((best, r) => (r.total > best.total ? r : best), results[0]);
}

function subjectAverages(results) {
  return SUBJECTS.map((_, i) => {
    if (!results.length) return 0;
    const sum = results.reduce((a, r) => a + r.scores[i], 0);
    return Math.round((sum / results.length) * 100) / 100;
  });
}

function findWeakestSubject(results) {
  if (!results.length) return null;
  const avgs = subjectAverages(results);
  const min = Math.min(...avgs);
  const index = avgs.indexOf(min);
  return { subject: SUBJECTS[index], average: min, index };
}

const form = document.getElementById("form");
const nameInput = document.getElementById("name");
const subjectFields = document.getElementById("subjectFields");
const rows = document.getElementById("rows");
const head = document.getElementById("head");
const totalEl = document.getElementById("total");
const emptyEl = document.getElementById("empty");
const statusEl = document.getElementById("status");
const topEl = document.getElementById("top");
const weakEl = document.getElementById("weak");
const avgHead = document.getElementById("avgHead");
const avgRow = document.getElementById("avgRow");
const averagesWrap = document.getElementById("averagesWrap");
const scaleEl = document.getElementById("scale");

let results = [];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function buildStaticParts() {
  subjectFields.innerHTML = SUBJECTS.map((s, i) =>
    '<div class="field"><label for="score' + i + '">' + s + ' score (0-100)</label>' +
    '<input id="score' + i + '" type="text" inputmode="decimal" autocomplete="off">' +
    '<small class="err" id="err-score' + i + '"></small></div>'
  ).join("");
  head.innerHTML = "<tr><th>#</th><th>Name</th>" +
    SUBJECTS.map(s => "<th>" + s + "</th>").join("") +
    "<th>Total</th><th>Average</th><th>Grade</th><th>Remark</th><th></th></tr>";
  avgHead.innerHTML = SUBJECTS.map(s => "<th>" + s + "</th>").join("");
  scaleEl.innerHTML = GRADE_SCALE.map((b, i) => {
    const upper = i === 0 ? 100 : GRADE_SCALE[i - 1].min - 1;
    return "<li><strong>" + b.grade + "</strong> " + b.min + "-" + upper + "</li>";
  }).join("");
}

function showError(id, message) {
  const input = document.getElementById(id);
  document.getElementById("err-" + id).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateInputs() {
  let ok = true;
  let firstBad = null;
  const nameErr = validateName(nameInput.value);
  showError("name", nameErr);
  if (nameErr) { ok = false; firstBad = nameInput; }
  SUBJECTS.forEach((_, i) => {
    const el = document.getElementById("score" + i);
    const err = validateScore(el.value);
    showError("score" + i, err);
    if (err) {
      ok = false;
      if (!firstBad) firstBad = el;
    }
  });
  if (firstBad) firstBad.focus();
  return ok;
}

function render() {
  totalEl.textContent = results.length;
  emptyEl.style.display = results.length ? "none" : "block";
  averagesWrap.style.display = results.length ? "block" : "none";
  head.style.display = results.length ? "" : "none";

  const top = findTopStudent(results);
  const weak = findWeakestSubject(results);
  topEl.textContent = top ? top.name + " (total " + top.total + ", grade " + top.grade + ")" : "None yet";
  weakEl.textContent = weak ? weak.subject + " (average " + weak.average + ")" : "None yet";

  rows.innerHTML = results.map((r, i) =>
    '<tr class="' + (top && r.id === top.id ? "best" : "") + '">' +
    "<td>" + (i + 1) + "</td>" +
    "<td>" + escapeHtml(r.name) + "</td>" +
    r.scores.map((s, j) => '<td class="' + (weak && j === weak.index ? "lowest" : "") + '">' + s + "</td>").join("") +
    "<td>" + r.total + "</td>" +
    "<td>" + r.average + "</td>" +
    '<td class="grade">' + r.grade + "</td>" +
    "<td>" + r.remark + "</td>" +
    '<td><button type="button" class="remove" data-id="' + r.id + '">Remove</button></td>' +
    "</tr>"
  ).join("");

  const avgs = subjectAverages(results);
  avgRow.innerHTML = avgs.map((a, j) =>
    '<td class="' + (weak && j === weak.index ? "lowest" : "") + '">' + a + "</td>"
  ).join("");
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || "";
}

form.addEventListener("submit", e => {
  e.preventDefault();
  setStatus("");
  if (!validateInputs()) {
    setStatus("Fix the highlighted fields and try again.", "bad");
    return;
  }
  try {
    const result = calculateStudentResult(
      nameInput.value,
      SUBJECTS.map((_, i) => document.getElementById("score" + i).value)
    );
    result.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    results = results.concat(result);
    form.reset();
    render();
    setStatus(result.name + ": grade " + result.grade + ", average " + result.average + ".", "ok");
    nameInput.focus();
  } catch (err) {
    setStatus(err.message, "bad");
  }
});

form.addEventListener("input", e => {
  if (e.target.classList.contains("invalid")) {
    const id = e.target.id;
    const err = id === "name" ? validateName(e.target.value) : validateScore(e.target.value);
    showError(id, err);
  }
  setStatus("");
});

rows.addEventListener("click", e => {
  const btn = e.target.closest(".remove");
  if (!btn) return;
  results = results.filter(r => r.id !== btn.dataset.id);
  render();
});

buildStaticParts();
render();

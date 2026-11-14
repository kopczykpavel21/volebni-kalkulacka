// Administrator view: every stored answer, linked by respondent, with CSV download.
import { el, btn, loadData } from "./common.js";

const app = document.getElementById("app");
let D, rows = [], token = "";
const csvCell = v => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function download(name, header, lines) {
  const blob = new Blob(["﻿" + [header, ...lines].map(r => r.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = el("a", { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove();
}
const last = a => a[a.length - 1];
const bgLabels = bg => D.survey.background.map(g => (bg && bg[g.id] != null ? g.en.o[bg[g.id]] : ""));
const qOpts = q => (q.opts ? D.survey[q.opts].en : q.en.o || []);

function csvCalculator() {
  const lines = [];
  for (const r of rows) for (const sub of r.calculator) for (const [sid, a] of Object.entries(sub.answers))
    lines.push([r.id, sub.id, sub.day, sub === last(r.calculator) ? 1 : 0, sub.record_weight, sid, a.a, a.imp ? 1 : 0, r.survey.length ? 1 : 0]);
  download("calculator_answers.csv", ["respondent", "submission", "day", "latest", "record_weight", "statement", "answer_-2_to_2", "important", "has_survey"], lines);
}
function csvSurvey() {
  const qs = new Map(D.survey.questions.map(q => [String(q.id), q])), lines = [];
  for (const r of rows) for (const sub of r.survey) for (const [qid, a] of Object.entries(sub.answers)) {
    const q = qs.get(qid);
    lines.push([r.id, sub.id, sub.day, sub === last(r.survey) ? 1 : 0, qid, a.choice || "", a.dir != null ? q.en.o[a.dir] : "", (a.picks || []).map(p => qOpts(q)[p]).join("; "),
      a.why || (a.texts || []).filter(Boolean).join(" | "), r.calculator.length ? 1 : 0, ...bgLabels(sub.background)]);
  }
  download("survey_answers.csv", ["respondent", "submission", "day", "latest", "question", "choice", "direction", "picks", "text", "has_calculator", ...D.survey.background.map(g => g.id)], lines);
}

function table() {
  const st = new Map(D.statements.map(s => [String(s.id), s.cs])), qs = new Map(D.survey.questions.map(q => [String(q.id), q]));
  const calc = sub => el("table", {}, el("tbody", {}, Object.entries(sub.answers).map(([sid, a]) => el("tr", {}, el("td", {}, `${sid}. ${st.get(sid) || ""}`), el("td", {}, a.a + (a.imp ? " ★" : ""))))));
  const surv = sub => el("table", {}, el("tbody", {}, Object.entries(sub.answers).map(([qid, a]) => { const q = qs.get(qid);
    return el("tr", {}, el("td", {}, `${qid}. ${q ? q.cs.q : ""}`), el("td", {}, [a.choice, a.dir != null ? "→ " + q.cs.o[a.dir] : null, (a.picks || []).map(p => (q.opts ? D.survey[q.opts].cs : q.cs.o)[p]).join("; "), a.why, ...(a.texts || [])].filter(Boolean).join(" · "))); })));
  return rows.map(r => el("details", { class: "card" }, el("summary", {}, `${r.day} · ${r.id.slice(0, 8)} · kalkulačka ${r.calculator.length}× · průzkum ${r.survey.length}×`),
    r.calculator.length ? [el("h3", {}, "Kalkulačka (poslední), váha záznamu " + last(r.calculator).record_weight + " %"), calc(last(r.calculator))] : null,
    r.survey.length ? [el("h3", {}, "Průzkum (poslední)"), el("p", { class: "small muted" }, bgLabels(last(r.survey).background).filter(Boolean).join(" · ")), surv(last(r.survey))] : null));
}

async function load(status) {
  status.textContent = "Načítám…";
  const r = await fetch("/api/admin/responses", { headers: { Authorization: "Bearer " + token } });
  if (!r.ok) { status.textContent = r.status === 401 ? "Nesprávný kód." : "Chyba " + r.status; return; }
  rows = (await r.json()).respondents;
  if (!D) D = await loadData("statements", "survey");
  const both = rows.filter(x => x.calculator.length && x.survey.length).length;
  app.replaceChildren(el("h1", {}, "Všechny odpovědi"),
    el("p", {}, `Respondentů: ${rows.length}. Kalkulačka: ${rows.filter(x => x.calculator.length).length}. Průzkum: ${rows.filter(x => x.survey.length).length}. Obojí: ${both}.`),
    el("div", { class: "row", style: "justify-content:flex-start" }, btn("Stáhnout kalkulačku (CSV)", csvCalculator), btn("Stáhnout průzkum (CSV)", csvSurvey)),
    el("p", { class: "small muted" }, "Sloupec „respondent“ propojuje oba soubory. Texty psali respondenti: nezveřejňujte je bez kontroly."),
    ...table());
}

const status = el("span", { class: "small muted", role: "status" });
const input = el("input", { type: "password", placeholder: "ADMIN_TOKEN", "aria-label": "ADMIN_TOKEN", autocomplete: "off" });
app.replaceChildren(el("h1", {}, "Správa"), el("form", { class: "card", onsubmit: e => { e.preventDefault(); token = input.value.trim(); load(status); } },
  el("p", {}, "Zadejte správcovský kód."), input, el("div", { class: "row" }, el("button", { type: "submit", class: "primary" }, "Zobrazit odpovědi"), status)));

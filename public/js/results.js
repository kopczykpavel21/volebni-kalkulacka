// Public results: counts only. Free-text answers are visible on the admin page alone.
import { lang, makeT, fmt, el, pct, stack, hbars, legend, loadData, api, mount } from "./common.js";

const P = {
  cs: {
    h: "Co odpověděli ostatní", n: "Uložené odpovědi: kalkulačka {c}, průzkum {s}, obojí {l}.",
    warn: "Respondenti se do nástroje přihlásili sami. Výsledky popisují uživatele nástroje, ne celou populaci Česka.",
    hidden: "Výsledky se zobrazí, až odpoví aspoň {min} lidí. Zatím jich je {n}.",
    h2: "Průzkum: co ponechat a co změnit", h1b: "Kalkulačka: souhlas s výroky", bg: "Kdo odpovídal",
    dirs: "Směr změny (z těch, kdo chtějí změnu)", imp: "označilo jako důležité", texts: "{n} lidí připsalo vlastní odpověď"
  },
  en: {
    h: "What others answered", n: "Saved answers: calculator {c}, survey {s}, both {l}.",
    warn: "Respondents chose to use this tool. Results describe its users, not the whole Czech population.",
    hidden: "Results appear once at least {min} people have answered. So far there are {n}.",
    h2: "Survey: what to keep and what to change", h1b: "Calculator: agreement with the statements", bg: "Who answered",
    dirs: "Direction of change (among those who want change)", imp: "marked as important", texts: "{n} people added their own answer"
  }
};
const t = makeT(P);
const c = (o, k) => (o && o[k]) || 0;
let D, R;

function survey() {
  const s = R.survey;
  if (!s.answers) return el("div", { class: "card" }, fmt(t("hidden"), { min: R.min, n: s.n }));
  return el("div", { class: "card" }, D.survey.questions.map(q => {
    const r = s.answers[q.id]; if (!r) return null;
    const box = el("div", { class: "q" }, el("div", { class: "stem" }, `${q.id}. ${q[lang].q}`), el("p", { class: "small muted" }, `${r.n} ${t("answers")}`));
    if (q.type === "kc") {
      const k = c(r.choice, "keep"), ch = c(r.choice, "change"), u = c(r.choice, "unsure"), tot = k + ch + u;
      box.append(stack([{ n: k, cls: "s-keep", label: t("keep") }, { n: ch, cls: "s-change", label: t("change") }, { n: u, cls: "s-unsure", label: t("unsure") }], tot),
        el("p", { class: "small" }, `${t("keep")} ${pct(k, tot)} % · ${t("change")} ${pct(ch, tot)} % · ${t("unsure")} ${pct(u, tot)} %`));
      const nd = Object.values(r.dir).reduce((a, b) => a + b, 0);
      if (nd) box.append(el("p", { class: "small muted" }, t("dirs")), ...hbars(q[lang].o, q[lang].o.map((_, i) => c(r.dir, i)), nd));
    } else if (q.type !== "open") {
      const o = q.opts ? D.survey[q.opts][lang] : q[lang].o;
      box.append(...hbars(o, o.map((_, i) => c(r.picks, i)), r.n));
    }
    if (r.texts) box.append(el("p", { class: "small muted" }, fmt(t("texts"), { n: r.texts })));
    return box;
  }));
}
function calculator() {
  const k = R.calculator;
  if (!k.answers) return el("div", { class: "card" }, fmt(t("hidden"), { min: R.min, n: k.n }));
  return el("div", { class: "card" }, D.statements.map(s => {
    const r = k.answers[s.id]; if (!r) return null;
    const a = c(r, "2") + c(r, "1"), n = c(r, "0"), d = c(r, "-1") + c(r, "-2"), tot = a + n + d;
    return el("div", { class: "q" }, el("div", { class: "stem" }, `${s.id}. ${s[lang]}`),
      stack([{ n: a, cls: "s-agree", label: t("agree") }, { n: n, cls: "s-neutral", label: t("neutral") }, { n: d, cls: "s-dis", label: t("disagree") }], tot),
      el("p", { class: "small" }, `${t("agree")} ${pct(a, tot)} % · ${t("neutral")} ${pct(n, tot)} % · ${t("disagree")} ${pct(d, tot)} % · ${tot} ${t("answers")} · ${c(k.important, s.id)} ${t("imp")}`));
  }));
}
function background() {
  const b = R.survey.background; if (!b || !Object.keys(b).length) return null;
  return [el("h2", {}, t("bg")), el("div", { class: "card" }, D.survey.background.map(g => { const r = b[g.id]; if (!r) return null; const tot = Object.values(r).reduce((x, y) => x + y, 0);
    return el("div", { class: "q" }, el("div", { class: "stem" }, g[lang].q), ...hbars(g[lang].o, g[lang].o.map((_, i) => c(r, i)), tot)); }))];
}

mount(async () => {
  if (!D) { [D, R] = await Promise.all([loadData("statements", "survey"), api("results")]); }
  return [el("h1", {}, t("h")), el("p", {}, fmt(t("n"), { c: R.calculator.n, s: R.survey.n, l: R.linked })), el("div", { class: "note" }, t("warn")),
    el("h2", {}, t("h2")), legend([["s-keep", t("keep")], ["s-change", t("change")], ["s-unsure", t("unsure")]]), survey(),
    el("h2", {}, t("h1b")), legend([["s-agree", t("agree")], ["s-neutral", t("neutral")], ["s-dis", t("disagree")]]), calculator(), background()];
});

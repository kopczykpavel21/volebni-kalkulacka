// Questionnaire 1: 25 statements, the match with each party, and the "said vs did" slider.
import { T, lang, makeT, fmt, el, btn, info, privacyLink, loadData, api, respondentId, mount } from "./common.js";

const P = {
  cs: {
    h: "Která strana je vám nejblíž?", p: "25 výroků. Vaše odpovědi se porovnají s postoji stran a s tím, co strany skutečně udělaly.",
    important: "Tento výrok je pro mě důležitý (dvojnásobná váha)", finish: "Zobrazit výsledek",
    scale: ["Rozhodně souhlasím", "Spíše souhlasím", "Nevím / je to složitější", "Spíše nesouhlasím", "Rozhodně nesouhlasím"],
    res_h: "Váš výsledek", res_p: "Shoda ukazuje, jak blízko jsou vaše odpovědi postojům strany. Není to doporučení, koho volit.",
    based: "na základě {n} z 25 výroků", tie: "prakticky stejná shoda",
    tie_note: "Rozdíl menší než 7 bodů odpovídá zhruba dvěma výrokům. Takové strany berte jako stejně blízké.",
    none: "Odpovězte aspoň na jeden výrok, aby bylo co porovnat.",
    sl_h: "Čemu dát větší váhu?", sl_l: "tomu, co strany říkají", sl_r: "tomu, co strany udělaly",
    sl_p: "Posuvník mění shodu jen tam, kde je doloženo hlasování nebo krok vlády: zatím u {n} postojů, z toho {c} jde proti tomu, co strana říká.",
    compare: "Porovnat výrok po výroku", record: "Co strana udělala ve vládě", source: "zdroj",
    th_s: "Výrok", th_you: "Vy", th_party: "Strana říká", th_did: "Strana udělala", th_basis: "Podklad",
    pa: "souhlasí", pn: "nesouhlasí", p0: "neutrální", pu: "neznámé",
    did_same: "v souladu", did_against: "opak", did_traded: "ustoupila při vyjednávání o vládě",
    ya: ["rozhodně ano", "spíše ano", "nevím", "spíše ne", "rozhodně ne"], yskip: "přeskočeno",
    b_party: "odpověď strany 2025", b_editors: "doplněno editory 2025", b_news: "zprávy v médiích", flipped: "z opačně položeného výroku",
    uncoded: "Zatím nezakódované strany",
    save_h: "Uložit odpovědi pro výzkum", save_c: "Souhlasím, aby mé odpovědi z kalkulačky byly anonymně uloženy pro výzkum.",
    save_b: "Uložit mé odpovědi", again: "Vyplnit znovu", to_survey: "Pokračovat na průzkum: jak má být Česko spravováno"
  },
  en: {
    h: "Which party is closest to you?", p: "25 statements. Your answers are compared with party positions and with what the parties actually did.",
    important: "This statement is important to me (double weight)", finish: "Show my result",
    scale: ["Strongly agree", "Somewhat agree", "Not sure / it is complicated", "Somewhat disagree", "Strongly disagree"],
    res_h: "Your result", res_p: "The match shows how close your answers are to a party's positions. It is not advice on how to vote.",
    based: "based on {n} of 25 statements", tie: "practically the same match",
    tie_note: "A gap under 7 points is about two statements. Treat such parties as equally close.",
    none: "Answer at least one statement so there is something to compare.",
    sl_h: "What should count more?", sl_l: "what parties say", sl_r: "what parties did",
    sl_p: "The slider changes the match only where a vote or a government step is documented: {n} positions so far, of which {c} go against what the party says.",
    compare: "Compare statement by statement", record: "What the party did in government", source: "source",
    th_s: "Statement", th_you: "You", th_party: "Party says", th_did: "Party did", th_basis: "Basis",
    pa: "agrees", pn: "disagrees", p0: "neutral", pu: "unknown",
    did_same: "consistent", did_against: "the opposite", did_traded: "gave it up in coalition talks",
    ya: ["strongly yes", "somewhat yes", "not sure", "somewhat no", "strongly no"], yskip: "skipped",
    b_party: "party's 2025 answer", b_editors: "filled in by editors, 2025", b_news: "news reports", flipped: "from a statement worded the opposite way",
    uncoded: "Parties not yet coded",
    save_h: "Save answers for research", save_c: "I agree that my calculator answers are stored anonymously for research.",
    save_b: "Save my answers", again: "Start again", to_survey: "Continue to the survey: how should Czechia be governed"
  }
};
const t = makeT(P);
const DUMMY = 5, TIE = 7;
const S = { view: "intro", i: 0, answers: {}, star: {}, weight: 50, consent: false, saved: false };
let D, draw;

/** A party's position on one statement, blended between what it says and what it did. */
export function effective(p, w) { return p.acted ? (1 - w) * p.v + w * p.acted.v : p.v; }
export function score(party, answers, weight) {
  const w = weight / 100;
  let sum = 0, tot = 0, n = 0;
  for (const [sid, a] of Object.entries(answers)) {
    const p = party.positions[sid];
    if (!p || (p.v === 0 && !p.acted)) continue;
    const wt = a.imp ? 2 : 1;
    sum += wt * (1 - Math.abs(a.a / 2 - effective(p, w)) / 2);
    tot += wt; n++;
  }
  return { pct: 100 * (sum + DUMMY * 0.5) / (tot + DUMMY), n };
}

function vIntro() {
  return [el("h1", {}, t("h")), el("div", { class: "card" }, el("p", {}, t("p")), el("div", { class: "row" }, btn(t("start"), () => { S.view = "q"; S.i = 0; draw(); }, "primary"))),
    el("div", { class: "note" }, t("warn")),
    el("p", { class: "small muted" }, T[lang].research, " ", privacyLink())];
}

function vQuestion() {
  const st = D.statements, s = st[S.i], cur = S.answers[s.id];
  const step = d => { S.i += d; if (S.i >= st.length) { S.i = st.length - 1; S.view = "result"; } draw(); window.scrollTo(0, 0); };
  const answer = v => { S.answers[s.id] = { a: v, imp: !!S.star[s.id] }; S.saved = false; step(1); };
  const imp = el("input", { type: "checkbox", checked: !!S.star[s.id], onchange: e => { S.star[s.id] = e.target.checked; if (S.answers[s.id]) S.answers[s.id].imp = e.target.checked; } });
  return [
    el("p", { class: "muted small" }, `${S.i + 1} ${t("of")} ${st.length}`),
    el("div", { class: "progress" }, el("i", { style: `width:${100 * S.i / st.length}%` })),
    el("div", { class: "card" }, el("p", { class: "statement" }, s[lang]), info(s),
      el("div", { class: "scale" }, [2, 1, 0, -1, -2].map((v, i) => btn(t("scale")[i], () => answer(v), cur && cur.a === v ? "on" : ""))),
      el("p", {}, el("label", { class: "check small" }, imp, t("important"))),
      el("div", { class: "row" }, S.i > 0 ? btn(t("back"), () => step(-1)) : el("span"),
        el("span", {}, btn(t("skip"), () => { delete S.answers[s.id]; step(1); }), " ",
          S.i === st.length - 1 ? btn(t("finish"), () => { S.view = "result"; draw(); }, "primary") : (cur ? btn(t("next"), () => step(1)) : null))))
  ];
}

const posLabel = v => el("span", { class: v > 0 ? "pos-a" : v < 0 ? "pos-n" : "pos-0" }, v > 0 ? t("pa") : v < 0 ? t("pn") : t("p0"));
function basis(p) {
  if (!p) return "";
  if (p.basis === "news") return el("a", { href: p.url, target: "_blank", rel: "noopener" }, t("b_news"));
  return [p.filled_by === "editors" ? t("b_editors") : t("b_party"), p.flipped ? el("span", { class: "muted" }, " · " + t("flipped")) : null];
}
function did(p) {
  if (!p || !p.acted) return "";
  const a = p.acted, label = a.kind === "traded" ? t("did_traded") : a.v === p.v ? t("did_same") : t("did_against");
  return [el("span", { class: a.v === p.v ? "pos-a" : "pos-n" }, label), el("div", { class: "muted" }, a[lang], a.url ? [" (", el("a", { href: a.url, target: "_blank", rel: "noopener" }, t("source")), ")"] : null)];
}

function ranking() {
  const order = S.order || (S.order = Object.fromEntries(D.parties.parties.map(p => [p.id, Math.random()])));
  return D.parties.parties.map(p => ({ p, ...score(p, S.answers, S.weight) }))
    .sort((a, b) => (Math.round(b.pct) - Math.round(a.pct)) || (order[a.p.id] - order[b.p.id]));
}

function vResult() {
  if (!Object.keys(S.answers).length) return [el("h1", {}, t("res_h")), el("div", { class: "card" }, el("p", {}, t("none")), btn(t("start"), () => { S.view = "q"; S.i = 0; draw(); }, "primary"))];
  const you = sid => S.answers[sid] ? t("ya")[[2, 1, 0, -1, -2].indexOf(S.answers[sid].a)] + (S.answers[sid].imp ? " ★" : "") : t("yskip");
  const all = D.parties.parties.flatMap(p => Object.values(p.positions)).filter(p => p.acted);
  const list = el("div", { class: "card" });
  const tieNote = el("p", { class: "small muted" });
  const paint = () => {
    const rows = ranking(), top = Math.round(rows[0].pct);
    const anyTie = rows.filter(r => top - Math.round(r.pct) < TIE).length > 1;
    tieNote.textContent = anyTie ? t("tie_note") : "";
    list.replaceChildren(...rows.map(r => el("div", { class: "party" },
      el("div", { class: "party-head" },
        el("div", {}, el("span", { class: "party-name" }, r.p.name), anyTie && top - Math.round(r.pct) < TIE ? el("span", { class: "tag tie" }, t("tie")) : null, el("span", { class: "tag" }, fmt(t("based"), { n: r.n }))),
        el("div", { class: "pct" }, Math.round(r.pct) + " %"),
        el("div", { class: "bar" }, el("i", { style: `width:${r.pct}%;background:${r.p.color}` }))),
      el("details", {}, el("summary", {}, t("record")), el("ul", { class: "record" }, r.p.record.map(f => el("li", {}, f[lang], f.url ? [" (", el("a", { href: f.url, target: "_blank", rel: "noopener" }, t("source")), ")"] : null)))),
      el("details", {}, el("summary", {}, t("compare")),
        el("div", { class: "scroll" }, el("table", {}, el("thead", {}, el("tr", {}, [t("th_s"), t("th_you"), t("th_party"), t("th_did"), t("th_basis")].map(h => el("th", {}, h)))),
          el("tbody", {}, D.statements.map(s => { const p = r.p.positions[s.id]; return el("tr", {}, el("td", {}, s[lang]), el("td", {}, you(s.id)),
            el("td", {}, p ? posLabel(p.v) : el("span", { class: "pos-0" }, t("pu"))), el("td", { class: "small" }, did(p)), el("td", { class: "small" }, basis(p))); }))))))));
  };
  paint();
  const out = el("output", { class: "small muted" }, S.weight + " %");
  const slider = el("input", { type: "range", min: 0, max: 100, step: 10, value: S.weight, "aria-label": t("sl_h"),
    oninput: e => { S.weight = +e.target.value; out.textContent = S.weight + " %"; S.saved = false; paint(); } });
  return [
    el("h1", {}, t("res_h")), el("p", {}, t("res_p")),
    el("div", { class: "card" }, el("strong", {}, t("sl_h")), el("div", { class: "slider" }, el("span", { class: "small" }, t("sl_l")), slider, el("span", { class: "small" }, t("sl_r")), out),
      el("p", { class: "small muted" }, fmt(t("sl_p"), { n: all.length, c: all.filter(p => p.acted.v !== p.v).length }))),
    list, tieNote,
    el("div", { class: "card small" }, el("strong", {}, t("uncoded")), el("ul", { class: "record" }, D.parties.uncoded.map(u => el("li", {}, u.name + ": " + u[lang])))),
    el("div", { class: "note" }, t("warn")),
    vSave()
  ];
}

function vSave() {
  const status = el("span", { class: "small muted", role: "status" }, S.saved ? t("saved") : "");
  const save = btn(t("save_b"), async () => {
    save.disabled = true; status.textContent = t("saving");
    try {
      await api("calculator", { method: "POST", body: { consent: true, respondent: respondentId(true), lang, answers: S.answers, record_weight: S.weight } });
      S.saved = true; status.textContent = t("saved");
    } catch { save.disabled = false; status.textContent = t("err"); }
  }, "primary");
  save.disabled = !S.consent || S.saved;
  return el("div", { class: "card" }, el("h2", { style: "margin-top:0" }, t("save_h")),
    el("label", { class: "check" }, el("input", { type: "checkbox", checked: S.consent, onchange: e => { S.consent = e.target.checked; save.disabled = !S.consent || S.saved; } }), t("save_c")),
    el("p", { class: "small muted" }, T[lang].consent_note, " ", privacyLink()),
    el("div", { class: "row" }, btn(t("again"), () => { Object.assign(S, { view: "q", i: 0, answers: {}, star: {}, saved: false }); draw(); }), el("span", {}, status, " ", save)),
    el("p", {}, el("a", { href: "/pruzkum" }, t("to_survey") + " →")));
}

if (typeof document !== "undefined") {
  draw = mount(async () => {
    if (!D) D = await loadData("statements", "parties");
    return S.view === "intro" ? vIntro() : S.view === "q" ? vQuestion() : vResult();
  });
}

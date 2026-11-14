// Questionnaire 1: 25 statements, the match with each party, and the "said vs did" slider.
import { T, lang, makeT, fmt, el, btn, info, privacyLink, loadData, api, respondentId, mount } from "./common.js";

const P = {
  cs: {
    h: "Která strana je vám nejblíž?", p: "Porovnejte své názory s tím, co strany říkají, a s tím, co skutečně udělaly. Zabere to asi pět minut.",
    steps: [["Odpovězte na 25 výroků", "U každého zvolíte, jak moc souhlasíte. Výrok můžete přeskočit."], ["Označte, na čem vám záleží", "Důležité výroky se do shody počítají dvakrát."], ["Podívejte se na shodu", "U každé strany uvidíte shodu, doložené kroky ve vládě a srovnání výrok po výroku."]],
    kbd: "Odpovídat lze i klávesami", skip_note: "Přeskočený výrok se do shody nepočítá. K odpovědi se můžete vrátit tlačítkem Zpět.",
    read_h: "Jak výsledek číst", read: ["Shoda 100 % znamená, že se u všech započtených výroků shodnete. Shoda 0 % znamená opak.", "Každá strana začíná na 50 % díky pěti pomyslným výrokům s poloviční shodou. Strana s málo známými postoji tak nemůže náhodou vyhrát.", "Štítek u strany říká, z kolika vašich odpovědí se shoda počítá. Čím méně jich je, tím méně je číslo spolehlivé."],
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
    did_same: "v souladu", did_against: "opak", did_traded: "ustoupila při vyjednávání o vládě", did_open: "slib zatím odložen", did_for: "jednala pro", did_anti: "jednala proti",
    ya: ["rozhodně ano", "spíše ano", "nevím", "spíše ne", "rozhodně ne"], yskip: "přeskočeno",
    b_party: "odpověď strany 2025", b_editors: "doplněno editory 2025", b_news: "zprávy v médiích", flipped: "z opačně položeného výroku",
    uncoded: "Zatím nezakódované strany",
    save_h: "Uložit odpovědi pro výzkum", save_b: "Uložit mé odpovědi pro výzkum",
    done_h: "Hotovo. Jak chcete výsledek zobrazit?", done_p: "Odpověděli jste na {n} z 25 výroků.",
    done_save: "Zobrazit výsledek a uložit odpovědi", done_nosave: "Zobrazit výsledek bez uložení",
    done_consent: "Kliknutím na „Zobrazit výsledek a uložit odpovědi“ souhlasíte s tím, že se vaše odpovědi anonymně uloží pro výzkum a započítají do veřejných součtů.",
    saved_h: "Vaše odpovědi jsou uloženy pro výzkum", saved_p: "Smazat je můžete kdykoli na stránce Jak to funguje.",
    unsaved_p: "Vaše odpovědi zatím uloženy nejsou. Kliknutím na tlačítko souhlasíte s jejich anonymním uložením pro výzkum.", again: "Vyplnit znovu", to_survey: "Pokračovat na průzkum: jak má být Česko spravováno"
  },
  en: {
    h: "Which party is closest to you?", p: "Compare your views with what parties say and with what they actually did. It takes about five minutes.",
    steps: [["Answer 25 statements", "For each one you choose how much you agree. You can skip a statement."], ["Mark what matters to you", "Important statements count twice in the match."], ["Look at the match", "For each party you see the match, documented steps in government and a statement-by-statement comparison."]],
    kbd: "You can also answer with the keys", skip_note: "A skipped statement does not count in the match. Use Back to return to an answer.",
    read_h: "How to read the result", read: ["A 100% match means you agree on every counted statement. A 0% match means the opposite.", "Every party starts at 50% because of five imaginary statements with a half match. A party with few known positions therefore cannot win by chance.", "The label next to a party says how many of your answers the match is based on. The fewer there are, the less reliable the number."],
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
    did_same: "consistent", did_against: "the opposite", did_traded: "gave it up in coalition talks", did_open: "pledge postponed so far", did_for: "acted for", did_anti: "acted against",
    ya: ["strongly yes", "somewhat yes", "not sure", "somewhat no", "strongly no"], yskip: "skipped",
    b_party: "party's 2025 answer", b_editors: "filled in by editors, 2025", b_news: "news reports", flipped: "from a statement worded the opposite way",
    uncoded: "Parties not yet coded",
    save_h: "Save answers for research", save_b: "Save my answers for research",
    done_h: "Done. How do you want to see the result?", done_p: "You answered {n} of 25 statements.",
    done_save: "Show my result and save my answers", done_nosave: "Show my result without saving",
    done_consent: "By clicking “Show my result and save my answers” you agree that your answers are stored anonymously for research and counted in the public totals.",
    saved_h: "Your answers are saved for research", saved_p: "You can delete them at any time on the How it works page.",
    unsaved_p: "Your answers are not saved yet. By clicking the button you agree to their anonymous storage for research.", again: "Start again", to_survey: "Continue to the survey: how should Czechia be governed"
  }
};
const t = makeT(P);
const DUMMY = 5, TIE = 7;
const S = { view: "intro", i: 0, answers: {}, star: {}, weight: 50, consent: false, saved: false, failed: false };
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
  return [el("h1", {}, t("h")), el("p", { class: "lead" }, t("p")),
    el("div", { class: "card" }, el("ol", { class: "steps" }, t("steps").map(([a, b]) => el("li", {}, el("div", {}, el("strong", {}, a), el("span", {}, b))))),
      el("div", { class: "row" }, el("span"), btn(t("start"), () => { S.view = "q"; S.i = 0; draw(); }, "primary"))),
    el("div", { class: "note" }, t("warn")),
    el("p", { class: "small muted" }, T[lang].research, " ", privacyLink())];
}

function vQuestion() {
  const st = D.statements, s = st[S.i], cur = S.answers[s.id];
  const step = d => { S.i += d; if (S.i >= st.length) { S.i = st.length - 1; S.view = "done"; } draw(); window.scrollTo(0, 0); };
  const answer = v => { S.answers[s.id] = { a: v, imp: !!S.star[s.id] }; S.saved = false; step(1); };
  const imp = el("input", { type: "checkbox", checked: !!S.star[s.id], onchange: e => { S.star[s.id] = e.target.checked; if (S.answers[s.id]) S.answers[s.id].imp = e.target.checked; } });
  return [
    el("p", { class: "muted small" }, `${S.i + 1} ${t("of")} ${st.length}`),
    el("div", { class: "progress" }, el("i", { style: `width:${100 * S.i / st.length}%` })),
    el("div", { class: "card" }, el("p", { class: "statement" }, s[lang]), info(s),
      el("div", { class: "scale" }, [2, 1, 0, -1, -2].map((v, i) => btn(t("scale")[i], () => answer(v), ["a2", "a1", "a0", "d1", "d2"][i] + (cur && cur.a === v ? " on" : "")))),
      el("p", { class: "small muted kbd-hint" }, t("kbd"), " ", [1, 2, 3, 4, 5].map(n => [el("kbd", {}, n), " "])),
      el("p", {}, el("label", { class: "check small" }, imp, t("important"))),
      el("div", { class: "row" }, S.i > 0 ? btn(t("back"), () => step(-1)) : el("span"),
        el("span", {}, btn(t("skip"), () => { delete S.answers[s.id]; step(1); }), " ",
          S.i === st.length - 1 ? btn(t("finish"), () => { S.view = "done"; draw(); window.scrollTo(0, 0); }, "primary") : (cur ? btn(t("next"), () => step(1)) : null)))),
    el("p", { class: "hint" }, t("skip_note"))
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
  const a = p.acted, label = a.kind === "traded" ? t("did_traded") : a.kind === "open" ? t("did_open") : !p.v ? (a.v > 0 ? t("did_for") : t("did_anti")) : a.v === p.v ? t("did_same") : t("did_against");
  return [el("span", { class: a.v === p.v || !p.v ? "pos-a" : "pos-n" }, label), el("div", { class: "muted" }, a[lang], a.url ? [" (", el("a", { href: a.url, target: "_blank", rel: "noopener" }, t("source")), ")"] : null)];
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
  list.classList.add("grow");
  setTimeout(() => list.classList.remove("grow"), 900);
  const out = el("output", { class: "small" }, S.weight + " %");
  const slider = el("input", { type: "range", min: 0, max: 100, step: 10, value: S.weight, "aria-label": t("sl_h"),
    oninput: e => { S.weight = +e.target.value; out.textContent = S.weight + " %"; paint(); if (S.consent) resaveSoon(() => vSave.update && vSave.update()); } });
  return [
    el("h1", {}, t("res_h")), el("p", { class: "lead" }, t("res_p")),
    el("details", { class: "info" }, el("summary", {}, t("read_h")), t("read").map(x => el("p", { class: "small" }, x))),
    el("div", { class: "card" }, el("strong", {}, t("sl_h")), el("div", { class: "slider" }, el("span", { class: "small" }, t("sl_l")), slider, el("span", { class: "small" }, t("sl_r")), out),
      el("p", { class: "small muted" }, fmt(t("sl_p"), { n: all.length, c: all.filter(p => p.acted.v !== p.v).length }))),
    list, tieNote,
    el("div", { class: "card small" }, el("strong", {}, t("uncoded")), el("ul", { class: "record" }, D.parties.uncoded.map(u => el("li", {}, u.name + ": " + u[lang])))),
    el("div", { class: "note" }, t("warn")),
    vSave()
  ];
}

/** Sends the answers. Called only after the person clicked a button that states the consent. */
async function saveNow() {
  S.consent = true;
  try {
    await api("calculator", { method: "POST", body: { consent: true, respondent: respondentId(true), lang, answers: S.answers, record_weight: S.weight } });
    S.saved = true; S.failed = false;
  } catch { S.saved = false; S.failed = true; }
}
let resaveTimer;
/** After consent, a moved slider is stored too, a moment after the person stops moving it. */
function resaveSoon(update) { clearTimeout(resaveTimer); resaveTimer = setTimeout(async () => { await saveNow(); update(); }, 800); }

function vDone() {
  const n = Object.keys(S.answers).length;
  if (!n) { S.view = "result"; return vResult(); }
  const status = el("span", { class: "small muted", role: "status" });
  const show = () => { S.view = "result"; draw(); window.scrollTo(0, 0); };
  const save = btn(t("done_save"), async () => { save.disabled = true; status.textContent = T[lang].saving; await saveNow(); show(); }, "primary");
  return [el("h1", {}, t("done_h")), el("p", { class: "lead" }, fmt(t("done_p"), { n })),
    el("div", { class: "card" },
      el("p", {}, t("done_consent")),
      el("p", { class: "small muted" }, T[lang].consent_note, " ", privacyLink()),
      el("div", { class: "row" }, btn(t("back"), () => { S.view = "q"; draw(); }), el("span", {}, status, " ", save)),
      el("p", {}, btn(t("done_nosave"), show, "link")))];
}

function vSave() {
  const box = el("div", { class: "card" });
  const paint = () => {
    const again = btn(t("again"), () => { Object.assign(S, { view: "q", i: 0, answers: {}, star: {}, saved: false, consent: false, failed: false, order: null }); draw(); });
    const save = btn(t("save_b"), async () => { save.disabled = true; await saveNow(); paint(); }, "primary");
    box.replaceChildren(
      el("h2", { style: "margin-top:0" }, S.saved ? t("saved_h") : t("save_h")),
      el("p", { role: "status" }, S.saved ? t("saved_p") : S.failed ? T[lang].err : t("unsaved_p")),
      S.saved ? null : el("p", { class: "small muted" }, T[lang].consent_note, " ", privacyLink()),
      el("div", { class: "row" }, again, S.saved ? el("span") : save),
      el("p", {}, el("a", { href: "/pruzkum" }, t("to_survey"))));
  };
  paint();
  vSave.update = paint;
  return box;
}

if (typeof document !== "undefined") {
  document.addEventListener("keydown", e => {
    if (S.view !== "q" || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const k = "12345".indexOf(e.key);
    if (k < 0) return;
    const b = document.querySelectorAll(".scale button")[k];
    if (b) b.click();
  });
  draw = mount(async () => {
    if (!D) D = await loadData("statements", "parties");
    return S.view === "intro" ? vIntro() : S.view === "q" ? vQuestion() : S.view === "done" ? vDone() : vResult();
  });
}

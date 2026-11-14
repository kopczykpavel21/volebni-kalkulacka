// Questionnaire 2: how the country should be governed. Works on its own; links to the
// calculator answers through the same random respondent id when both are saved.
import { T, lang, makeT, fmt, el, btn, info, privacyLink, loadData, api, respondentId, mount } from "./common.js";

const P = {
  cs: {
    h: "Jak má být Česko spravováno?", p: "25 otázek o tom, co má ve správě státu zůstat a co se změnit. Zabere to asi deset minut.",
    steps: [["Zůstat, nebo změnit", "U každé otázky nejdřív uvidíte, co platí dnes."], ["Při změně vyberte směr", "Můžete také krátce napsat proč."], ["Otázky můžete vynechat", "Odešlou se jen ty, na které odpovíte."]],
    blank: "Žádná otázka není povinná. Odpovědi se odešlou až na konci tlačítkem Odeslat odpovědi.", part: "Část {a} z {b}",
    consent: "Kliknutím na „Odeslat odpovědi“ souhlasíte s tím, že se vaše odpovědi anonymně uloží pro výzkum a započítají do veřejných součtů.",
    intro_note: "Dokud na konci nekliknete na „Odeslat odpovědi“, nic se neukládá ani neodesílá.",
    now: "Dnes platí", ask: "Má to tak zůstat?", how: "Jak?", why: "Proč? (nepovinné)", pick_n: "Vyberte nejvýše {n}.",
    bg_h: "O vás (nepovinné)", bg_p: "Tyto údaje pomáhají přepočítat výsledky tak, aby lépe odpovídaly celé populaci.",
    choose: "– nevybráno –", submit: "Odeslat odpovědi", thanks_h: "Děkujeme", thanks_p: "Odpovědi byly uloženy.",
    see: "Zobrazit výsledky", to_calc: "Vyplnit také kalkulačku", empty: "Odpovězte aspoň na jednu otázku."
  },
  en: {
    h: "How should Czechia be governed?", p: "25 questions about what should stay and what should change in how the country is run. It takes about ten minutes.",
    steps: [["Keep or change", "For each question you first see what applies today."], ["For a change, pick a direction", "You can also say briefly why."], ["You may leave questions out", "Only the ones you answer are sent."]],
    blank: "No question is required. Answers are sent only at the end, with the Submit answers button.", part: "Part {a} of {b}",
    consent: "By clicking “Submit answers” you agree that your answers are stored anonymously for research and counted in the public totals.",
    intro_note: "Nothing is stored or sent until you click “Submit answers” at the end.",
    now: "Today", ask: "Should it stay this way?", how: "How?", why: "Why? (optional)", pick_n: "Choose up to {n}.",
    bg_h: "About you (optional)", bg_p: "These details help reweight the results so they better reflect the whole population.",
    choose: "– not selected –", submit: "Submit answers", thanks_h: "Thank you", thanks_p: "Your answers were stored.",
    see: "See the results", to_calc: "Take the calculator too", empty: "Answer at least one question."
  }
};
const t = makeT(P);
const BLOCKS = ["A", "B", "C", "D", "E", "bg"];
const S = { view: "intro", block: 0, answers: {}, bg: {} };
let D, draw;
const opts = q => (q.opts ? D.survey[q.opts][lang] : q[lang].o);

function vQuestion(q) {
  const a = S.answers[q.id] || (S.answers[q.id] = {});
  const box = el("div", { class: "q" });
  const paint = () => {
    const kc = q.type === "kc";
    box.replaceChildren(...[kc ? el("div", { class: "small muted" }, `${q.id}. ${t("now")}:`) : null,
      el("div", { class: "stem" }, kc ? q[lang].q : `${q.id}. ${q[lang].q}`), info(q)].filter(Boolean));
    if (kc) {
      box.append(el("div", { class: "small", style: "margin:.5rem 0 .3rem" }, t("ask")),
        el("div", { class: "opts" }, ["keep", "change", "unsure"].map(c => btn(t(c), () => { a.choice = a.choice === c ? undefined : c; if (a.choice !== "change") delete a.dir; paint(); }, a.choice === c ? "on" : ""))));
      if (a.choice === "change") box.append(el("div", { class: "dirs" }, el("span", { class: "small muted" }, t("how")),
        q[lang].o.map((o, i) => el("label", { class: "check" }, el("input", { type: "radio", name: "d" + q.id, checked: a.dir === i, onchange: () => { a.dir = i; } }), o))));
      if (a.choice) box.append(el("textarea", { maxlength: 300, placeholder: t("why"), "aria-label": t("why"), oninput: e => { a.why = e.target.value; } }, a.why || ""));
    } else if (q.type === "pick" || q.type === "single") {
      const max = q.max || 1; a.picks = a.picks || [];
      if (max > 1) box.append(el("p", { class: "small muted" }, fmt(t("pick_n"), { n: max })));
      box.append(el("div", { class: "opts" }, opts(q).map((o, i) => btn(o, () => {
        if (a.picks.includes(i)) a.picks = a.picks.filter(x => x !== i);
        else if (max === 1) a.picks = [i];
        else if (a.picks.length < max) a.picks.push(i);
        paint();
      }, a.picks.includes(i) ? "on" : ""))));
    } else {
      a.texts = a.texts || ["", ""];
      q[lang].o.forEach((o, i) => box.append(el("label", { class: "small" }, o, el("textarea", { maxlength: 300, oninput: e => { a.texts[i] = e.target.value; } }, a.texts[i]))));
    }
  };
  paint();
  return box;
}

function vIntro() {
  return [el("h1", {}, t("h")), el("p", { class: "lead" }, t("p")), el("div", { class: "card" },
    el("ol", { class: "steps" }, t("steps").map(([a, b]) => el("li", {}, el("div", {}, el("strong", {}, a), el("span", {}, b))))),
    el("div", { class: "row" }, el("span"), btn(t("start"), () => { S.view = "form"; S.block = 0; draw(); }, "primary"))),
    el("p", { class: "hint" }, t("intro_note") + " ", privacyLink())];
}

function vForm() {
  const b = BLOCKS[S.block], last = S.block === BLOCKS.length - 1;
  const status = el("span", { class: "small muted", role: "status" });
  const move = d => { S.block += d; draw(); window.scrollTo(0, 0); };
  const fwd = btn(last ? t("submit") : t("next"), async () => {
    if (!last) return move(1);
    const filled = Object.values(S.answers).some(a => a.choice || (a.picks && a.picks.length) || (a.texts && a.texts.some(x => x.trim())));
    if (!filled) { status.textContent = t("empty"); return; }
    fwd.disabled = true; status.textContent = t("saving");
    try {
      await api("survey", { method: "POST", body: { consent: true, respondent: respondentId(true), lang, answers: S.answers, background: S.bg } });
      Object.assign(S, { view: "thanks", answers: {}, bg: {}, block: 0 }); draw(); window.scrollTo(0, 0);
    } catch { fwd.disabled = false; status.textContent = t("err"); }
  }, "primary");
  const body = b === "bg"
    ? [el("h2", {}, t("bg_h")), el("p", { class: "muted" }, t("bg_p")), D.survey.background.map(g => el("div", { class: "q" }, el("label", { class: "stem" }, g[lang].q,
        el("select", { onchange: e => { if (e.target.value === "") delete S.bg[g.id]; else S.bg[g.id] = +e.target.value; } },
          el("option", { value: "" }, t("choose")), g[lang].o.map((o, i) => el("option", { value: i, selected: S.bg[g.id] === i }, o))))))]
    : [el("h2", {}, `${b}. ${D.survey.blocks[b][lang]}`), D.survey.questions.filter(q => q.block === b).map(vQuestion)];
  return [el("h1", {}, t("h")), el("p", { class: "muted small" }, fmt(t("part"), { a: S.block + 1, b: BLOCKS.length })),
    el("div", { class: "progress" }, el("i", { style: `width:${100 * (S.block + 1) / BLOCKS.length}%` })),
    S.block === 0 ? el("p", { class: "hint" }, t("blank")) : null,
    el("div", { class: "card" }, body,
      last ? [el("p", { style: "margin-top:1.2rem" }, t("consent")), el("p", { class: "small muted" }, T[lang].consent_note, " ", privacyLink())] : null,
      el("div", { class: "row" }, btn(t("back"), () => { if (S.block > 0) move(-1); else { S.view = "intro"; draw(); } }), el("span", {}, status, " ", fwd)))];
}

function vThanks() {
  return [el("h1", {}, t("thanks_h")), el("div", { class: "card" }, el("p", {}, t("thanks_p")),
    el("div", { class: "row" }, el("a", { href: "/" }, t("to_calc")), el("a", { href: "/vysledky" }, t("see") + " →")))];
}

draw = mount(async () => {
  if (!D) D = await loadData("survey");
  return S.view === "intro" ? vIntro() : S.view === "form" ? vForm() : vThanks();
});

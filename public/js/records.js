// Every statement with what parties say, what they did, and the source of each record.
import { lang, makeT, fmt, el, loadData, mount } from "./common.js";

const P = {
  cs: {
    h: "Záznamy a zdroje", p: "U každého výroku najdete, co strany říkají, co udělaly a odkud každý údaj pochází.",
    sum: "{n} záznamů k {s} výrokům. Do shody se započítává {a} z nich, ostatní jsou jen poznámky.",
    how: "Do shody se počítá vždy nejnovější spolehlivý záznam strany. Hlasování o rozsáhlých zákonech, nejisté záznamy a sliby zablokované koaličním partnerem jsou jen poznámky.",
    says: "Co strany říkají", did: "Co strany udělaly", none: "K tomuto výroku zatím není žádný záznam o hlasování ani o kroku vlády.",
    party: "Strana", pos: "Postoj", basis: "Podklad", src: "zdroj", counts: "{a} pro, {n} proti, {z} se zdrželo, {x} nepřítomno",
    pa: "souhlasí", pn: "nesouhlasí", p0: "neutrální", pu: "neznámé",
    b_party: "odpověď strany ve Volební kalkulačce 2025", b_editors: "doplnili editoři Volební kalkulačky 2025", b_news: "zpráva v médiích", b_none: "bez podkladu",
    kind: { vote: "hlasování", gov: "krok vlády", open: "slib odložen nebo změkčen", blocked: "zablokováno partnerem", traded: "ústupek při vyjednávání" },
    eff: { "1": "jednala pro výrok", "-1": "jednala proti výroku", "0": "půl cesty", "null": "bez jasného postoje" },
    used: "počítá se do shody", note: "jen poznámka", conf: { high: "jistota vysoká", medium: "jistota střední", low: "jistota nízká" }
  },
  en: {
    h: "Records and sources", p: "For every statement you can see what parties say, what they did, and where each item comes from.",
    sum: "{n} records for {s} statements. {a} of them count in the match; the rest are notes.",
    how: "The match always uses a party's newest reliable record. Votes on large bills, uncertain records and pledges blocked by a coalition partner are notes only.",
    says: "What parties say", did: "What parties did", none: "There is no record of a vote or a government step for this statement yet.",
    party: "Party", pos: "Position", basis: "Basis", src: "source", counts: "{a} for, {n} against, {z} abstained, {x} absent",
    pa: "agrees", pn: "disagrees", p0: "neutral", pu: "unknown",
    b_party: "the party's answer in Volební kalkulačka 2025", b_editors: "filled in by the editors of Volební kalkulačka 2025", b_news: "news report", b_none: "no basis",
    kind: { vote: "vote", gov: "government step", open: "pledge postponed or softened", blocked: "blocked by a partner", traded: "given up in coalition talks" },
    eff: { "1": "acted for the statement", "-1": "acted against the statement", "0": "half way", "null": "no clear side" },
    used: "counts in the match", note: "note only", conf: { high: "high certainty", medium: "medium certainty", low: "low certainty" }
  }
};
const t = makeT(P);
let D;
const day = s => lang === "cs" ? `${+s.slice(8)}. ${+s.slice(5, 7)}. ${s.slice(0, 4)}` : s;
const link = (url, label) => url ? el("a", { href: url, target: "_blank", rel: "noopener" }, label) : null;

function stated(s) {
  return el("div", { class: "scroll" }, el("table", {}, el("thead", {}, el("tr", {}, [t("party"), t("pos"), t("basis")].map(h => el("th", {}, h)))),
    el("tbody", {}, D.parties.parties.map(p => {
      const x = p.positions[s.id];
      const pos = !x || x.basis === "none" ? el("span", { class: "pos-0" }, t("pu")) : el("span", { class: x.v > 0 ? "pos-a" : x.v < 0 ? "pos-n" : "pos-0" }, x.v > 0 ? t("pa") : x.v < 0 ? t("pn") : t("p0"));
      const basis = !x || x.basis === "none" ? t("b_none") : x.basis === "news" ? link(x.url, t("b_news")) : link("https://www.volebnikalkulacka.cz/", x.filled_by === "editors" ? t("b_editors") : t("b_party"));
      return el("tr", {}, el("td", {}, p.name), el("td", {}, pos), el("td", { class: "small" }, basis));
    }))));
}
function record(r) {
  const c = r.counts;
  return el("li", {},
    el("strong", {}, r.party), " · ", day(r.date), " · ", t("kind")[r.kind] || r.kind, el("br"),
    lang === "en" && r.what_en ? r.what_en : r.what, c ? [" (", fmt(t("counts"), { a: c.ano, n: c.ne, z: c.zdrzel, x: c.nepritomen }), ")"] : null, ". ",
    el("span", { class: r.v > 0 ? "pos-a" : r.v < 0 ? "pos-n" : "pos-0" }, t("eff")[String(r.v)]), " ",
    el("span", { class: "tag" }, r.applied ? t("used") : t("note")), el("span", { class: "tag" }, t("conf")[r.confidence]),
    r.note && lang === "cs" ? el("div", { class: "muted small" }, r.note) : null,
    el("div", { class: "small" }, link(r.source, t("src") + ": " + new URL(r.source).hostname.replace(/^www\./, ""))));
}

mount(async () => {
  if (!D) D = await loadData("statements", "parties", "records");
  const R = D.records;
  return [el("h1", {}, t("h")), el("p", { class: "lead" }, t("p")),
    el("p", {}, fmt(t("sum"), { n: R.length, s: new Set(R.map(r => r.statement)).size, a: R.filter(r => r.applied).length })),
    el("p", { class: "hint" }, t("how")),
    D.statements.map(s => {
      const rs = R.filter(r => r.statement === s.id);
      return el("div", { class: "card", id: "v" + s.id }, el("h2", { style: "margin-top:0" }, `${s.id}. ${s[lang]}`),
        el("details", {}, el("summary", {}, t("says")), stated(s)),
        el("details", { open: rs.length > 0 && rs.length <= 12 }, el("summary", {}, `${t("did")} (${rs.length})`),
          rs.length ? el("ul", { class: "record" }, rs.map(record)) : el("p", { class: "muted small" }, t("none"))));
    })];
});

import { lang, makeT, el, btn, api, respondentId, forgetRespondent, mount } from "./common.js";

const P = {
  cs: {
    h: "Jak to funguje",
    m: [
      ["Dva dotazníky", "Kalkulačka porovná vaše odpovědi s postoji stran. Průzkum se ptá, co má ve správě státu zůstat a co se změnit. Každý lze vyplnit samostatně."],
      ["Shoda se stranou", "Každá vaše odpověď se převede na číslo od −1 (rozhodně ne) do +1 (rozhodně ano). Postoj strany je +1 nebo −1. Shoda u jednoho výroku je 1 − |rozdíl| / 2. Důležité výroky se počítají dvakrát."],
      ["Co strany říkají a co udělaly", "U některých výroků je doloženo, jak strana hlasovala nebo co udělala ve vládě. Posuvník určuje, zda se má počítat postoj, který strana uvádí (0 %), nebo to, co udělala (100 %). Uprostřed se obojí průměruje. Když strana od slibu ustoupila při vyjednávání o vládě, počítá se to jako polovina cesty k opaku. Kde doklad chybí, posuvník nic nemění."],
      ["Chybějící postoje", "Cílem je najít postoj každé strany v jejím programu, slibech a hlasování. V prototypu to hotové není, a i potom zůstanou mezery. Výrok s neznámým postojem se pro danou stranu nepočítá. Aby strana se třemi známými postoji neskončila se 100 %, přidává se každé straně pět pomyslných výroků s poloviční shodou."],
      ["Těsné výsledky", "Rozdíl pod 7 bodů označujeme jako prakticky stejnou shodu. Pořadí stran se stejnou shodou je náhodné."],
      ["Data o stranách", "Postoje jsou předběžné: pocházejí z odpovědí stran v kalkulačkách 2025 (u ANO a Stačilo! je doplnili editoři), ze záznamů hlasování a z několika zpráv."],
      ["Co se ukládá", "Jen po vašem souhlasu: náhodný kód, odpovědi, jazyk a datum. Neukládá se jméno, e-mail, IP adresa ani přesný čas. Veřejně se zobrazují jen součty; vlastní texty vidí pouze správce."]
    ],
    del_h: "Smazat mé odpovědi", del_p: "Smaže vše, co je uloženo pod kódem v tomto prohlížeči.", del_b: "Smazat", del_ok: "Smazáno.", del_none: "V tomto prohlížeči není uložen žádný kód.", del_err: "Smazání se nepodařilo."
  },
  en: {
    h: "How it works",
    m: [
      ["Two questionnaires", "The calculator compares your answers with party positions. The survey asks what should stay and what should change in how the country is run. Each can be completed on its own."],
      ["Match with a party", "Each of your answers becomes a number from −1 (strongly no) to +1 (strongly yes). A party's position is +1 or −1. The match on one statement is 1 − |difference| / 2. Important statements count twice."],
      ["What parties say and what they did", "For some statements there is a record of how the party voted or what it did in government. The slider decides whether the position the party states (0%) or what it did (100%) is used. In the middle the two are averaged. When a party gave up a pledge in coalition talks, that counts as half way to the opposite. Where no record exists, the slider changes nothing."],
      ["Missing positions", "The aim is to find every party's position in its programme, promises and votes. That is not finished in the prototype, and gaps will remain even then. A statement with an unknown position is left out for that party. So that a party with three known positions cannot end up at 100%, five imaginary statements with a half match are added for every party."],
      ["Close results", "A gap under 7 points is labelled as practically the same match. Parties with an equal match are ordered at random."],
      ["Party data", "Positions are provisional: they come from the parties' answers in the 2025 calculators (editors filled in ANO and Stačilo!), from voting records and from a few news reports."],
      ["What is stored", "Only with your consent: a random code, your answers, the language and the date. No name, e-mail, IP address or exact time is stored. Only totals are shown publicly; written answers are visible to the administrator alone."]
    ],
    del_h: "Delete my answers", del_p: "Deletes everything stored under the code in this browser.", del_b: "Delete", del_ok: "Deleted.", del_none: "No code is stored in this browser.", del_err: "Deleting failed."
  }
};
const t = makeT(P);

mount(() => {
  const status = el("span", { class: "small muted", role: "status" });
  const del = btn(t("del_b"), async () => {
    const id = respondentId(false);
    if (!id) { status.textContent = t("del_none"); return; }
    try { await api("respondent?id=" + encodeURIComponent(id), { method: "DELETE" }); forgetRespondent(); status.textContent = t("del_ok"); }
    catch { status.textContent = t("del_err"); }
  });
  return [el("h1", {}, t("h")), el("div", { class: "card" }, t("m").map(([h, p]) => [el("h3", {}, h), el("p", {}, p)])),
    el("div", { class: "card" }, el("h3", { style: "margin-top:0" }, t("del_h")), el("p", {}, t("del_p")), el("div", { class: "row" }, del, status))];
});

// Privacy notice. Fill in CONTROLLER before the address is shared with anyone outside the team.
import { lang, makeT, el, mount } from "./common.js";

const CONTROLLER = { name: "", contact: "" };   // e.g. { name: "Jan Novák, Univerzita X", contact: "jan.novak@example.cz" }

const P = {
  cs: {
    h: "Ochrana osobních údajů", updated: "Stav k 14. listopadu 2026. Pracovní verze, před veřejným spuštěním ji zkontroluje pověřenec pro ochranu osobních údajů.",
    todo: "bude doplněno před zveřejněním",
    s: [
      ["K čemu data slouží", ["Odpovědi slouží pouze k výzkumu toho, jaké postoje lidé zastávají a jak chtějí, aby bylo Česko spravováno.", "Data se neprodávají, nepředávají politickým stranám ani inzerentům a nepoužívají se k oslovování voličů ani k reklamě."]],
      ["Kdo je správcem", ["Správce: {name}.", "Kontakt: {contact}."]],
      ["Co ukládáme", ["Jen pokud zaškrtnete souhlas a odpovědi uložíte: vaše odpovědi z kalkulačky a z průzkumu, nepovinné údaje o vás (věková skupina, pohlaví, vzdělání, kraj, velikost obce, volba v roce 2025), jazyk stránky, datum a náhodný kód.", "Náhodný kód vzniká ve vašem prohlížeči a je v něm uložen. Slouží jen k propojení vašich odpovědí z obou dotazníků a k tomu, abyste je mohli smazat."]],
      ["Co neukládáme", ["Jméno, e-mail, IP adresu, přesný čas ani cookies pro sledování. Nepoužíváme analytické ani reklamní nástroje.", "Když dotazník jen vyplníte a odpovědi neuložíte, nic se neodešle."]],
      ["Politické názory jsou citlivý údaj", ["Odpovědi vypovídají o politických názorech, tedy o zvláštní kategorii osobních údajů. Zpracováváme je výhradně na základě vašeho výslovného souhlasu (čl. 6 odst. 1 písm. a) a čl. 9 odst. 2 písm. a) GDPR).", "Do volných textových odpovědí prosím nepište jména ani jiné údaje, podle kterých by vás nebo někoho jiného šlo poznat."]],
      ["Kdo data uvidí", ["Veřejně zobrazujeme pouze součty, a to až od určitého počtu odpovědí. Jednotlivé odpovědi a vlastní texty vidí jen výzkumný tým.", "Ve výzkumných publikacích se objeví pouze souhrnné výsledky."]],
      ["Kde jsou data uložena", ["Databázi provozuje služba Railway a stránku služba Vercel. Tito poskytovatelé vedou vlastní technické záznamy o provozu, které mohou obsahovat IP adresu; k našim uloženým odpovědím se nepřipojují."]],
      ["Jak dlouho", ["Po dobu výzkumného projektu, nejdéle pět let od uložení. Poté data smažeme nebo nevratně anonymizujeme."]],
      ["Vaše práva", ["Souhlas můžete kdykoli odvolat a odpovědi smazat tlačítkem na stránce Jak to funguje, pokud používáte stejný prohlížeč. Jinak napište správci.", "Máte právo na přístup k údajům, jejich opravu a výmaz a právo podat stížnost u Úřadu pro ochranu osobních údajů (uoou.gov.cz)."]]
    ]
  },
  en: {
    h: "Privacy notice", updated: "As of 14 November 2026. Working draft; a data protection officer will review it before public launch.",
    todo: "to be added before publication",
    s: [
      ["What the data is for", ["Answers are used only for research into what positions people hold and how they want Czechia to be governed.", "The data is not sold, not passed to political parties or advertisers, and not used to contact voters or for advertising."]],
      ["Who the controller is", ["Controller: {name}.", "Contact: {contact}."]],
      ["What we store", ["Only if you tick the consent box and save: your calculator and survey answers, optional details about you (age group, gender, education, region, size of municipality, 2025 vote), the page language, the date and a random code.", "The random code is created and kept in your browser. It only links your answers from the two questionnaires and lets you delete them."]],
      ["What we do not store", ["Name, e-mail, IP address, exact time or tracking cookies. We use no analytics or advertising tools.", "If you fill in a questionnaire without saving, nothing is sent."]],
      ["Political opinions are sensitive data", ["Answers reveal political opinions, a special category of personal data. We process them solely on the basis of your explicit consent (Article 6(1)(a) and Article 9(2)(a) GDPR).", "Please do not write names or other details in free-text answers that could identify you or anyone else."]],
      ["Who sees the data", ["Only totals are shown publicly, and only once a minimum number of people have answered. Individual answers and written texts are seen by the research team alone.", "Research publications will contain aggregate results only."]],
      ["Where the data is kept", ["The database is run by Railway and the site by Vercel. These providers keep their own technical traffic logs, which may contain an IP address; those logs are not linked to our stored answers."]],
      ["How long", ["For the duration of the research project, at most five years from saving. After that the data is deleted or irreversibly anonymised."]],
      ["Your rights", ["You can withdraw consent and delete your answers at any time with the button on the How it works page, if you use the same browser. Otherwise write to the controller.", "You have the right to access, correct and erase your data, and to complain to the Czech Office for Personal Data Protection (uoou.gov.cz)."]]
    ]
  }
};
const t = makeT(P);
mount(() => {
  const fill = s => s.replace("{name}", CONTROLLER.name || t("todo")).replace("{contact}", CONTROLLER.contact || t("todo"));
  return [el("h1", {}, t("h")), el("p", { class: "small muted" }, t("updated")),
    el("div", { class: "card" }, t("s").map(([h, ps]) => [el("h3", {}, h), ps.map(p => el("p", {}, fill(p)))]))];
});

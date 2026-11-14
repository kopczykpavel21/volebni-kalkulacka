// Shared by every page: language, small DOM helpers, data loading, the respondent id.

export const T = {
  cs: {
    brand: "Kalkulačka", nav_calc: "Kalkulačka", nav_survey: "Průzkum", nav_results: "Výsledky", nav_method: "Jak to funguje",
    footer: "Prototyp. Postoje stran jsou předběžné.",
    warn: "Předběžná data: postoje stran pocházejí z jejich odpovědí v roce 2025 a z několika zpráv v médiích. Vlastní kódování z programů a hlasování teprve vznikne.",
    more: "Více informací", start: "Začít", back: "Zpět", next: "Další", skip: "Přeskočit", of: "z",
    saving: "Ukládám…", saved: "Uloženo. Děkujeme.", err: "Uložení se nepodařilo. Zkuste to znovu.",
    keep: "Ponechat", change: "Změnit", unsure: "Nevím", answers: "odpovědí",
    agree: "souhlas", disagree: "nesouhlas", neutral: "nevím",
    consent_note: "Ukládá se jen náhodný kód uložený ve vašem prohlížeči, odpovědi a datum. Neukládá se jméno, e-mail, IP adresa ani přesný čas. Díky kódu lze propojit vaše odpovědi z kalkulačky a z průzkumu. Své odpovědi můžete kdykoli smazat na stránce Jak to funguje.",
    load_err: "Stránku se nepodařilo načíst."
  },
  en: {
    brand: "Calculator", nav_calc: "Calculator", nav_survey: "Survey", nav_results: "Results", nav_method: "How it works",
    footer: "Prototype. Party positions are provisional.",
    warn: "Provisional data: party positions come from the parties' 2025 answers and a few news reports. Independent coding from programmes and votes is still to be done.",
    more: "More information", start: "Start", back: "Back", next: "Next", skip: "Skip", of: "of",
    saving: "Saving…", saved: "Saved. Thank you.", err: "Saving failed. Please try again.",
    keep: "Keep", change: "Change", unsure: "Not sure", answers: "answers",
    agree: "agree", disagree: "disagree", neutral: "not sure",
    consent_note: "Only a random code kept in your browser, your answers and the date are stored. No name, e-mail, IP address or exact time is stored. The code links your calculator and survey answers. You can delete your answers at any time on the How it works page.",
    load_err: "The page could not be loaded."
  }
};

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode: keep going without it */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* nothing to remove */ } }
};

export let lang = ls.get("vk_lang") === "en" ? "en" : "cs";
/** Looks a key up in the page's own strings first, then in the shared ones. */
export function makeT(page) { return k => (page[lang] && page[lang][k] !== undefined ? page[lang][k] : T[lang][k]); }
export const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]);

export function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
export const btn = (label, onclick, cls) => el("button", { type: "button", class: cls || "", onclick }, label);
export const info = o => o.info ? el("details", { class: "info" }, el("summary", {}, T[lang].more), el("p", { class: "small" }, o.info[lang])) : null;
export const pct = (a, b) => (b ? Math.round(100 * a / b) : 0);

export function stack(parts, total) {
  return el("div", { class: "stack", role: "img", "aria-label": parts.map(p => `${p.label} ${pct(p.n, total)} %`).join(", ") },
    parts.filter(p => p.n).map(p => el("span", { class: p.cls, style: `width:${100 * p.n / total}%`, title: `${p.label}: ${p.n} (${pct(p.n, total)} %)` })));
}
export function hbars(labels, counts, total) {
  return labels.map((l, i) => ({ l, n: counts[i] || 0 })).sort((a, b) => b.n - a.n).map(x =>
    el("div", { class: "hbar" }, el("span", {}, x.l), el("span", { class: "t" }, el("i", { style: `width:${total ? 100 * x.n / total : 0}%` })), el("span", { class: "v" }, `${x.n} · ${pct(x.n, total)} %`)));
}
export const legend = items => el("div", { class: "legend" }, items.map(([cls, l]) => el("span", {}, el("i", { class: cls }), l)));

/* ---------- data and API ---------- */
const getJson = async url => { const r = await fetch(url); if (!r.ok) throw new Error(url + " " + r.status); return r.json(); };
export async function loadData(...names) {
  const out = {};
  await Promise.all(names.map(async n => { out[n] = await getJson(`/data/${n}.json`); }));
  return out;
}
export async function api(path, options) {
  const r = await fetch("/api/" + path, options && options.body ? { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) }, body: JSON.stringify(options.body) } : options);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(body.error || String(r.status)); e.status = r.status; throw e; }
  return body;
}

/* ---------- respondent id: random, created only when the person agrees to save ---------- */
let memoryId = null;
export function respondentId(create) {
  let id = ls.get("vk_rid") || memoryId;
  if (!id && create) {
    id = crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    memoryId = id;
    ls.set("vk_rid", id);
  }
  return id;
}
export function forgetRespondent() { memoryId = null; ls.del("vk_rid"); }

/* ---------- page frame ---------- */
export function mount(render) {
  const app = document.getElementById("app");
  const draw = async () => {
    document.documentElement.lang = lang;
    const t = T[lang];
    document.querySelector("header").replaceChildren(
      el("a", { class: "brand", href: "/" }, t.brand, el("span", {}, "prototyp")),
      el("nav", {}, el("a", { href: "/" }, t.nav_calc), el("a", { href: "/pruzkum" }, t.nav_survey), el("a", { href: "/vysledky" }, t.nav_results), el("a", { href: "/metoda" }, t.nav_method),
        btn(lang === "cs" ? "English" : "Česky", () => { lang = lang === "cs" ? "en" : "cs"; ls.set("vk_lang", lang); draw(); })));
    document.querySelector("footer").textContent = t.footer;
    try { app.replaceChildren(...[].concat(await render()).flat(Infinity).filter(Boolean)); }
    catch (e) { console.error(e); app.replaceChildren(el("div", { class: "note" }, t.load_err)); }
  };
  draw();
  return draw;
}

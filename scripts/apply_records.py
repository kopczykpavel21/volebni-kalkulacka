"""Builds scripts/records.json from the vote tallies and writes each party's latest action into public/data/parties.json.
Run after build_parties.py. Vote tallies were read from the Chamber of Deputies open data (psp.cz) on 2026-11-14.

Rules (agreed 2026-11-14):
- a club is "for"/"against" when at least two thirds of its members who cast a vote did so (and at least 3 voted);
- only records with high or medium confidence that are not whole-bill votes change the match; the rest are notes;
- the newest action counts; a postponed pledge counts as 0 (half way);
- SPOLU is split into ODS, KDU-ČSL and TOP 09; a "no" to a state budget is not coded.
"""
import json, copy, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
def C(s): return {k: tuple(int(x) for x in v.split('/')) for k, v in (p.split(':') for p in s.split())}
old = json.load(open(ROOT/'scripts/records_pilot.json'))['votes']
V = {k: (v['date'], v['name'], {c: (x['ano'], x['ne'], x['zdrzel'], x['nepritomen']) for c, x in v['clubs'].items()}) for k, v in old.items()}
V.update({
 "70948": ("2019-09-13", "Novela z. o evidenci tržeb (rozšíření EET), závěrečné hlasování", C("ČSSD:14/0/0/1 KSČM:14/0/0/1 ANO:76/0/1/1 SPD:0/17/0/2 Piráti:0/22/0/0 STAN:0/5/0/1 TOP09:0/6/0/1 ODS:0/22/0/1 KDU-ČSL:0/8/0/2")),
 "88105": ("2026-07-08", "Vl. n. z. v oblasti veřejných rozpočtů (volnější rozpočtová pravidla), přehlasování Senátu", C("ODS:0/21/0/6 ANO:77/0/0/3 Piráti:0/11/0/7 KDU-ČSL:0/12/0/4 Motoristé:10/0/0/3 STAN:0/15/0/7 TOP09:0/4/0/5 SPD:14/0/0/1")),
 "76121": ("2021-04-29", "Novela občanského zákoníku (manželství pro všechny), 1. čtení: návrh na zamítnutí", C("ODS:7/2/1/13 ANO:12/15/13/38 KSČM:1/2/1/11 Piráti:0/11/0/11 ČSSD:0/1/1/12 SPD:9/0/0/10 TOP09:1/2/0/4 KDU-ČSL:5/0/0/5 STAN:0/2/1/3")),
 "67926": ("2018-06-27", "Návrh ústavního zákona o celostátním referendu, 1. čtení: návrh, který neprošel (zřejmě zamítnutí)", C("ODS:20/0/1/4 ANO:0/13/52/13 SPD:0/18/0/4 ČSSD:1/3/4/7 KDU-ČSL:5/0/0/5 KSČM:0/11/0/4 Piráti:19/0/0/3 STAN:5/0/1/0 TOP09:5/0/0/2")),
 "79349": ("2022-12-13", "Novela lex Ukrajina (pokračování podpory uprchlíků)", C("ODS:23/0/1/10 ANO:0/0/41/31 STAN:26/0/0/7 KDU-ČSL:20/0/0/3 Piráti:3/0/0/1 SPD:0/0/13/7 TOP09:9/0/0/5")),
 "83478": ("2024-06-28", "Novela zákoníku práce (pravidelné zvyšování minimální mzdy, omezení zaručené mzdy)", C("ODS:22/0/1/11 ANO:52/0/3/16 STAN:21/0/0/12 KDU-ČSL:18/0/0/5 Piráti:4/0/0/0 SPD:0/17/0/3 TOP09:8/0/1/5")),
 "88829": ("2026-10-22", "Novela lex Ukrajina (podle zpráv zpřísnění podmínek podpory)", C("ODS:1/2/1/23 ANO:60/0/0/20 Piráti:0/4/0/14 KDU-ČSL:0/5/2/9 Motoristé:9/0/0/4 STAN:0/4/0/18 TOP09:0/2/0/7 SPD:11/0/0/4")),
})
# statement, vote id, what a "yes" means for the statement, confidence, note only?, note, only supporters coded?
MAP = [(4,"80467",1,"high",0,None,0),(4,"85540",1,"high",0,None,0),
 (7,"86957",-1,"high",0,"Hlas proti rozpočtu se nezapočítává.",1),(7,"88105",-1,"high",0,None,0),
 (8,"83999",-1,"high",0,None,0),(9,"70948",1,"high",0,None,0),(9,"79190",-1,"high",0,None,0),(9,"88356",1,"high",0,None,0),
 (11,"83478",1,"medium",1,"Hlasování o celém zákoně; cílem je minimální mzda kolem 47 % průměrné mzdy, ne poloviny.",0),
 (15,"79349",-1,"medium",0,None,0),(15,"88829",1,"low",1,"Obsah novely ověřen jen z titulků zpráv.",0),
 (18,"76121",-1,"low",1,"Polovina poslanců chyběla; druh návrhu určen podle rozložení hlasů.",0),
 (18,"82529",1,"medium",0,"Pozměňovací návrh určen podle rozložení hlasů. O manželství samotném se nehlasovalo.",0),
 (21,"85963",1,"medium",1,"Hlasování o celém zákoně; postoj ke konopí z něj plyne jen nepřímo.",0),
 (22,"85057",-1,"high",0,None,0),(22,"88874",-1,"high",0,None,0),
 (23,"67926",-1,"low",1,"Druh návrhu určen podle rozložení hlasů, ne podle stenozáznamu.",0),(24,"83203",1,"high",0,None,0)]
recs = []
for st, vid, direction, conf, note_only, note, supporters_only in MAP:
    date, name, clubs = V[vid]
    for club, (a, n, z, ab) in clubs.items():
        cast = a + n + z
        side = None if cast < 3 else 1 if a/cast >= 2/3 else -1 if n/cast >= 2/3 else None
        if supporters_only and side == -1: side = None
        recs.append({"statement": st, "party": club, "date": date, "kind": "vote", "vote_id": vid, "what": name,
            "counts": {"ano": a, "ne": n, "zdrzel": z, "nepritomen": ab}, "v": None if side is None else side*direction,
            "confidence": conf, "note_only": bool(note_only), "note": note, "source": f"https://www.psp.cz/sqw/hlasy.sqw?g={vid}"})
for p in ["ANO", "SPD", "Motoristé"]:
    recs.append({"statement": 8, "party": p, "date": "2026-07-20", "kind": "open", "what": "Vláda schválila první důchodovou novelu bez slíbeného stropu 65 let; strop odložila na další novelu",
        "what_en": "The government approved its first pension bill without the promised cap at 65 and postponed the cap to a later bill",
        "v": 0, "confidence": "high", "note_only": False, "note": "Slib zatím nesplněn.", "source": "https://www.e15.cz/domaci/politika/babis-odsouva-strop-duchodoveho-veku-vlada-chce-nejdriv-resit-narocne-profese-1433717"})
# ---- source B: pledges in the government programme (5 Jan 2026) and what happened to them, checked 2026-11-15
GOV = ["ANO", "SPD", "Motoristé"]
def pledge(st, parties, date, kind, v, conf, cs, en, src, note=None, note_only=False):
    for p in parties:
        recs.append({"statement": st, "party": p, "date": date, "kind": kind, "what": cs, "what_en": en, "v": v, "confidence": conf,
                     "note_only": note_only, "note": note, "source": src, "basis": "programové prohlášení vlády 2026"})
pledge(1, GOV, "2026-01-05", "gov", -1, "high", "Vláda se v programovém prohlášení zavázala nepodnikat kroky k přijetí eura",
       "In its programme the government committed to take no steps towards adopting the euro", "https://www.ceskenoviny.cz/index_view.php?id=2741424")
pledge(3, ["ANO", "Motoristé"], "2026-01-05", "gov", -1, "medium", "Programové prohlášení vylučuje referendum o členství v NATO",
       "The government programme rules out a referendum on NATO membership", "https://forbes.cz/vlada-schvalila-svuj-program-slibuje-dostupnejsi-bydleni-i-reformu-duchodu/")
pledge(5, GOV, "2026-01-05", "open", 0, "medium", "Vláda odmítla povolenky ETS2 a žádá zásadní revizi Green Dealu, ne odstoupení od něj",
       "The government rejected ETS2 allowances and demands a fundamental revision of the Green Deal, not withdrawal from it",
       "https://cnn.iprima.cz/vlada-schvalila-nove-programove-prohlaseni-prioritami-jsou-levnejsi-energie-ci-zmeny-duchodu-500481",
       "Jednostranně od Green Dealu odstoupit nelze, jde o právo EU.")
pledge(12, GOV, "2026-01-05", "open", 0, "low", "Vláda slíbila nulovou DPH na léky na předpis; splnění se zatím nepodařilo ověřit",
       "The government promised zero VAT on prescription medicines; delivery could not be verified yet",
       "https://www.echo24.cz/a/Hd86x/zpravy-domov-vlada-programmove-prohlaseni-zastropovani-duchodoveho-veku-50-tisic-pro-statni-zamestnance", None, True)
pledge(23, GOV, "2026-11-09", "gov", 1, "high", "Vláda schválila návrh ústavního zákona o celostátním referendu (300 tisíc podpisů; členství v EU a NATO vyloučeno)",
       "The government approved a constitutional bill on a nationwide referendum (300,000 signatures; EU and NATO membership excluded)",
       "https://www.ceskenoviny.cz/zpravy/zive-tk-po-jednani-vlady/2897324", "K přijetí je nutná ústavní většina ve Sněmovně i v Senátu, kterou koalice nemá.")
pledge(25, GOV, "2026-03-23", "open", 0, "medium", "Koaliční poslanci připravili povinnou registraci subjektů se zahraničními vazbami; ministr spravedlnosti řekl, že vláda takový zákon nechystá, premiér ho dál hájí",
       "Coalition MPs drafted compulsory registration of bodies with foreign ties; the justice minister said the government is not preparing such a law, while the prime minister still defends it",
       "https://ct24.ceskatelevize.cz/clanek/domaci/zakon-o-registraci-neziskovych-organizaci-vlada-ani-ministerstvo-nechystaji-zastane-ho-vyhlaska-371604", "Slib zatím nesplněn.")
# ---- Fiala government 2021-2025 (ODS, KDU-ČSL, TOP 09, STAN, Piráti until 2024), checked 2026-11-15
FIALA = ["ODS", "KDU-ČSL", "TOP09", "STAN", "Piráti"]
PKG = "https://advokatnidenik.cz/2023/10/13/poslanecka-snemovna-schvalila-konsolidacni-balicek/"
pledge(1, ["ODS"], "2024-02-06", "gov", -1, "medium", "Vláda neurčila termín přijetí eura ani vstupu do ERM II; ministerstvo financí vedené ODS navrhlo o vstup neusilovat",
       "The government set no date for the euro or for ERM II entry; the ODS-led finance ministry proposed not to seek entry",
       "https://www.seznamzpravy.cz/clanek/ekonomika-finance-byznys-meny-kryptomeny-spor-o-euro-se-odklada-ods-chce-cekat-mensi-strany-sni-o-dansku-242063")
pledge(1, ["STAN", "TOP09", "KDU-ČSL", "Piráti"], "2024-02-06", "blocked", None, "medium", "Menší vládní strany chtěly termín vstupu do ERM II (STAN jmenoval zmocněnce pro euro); po koaličním jednání z toho sešlo",
       "The smaller coalition parties wanted a date for ERM II entry (STAN appointed a euro commissioner); it was dropped after coalition talks",
       "https://echo24.cz/a/HkLjw/zpravy-domaci-ne-zmocnenec-ale-poradce-fiala-dohodovaci-rizeni", "Zablokováno koaličním partnerem; do shody se nezapočítává.", True)
pledge(6, FIALA, "2023-10-13", "gov", 1, "medium", "Konsolidační balíček: sazba daně z příjmů 23 % nově už od trojnásobku průměrné mzdy (dříve od čtyřnásobku)",
       "Consolidation package: the 23% income tax rate now applies from three times the average wage (previously four times)", PKG, "Součást rozsáhlého balíčku.")
pledge(12, FIALA, "2023-10-13", "gov", -1, "medium", "Konsolidační balíček: DPH na léky se zvýšila z 10 na 12 %",
       "Consolidation package: VAT on medicines rose from 10% to 12%", "https://www.pruvodcepodnikanim.cz/clanek/schvaleny-konsolidacni-balicek/", "Součást rozsáhlého balíčku.")
pledge(14, FIALA, "2023-11-01", "gov", 1, "high", "Vláda zvýšila kvóty pro kvalifikované pracovníky ze třetích zemí o 20 tisíc ročně od roku 2024",
       "The government raised quotas for qualified workers from third countries by 20,000 a year from 2024", "https://www.ceskenoviny.cz/zpravy/2428376")
pledge(14, GOV, "2026-10-01", "open", None, "low", "Ministr průmyslu oznámil záměr zvýšit kvóty pro pracovníky z Filipín a Indie; vláda o tom zatím nerozhodla",
       "The industry minister announced a plan to raise quotas for workers from the Philippines and India; the government has not decided yet",
       "https://www.newstream.cz/zpravy-z-firem/bez-filipincu-se-ceske-firmy-neobejdou-stat-je-presto-nechava-cekat", None, True)
json.dump({"about": __doc__, "votes": {k: {"date": v[0], "name": v[1], "clubs": {c: dict(zip(["ano","ne","zdrzel","nepritomen"], x)) for c, x in v[2].items()}} for k, v in sorted(V.items())}, "records": recs},
          open(ROOT/'scripts/records.json', 'w'), ensure_ascii=False, indent=1)

# ---- write into parties.json
CLUB = {"ANO":"ano","ODS":"ods","KDU-ČSL":"kdu","TOP09":"top09","STAN":"stan","Piráti":"pirati","SPD":"spd","Motoristé":"motoriste","KSČM":"stacilo"}
path = ROOT/'public/data/parties.json'; d = json.load(open(path))
if any(p['id'] == 'spolu' for p in d['parties']):
    i = next(i for i, p in enumerate(d['parties']) if p['id'] == 'spolu'); spolu = d['parties'].pop(i)
    for j, (pid, name, color) in enumerate([("ods","ODS","#1f4e9c"),("kdu","KDU-ČSL","#d9a400"),("top09","TOP 09","#7b2d8e")]):
        q = copy.deepcopy(spolu); q.update(id=pid, name=name, color=color, joint_list="SPOLU 2025")
        d['parties'].insert(i+j, q)
by = {p['id']: p for p in d['parties']}
cz = lambda s: f"{int(s[8:])}. {int(s[5:7])}. {s[:4]}"
latest = {}
for r in sorted(recs, key=lambda r: r['date']):
    if r['v'] is None or r['note_only'] or r['confidence'] == 'low' or r['party'] not in CLUB: continue
    latest[(CLUB[r['party']], r['statement'])] = r
n = 0
for (pid, st), r in latest.items():
    pos = by[pid]['positions'].setdefault(str(st), {"v": 0, "basis": "none", "flipped": False, "filled_by": "none"})
    who = "KSČM: " if r['party'] == "KSČM" else ""
    if r['kind'] == 'vote':
        c = r['counts']; how = ("pro" if c['ano'] > c['ne'] else "proti", "for" if c['ano'] > c['ne'] else "against")
        cs = f"{who}{cz(r['date'])}, {r['what']}: klub hlasoval {how[0]} ({c['ano']} pro, {c['ne']} proti, {c['zdrzel']} se zdrželo)."
        en = f"{who}{r['date']}, recorded vote ({r['what']}): the club voted {how[1]} ({c['ano']} for, {c['ne']} against, {c['zdrzel']} abstained)."
    else:
        cs = f"{cz(r['date'])}: {r['what']}."; en = f"{r['date']}: {r['what_en']}."
    if r.get('note'): cs += " " + r['note']
    pos['acted'] = {"v": r['v'], "kind": r['kind'], "cs": cs, "en": en, "url": r['source']}; n += 1
json.dump(d, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
applied = {id(r) for r in latest.values()}
names = {"ANO":"ANO","ODS":"ODS","KDU-ČSL":"KDU-ČSL","TOP09":"TOP 09","STAN":"STAN","Piráti":"Piráti","SPD":"SPD","Motoristé":"Motoristé","KSČM":"KSČM (dnes Stačilo!)","ČSSD":"ČSSD (dnes SOCDEM)","Nezařaz":None}
out = [{"statement": r["statement"], "party": names[r["party"]], "date": r["date"], "kind": r["kind"], "what": r["what"], "what_en": r.get("what_en"),
        "counts": r.get("counts"), "v": r["v"], "confidence": r["confidence"], "note": r.get("note"), "source": r["source"], "applied": id(r) in applied}
       for r in sorted(recs, key=lambda r: (r["statement"], r["date"], r["party"])) if names.get(r["party"])]
json.dump(out, open(ROOT/'public/data/records.json', 'w'), ensure_ascii=False, separators=(',', ':'))
acted = [(p['id'], s, x['v'], x['acted']['v']) for p in d['parties'] for s, x in p['positions'].items() if x.get('acted')]
print(len(recs), "records;", n, "applied;", len(acted), "positions with an action;", sum(1 for a in acted if a[2] and a[2] != a[3]), "differ from the stated position")
print("parties:", [p['id'] for p in d['parties']])

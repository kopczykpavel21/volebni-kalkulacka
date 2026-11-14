#!/usr/bin/env python3
"""Builds public/data/parties.json.

    python3 scripts/build_parties.py /path/to/party_answers_2022_2026.csv

PROVISIONAL DATA. "Stated" positions are the parties' own 2025 questionnaire answers
(editors filled in ANO and Stacilo!) plus a few news-based placements. "Acted" entries
record what a party did where that is documented: a recorded vote, a government step,
or a pledge given up in coalition talks. Replace all of it with independent coding
from programmes and votes before the site goes public.
The original questionnaire statements are not written to the output.
"""
import sys, json, csv, pathlib, collections
root = pathlib.Path(__file__).resolve().parent.parent
KEEP = {'ANO 2011':'ano','SPOLU':'spolu','Starostové a nezávislí':'stan','Česká pirátská strana':'pirati',
        'Svoboda a přímá demokracie':'spd','Motoristé sobě':'motoriste','Stačilo!':'stacilo','Přísaha – občanské hnutí':'prisaha'}
CLUB = {'ANO':'ano','SPOLU':'spolu','Starostové a nezávislí':'stan','Svoboda a přímá demokracie':'spd','Česká pirátská strana':'pirati'}
MAP = {1:('Přijetí eura',0),2:('Vystoupení z EU',0),3:('Vystoupení z NATO',0),4:('Zvýšení výdajů na obranu',0),
 5:('Zelená dohoda pro Evropu',0),6:('Daňová progrese zaměstnanců',1),8:('Věk odchodu do důchodu',1),9:('Znovuzavedení EET',0),
 10:('Zdanění prázdných bytů',0),11:('Minimální mzda navázaná na průměrnou',0),12:('DPH u léků na předpis',0),
 13:('Flexibilní práce přes platformy',0),14:('Více zahraničních pracovníků',0),16:('Dostupnost lékařské péče',0),
 17:('Slučování obcí',0),18:('Manželství pro stejnopohlavní páry',0),19:('Eutanazie',0),20:('Ústavní právo na interrupci',0),
 21:('Legalizace měkkých drog',0),22:('Financování médií veřejné služby',1),23:('Celostátní referendum',0),24:('Korespondenční volba',1)}
T2S = {t:(sid,f) for sid,(t,f) in MAP.items()}
VAL = {'yes':1,'no':-1,'neutral':0}
# recorded votes 2021-2025: title -> (statement id, sign of a "yes" vote for our statement, label cs, label en)
VOTES = {'Korespondenční volba': (24, 1, 'zavedení korespondenční volby', 'introducing postal voting'),
         'Zrušení EET': (9, -1, 'zrušení EET', 'abolishing EET')}
pos = {p:{} for p in KEEP.values()}
votes = collections.defaultdict(lambda: [0,0])
with open(sys.argv[1], encoding='utf-8', newline='') as fh:
    for r in csv.DictReader(fh):
        if r['election']!='snemovni-2025': continue
        if r['kind']=='voting_record':
            if r['question_title'] in VOTES and r['affiliation'] in CLUB and r['answer'] in ('yes','no'):
                votes[(CLUB[r['affiliation']], r['question_title'])][0 if r['answer']=='yes' else 1] += 1
            continue
        p = KEEP.get(r['candidate_name']); hit = T2S.get(r['question_title'])
        if not p or not hit or r['answer'] not in VAL: continue
        sid, flip = hit
        pos[p][str(sid)] = {'v': VAL[r['answer']] * (-1 if flip else 1), 'basis': 'archive', 'flipped': bool(flip),
                            'filled_by': 'editors' if r['respondent']=='expert' else 'party'}
B = 'https://plus.rozhlas.cz/petr-sabata-motoriste-a-spd-slibili-vyrovnane-rozpocty-ale-ministri-odhlasovali-9592858'
C = 'https://cnn.iprima.cz/vladu-ceka-jednani-o-rozpoctu-ctete-programove-prohlaseni-vzkazal-babis-kritikum-z-koalice-521072'
N = 'https://www.blesk.cz/clanek/zpravy-politika/825555/co-slibuje-babisova-vlada-uniklo-programove-prohlaseni-obsahuje-nezvysovani-dani-i-ne-euru.html'
O = 'https://ct24.ceskatelevize.cz/tema/pro-1658'
news = {'7':{'motoriste':(1,B),'spd':(1,B),'ano':(-1,C)}, '15':{'spd':(1,C),'ano':(-1,C)},
        '25':{'ano':(1,N),'spd':(1,N),'motoriste':(1,N),'spolu':(-1,O),'stan':(-1,O),'pirati':(-1,O)}}
for sid, d in news.items():
    for p,(v,u) in d.items(): pos[p][sid] = {'v': v, 'basis': 'news', 'url': u}

# ---- what parties did ----
def acted(p, sid, v, kind, cs, en, url=''):
    if str(sid) in pos[p]: pos[p][str(sid)]['acted'] = {'v': v, 'kind': kind, 'cs': cs, 'en': en, 'url': url}
for (p, title), (y, n) in sorted(votes.items()):
    sid, sign, lcs, len_ = VOTES[title]; share = y/(y+n)
    if 0.2 < share < 0.8: continue
    acted(p, sid, sign if share >= 0.8 else -sign, 'vote',
          f'Sněmovna 2021–2025, hlasování o návrhu „{lcs}“: pro bylo {round(100*share)} % poslanců klubu ({y} z {y+n}).',
          f'Lower house 2021–2025, vote on {len_}: {round(100*share)}% of the club voted in favour ({y} of {y+n}).')
BUD = 'https://www.blesk.cz/clanek/834911'
FEE = 'https://cnn.iprima.cz/vlada-schvalila-zruseni-koncesionarskych-poplatku-televizi-i-rozhlasu-se-snizi-rozpocet-514755'
EU = 'https://cnn.iprima.cz/okamura-programove-prohlaseni-je-z-99-program-spd-ustoupili-jsme-jen-v-jednom-bode-491525'
PEN = 'https://ct24.ceskatelevize.cz/tema/vek-odchodu-do-duchodu-94792'
for p in ('motoriste','spd','ano'):
    acted(p, 7, -1, 'vote', 'Poslanci strany v březnu 2026 hlasovali pro rozpočet se schodkem 310 mld. Kč.',
          "The party's deputies voted in March 2026 for a budget with a 310 bn CZK deficit.", BUD)
acted('spd', 2, 0, 'traded', 'Při vstupu do vlády ustoupila od referenda o vystoupení z EU; vládní program členství v EU potvrzuje.',
      'On joining the government it gave up the referendum on leaving the EU; the government programme confirms EU membership.', EU)
for p in ('ano','spd','motoriste'):
    acted(p, 22, 1, 'gov', 'Vláda, v níž strana sedí, v červnu 2026 schválila návrh zrušit poplatky a platit média ze státního rozpočtu.',
          'The government the party sits in approved a bill in June 2026 to abolish the fees and fund the media from the state budget.', FEE)
for p in ('spolu','stan'):
    acted(p, 8, -1, 'gov', 'Vláda, v níž strana byla, prosadila v roce 2024 reformu, která zvyšuje důchodový věk až na 67 let.',
          'The government the party was in passed the 2024 reform that raises the retirement age to as much as 67.', PEN)
base = json.load(open(root/'scripts'/'parties_base.json', encoding='utf-8'))
for p in base['parties']: p['positions'] = pos[p['id']]
json.dump(base, open(root/'public'/'data'/'parties.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
for p in base['parties']:
    a = {s:(x['v'], x['acted']['v'], x['acted']['kind']) for s,x in p['positions'].items() if 'acted' in x}
    print(p['id'], len(p['positions']), a)
print({k: v for k, v in votes.items()})

/**
 * Hrvatski katalog — IZVOR ISTINE (CLAUDE.md §Konvencije).
 *
 * EN se izvodi iz ovoga i tipiziran je prema njemu (`lib/i18n/en.ts`), pa
 * nedostajući ključ ruši `tsc`, a ne produkciju. Mijenjaj OBA kataloga.
 *
 * ⚠️ PRAVNA GRANICA (docs/03 §3, CLAUDE.md pravilo 1). Zabranjeno u copyju:
 * prinos · kamata · dividenda · povrat na ulaganje · udio u dobiti · yield ·
 * return · roi · sekundarno tržište · prodaj udio.
 * Dopušteno: doprinos · članski ulog · udio u proizvedenoj energiji · glas u
 * zajednici · javni dokaz doprinosa · predujam na elektranu.
 * `scripts/check-copy.ts` to provjerava kao dio `npm run verify`.
 *
 * ⚠️ Riječ „crowdfunding" se NE koristi u heroju ni u navigaciji (docs/01 §1.1).
 *
 * ⚠️ Bez emojija u UI-ju.
 */
export const hr = {
  // Navigacija i okvir
  "nav.registry": "Karta i registar",
  "nav.communities": "Zajednice",
  "nav.how": "Kako radi",
  "nav.skipToContent": "Prijeđi na sadržaj",
  "nav.menu": "Izbornik",

  "lang.switch": "Jezik",
  "lang.hr": "Hrvatski",
  "lang.en": "English",

  // Demo traka — dio dizajna, ne naljepnica (docs/09 §6.4)
  "demo.bar": "Prototip. Svi podaci na ovoj stranici su izmišljeni i služe prikazu sučelja.",
  "demo.barShort": "Prototip — izmišljeni podaci",
  "demo.badge": "Demo",
  "demo.plantNotice":
    "Ova elektrana je izmišljena. Postoji da se vidi kako sučelje radi, ne da se prikaže stvarno postrojenje.",
  "demo.noChain":
    "Adresa računa je izvedena iz naziva projekta i nije stvarna. Ne šalji ništa na nju.",

  // Naslovna
  "home.title": "Sunce Hrvatske, u zajedničkom vlasništvu",
  "home.lede":
    "Zakon zajedničko vlasništvo nad elektranom dopušta od 2021. U Hrvatskoj postoje tri takve zajednice. Radimo četvrtu — lakšom od prve tri.",
  "home.coverage":
    "{total} elektrana je na mreži u Hrvatskoj. {shown} ih je na ovoj karti.",
  "home.coverageNote":
    "Registar još nije potpun i to se ne prešućuje. Javni izvori se smiju koristiti tek kad se riješi licenca podataka.",

  // Statistika
  "stats.plants": "elektrana",
  "stats.capacity": "ukupna snaga",
  "stats.operational": "u pogonu",
  "stats.seeking": "traže suradnju",
  "stats.awaitingGrid": "čeka mrežu",
  "stats.filtered": "u odabranom skupu",

  // Filtri
  "filter.title": "Filtri",
  "filter.county": "Županija",
  "filter.allCounties": "Sve županije",
  "filter.status": "Status",
  "filter.allStatuses": "Svi statusi",
  "filter.gridStatus": "Priključak",
  "filter.allGridStatuses": "Svi priključci",
  "filter.capacity": "Snaga",
  "filter.allCapacities": "Sve snage",
  "filter.seeking": "Samo one koje traže suradnju",
  "filter.search": "Pretraži",
  "filter.searchPlaceholder": "Naziv, mjesto ili županija",
  "filter.reset": "Poništi filtre",
  "filter.resultCount": "Prikazano {count} od {total} elektrana",
  "filter.empty": "Nijedna elektrana ne odgovara odabranim filtrima.",
  "filter.emptyHint": "Poništi filtre ili proširi raspon snage.",

  // Karta
  "map.title": "Karta",
  "map.loading": "Učitavanje karte…",
  "map.unavailable": "Kartu nije moguće prikazati u ovom pregledniku.",
  "map.unavailableHint": "Popis ispod prikazuje isti skup elektrana.",
  "map.cluster": "{count} elektrana",
  "map.clusterCapacity": "ukupno {capacity}",
  "map.zoomIn": "Približi",
  "map.zoomOut": "Udalji",
  "map.resetView": "Cijela Hrvatska",
  "map.attribution": "Podloga: OpenFreeMap · OpenStreetMap suradnici",
  "map.legend": "Legenda",
  "map.openPlant": "Otvori elektranu",
  "map.emptyView": "Nema elektrana u ovom pogledu.",

  // Popis
  "list.title": "Elektrane",
  "list.sameSet": "Popis prikazuje isti skup kao karta.",

  // Status elektrane
  "status.planned": "Planirana",
  "status.under_construction": "U izgradnji",
  "status.operational": "U pogonu",
  "status.decommissioned": "Izvan pogona",

  // Status priključka
  "grid.not_applicable": "Bez priključka",
  "grid.not_requested": "Zahtjev nije predan",
  "grid.requested": "Zahtjev predan",
  "grid.approved": "Suglasnost izdana",
  "grid.connected": "Priključena",
  "grid.rejected": "Zahtjev odbijen",
  "grid.label": "Status priključka",
  "grid.requestedAt": "Zahtjev predan {date}.",
  "grid.warning":
    "Zahtjev za priključak još nije predan. Elektrana bez priključka ne predaje u mrežu.",

  // Tip vlasnika
  "owner.person": "Fizička osoba",
  "owner.association": "Udruga",
  "owner.cooperative": "Zadruga",
  "owner.company": "Tvrtka",
  "owner.municipality": "Grad ili općina",
  "owner.community": "Energetska zajednica",
  "owner.label": "Vlasnik",

  // Detalj elektrane
  "plant.notFound": "Elektrana nije pronađena",
  "plant.notFoundHint": "Možda je uklonjena iz registra ili je poveznica netočna.",
  "plant.back": "Natrag na registar",
  "plant.capacity": "Snaga",
  "plant.annualProduction": "Godišnja proizvodnja",
  "plant.annualProductionEstimate": "Procjena",
  "plant.productionDisclaimer":
    "Procjena iz instalirane snage i lokacije. Stvarna proizvodnja se ne mjeri — to radi opskrbljivač ili operator distribucijskog sustava.",
  "plant.commissioned": "U pogonu od",
  "plant.location": "Lokacija",
  "plant.county": "Županija",
  "plant.verifiedOwner": "eID-verificiran vlasnik",
  "plant.tech": "Tehnički podaci",
  "plant.tech.panels": "Paneli",
  "plant.tech.inverters": "Inverteri",
  "plant.tech.mounting": "Nosači",
  "plant.tech.unknown": "Tehnički podaci nisu uneseni.",
  "plant.onMap": "Na karti",
  "plant.coordinates": "Koordinate",
  "plant.noProject": "Ova elektrana nema otvoren projekt.",
  "plant.noProjectHint":
    "Elektrana može postojati u registru i bez ijednog projekta. Registar je javan i ne traži prijavu.",
  "plant.hasProject": "Ova elektrana traži suradnju",
  "plant.openProject": "Otvori projekt",
  "plant.raisedOf": "{raised} od {goal}",
  "plant.nearby": "U blizini",

  // Model financiranja — trajno vidljivo, ne u fusnoti (docs/07 §2.3)
  "model.donation": "Doprinos",
  "model.community": "Članski ulog u zajednici",
  "model.label": "Model",
  "model.noPromise": "Ne nudimo prinos ni udio u dobiti.",
  "model.donationExplain":
    "Doprinos financira izgradnju. Ne daje pravo na novac ni na udio u dobiti.",
  "model.communityExplain":
    "Članski ulog daje članstvo, glas u zajednici i udio u proizvedenoj energiji. Ne daje pravo na novac.",

  // Podnožje
  "footer.about": "O platformi",
  "footer.disclaimerTitle": "Regulatorna napomena",
  "footer.disclaimer":
    "{operator} je non-custodial pružatelj softvera. Sredstva nikad ne prolaze kroz platformu niti platforma drži ključeve. Regulirane funkcije e-novca obavlja Monerium (EMI, MiCA EMT). Platforma nije pružatelj usluga skupnog financiranja po Uredbi (EU) 2020/1503, nije investicijsko društvo i ne daje investicijski savjet. Organizator projekta odgovoran je za pravni oblik, dozvole i porezni tretman.",
  "footer.noCommission":
    "Ne uzimamo postotak od prikupljenog novca. Zarađujemo kao izvođač — na izgradnji elektrane, a cijena izvedbe je javna u razradi troška svakog projekta.",
  "footer.impressum": "Impresum",
  "footer.director": "Direktor",
  "footer.court": "Registar",
  "footer.stage": "Zatvorena beta",
  "footer.docs": "Baza znanja",

  // Zajedničko
  "common.of": "od",
  "common.close": "Zatvori",
  "common.showMore": "Prikaži još",
  "common.copy": "Kopiraj",
  "common.copied": "Kopirano",
} as const;

export type MessageKey = keyof typeof hr;
export type Catalog = Record<MessageKey, string>;

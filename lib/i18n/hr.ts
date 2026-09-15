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
  // Bez točke na kraju: hrvatski datum („8. ožujka 2026.") već završava točkom.
  "grid.requestedAt": "Zahtjev predan {date}",
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
  // P4 (docs/14 §4) — objava sukoba interesa. Stoji TRAJNO na stranici
  // projekta, ne u uvjetima korištenja. Sukob je strukturni: istovremeno smo
  // platforma i izvođač koji naplaćuje. Priznaje se prvi.
  "conflict.disclosure":
    "Izvođač ovog projekta je {contractor}. Isplata iz računa projekta traži {threshold} od {owners} potpisa, a naš je samo jedan.",

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

  // ── Marketplace: projekt (docs/07 §2.3) ───────────────────────────────────
  "nav.newProject": "Novi projekt",

  "project.notFound": "Projekt nije pronađen",
  "project.notFoundHint": "Možda je povučen ili je poveznica netočna.",
  "project.back": "Natrag na registar",
  "project.toPlant": "Otvori elektranu",
  "project.holder": "Nositelj",
  "project.holderOib": "OIB nositelja",
  "project.goal": "Cilj",
  "project.raised": "Prikupljeno",
  "project.remaining": "Nedostaje",
  "project.contributors": "Doprinositelja",
  "project.minContribution": "Najmanji doprinos",
  "project.deadline": "Rok",
  "project.noDeadline": "Bez roka",
  "project.daysLeft": "još {days} dana",
  "project.deadlinePassed": "rok je prošao",
  "project.contribute": "Doprinesi",
  "project.closed": "Ovaj projekt trenutno ne prima doprinose.",
  "project.closedHint":
    "Prikupljanje je zatvoreno ili je projekt prešao u izvedbu. Tijek radova i dalje je javan.",
  "project.maxCoowners": "Najviše suvlasnika",
  "project.maxCoownersNote":
    "Gornja granica je namjerna. Trošak vođenja velikog broja suvlasnika je ono što je ugasilo Sun Exchange, a mi ne uzimamo postotak iz kojeg bismo ga pokrili.",
  "project.surplusTitle": "Namjena viška",
  "project.siteRightLabel": "Pravo na lokaciju",
  "project.siteRight.owner": "Vlasništvo",
  "project.siteRight.co_owner_consent": "Suglasnost suvlasnika",
  "project.siteRight.building_right": "Pravo građenja",
  "project.siteRight.lease": "Zakup",
  "project.siteRightNote":
    "Projekt se ne objavljuje bez dokaza prava na lokaciju. Udio u elektrani koja stoji na tuđem krovu bez uređenog prava je točno ono na čemu je RealT tužen.",

  "project.state.draft": "Nacrt",
  "project.state.review": "U pregledu",
  "project.state.active": "Prikuplja",
  "project.state.funded": "Prikupljeno",
  "project.state.expired": "Isteklo",
  "project.state.building": "U izvedbi",
  "project.state.completed": "Dovršeno",

  "project.mode.integrated": "Gradimo mi",
  "project.mode.byo": "Vlastite šine",
  "project.mode.integratedExplain":
    "Nositelj je naručio izvedbu od nas. Novac stoji na računu projekta i isplaćuje se po situaciji, uz potpise članova.",
  "project.mode.byoExplain":
    "Nositelj koristi vlastiti račun i vlastitog izvođača. Novac nikad ne prolazi kroz nas i nismo potpisnik na ovom računu.",

  "project.tab.overview": "Pregled",
  "project.tab.plant": "Elektrana",
  "project.tab.funding": "Financiranje",
  "project.tab.account": "Račun",
  "project.tab.milestones": "Situacije",
  "project.tab.ledger": "Knjiga doprinosa",
  "project.tab.documents": "Dokumenti",
  "project.tab.timeline": "Tijek",

  // ── Tab Financiranje (P5, docs/14 §3.1) ───────────────────────────────────
  "funding.title": "Razrada troška izvedbe",
  "funding.intro":
    "Svaka stavka stoji ovdje prije nego itko uplati. To je cijena tvrdnje da ne uzimamo postotak od prikupljenog.",
  "funding.item": "Stavka",
  "funding.amount": "Iznos",
  "funding.total": "Ukupno",
  "funding.matchesGoal": "Zbroj razrade jednak je cilju projekta.",
  "funding.margin": "Naša marža",
  "funding.marginShare": "{share} ukupnog troška izvedbe",
  "funding.marginNote":
    "Ne uzimamo postotak od prikupljenog novca. Zarađujemo kao izvođač, na izgradnji elektrane, i taj iznos stoji u ovoj tablici kao zasebna stavka.",
  "funding.noMargin": "U ovom projektu nismo izvođač.",
  "funding.noMarginNote":
    "Nositelj gradi s izvođačem po vlastitom izboru. Od ovog projekta ne zarađujemo ništa i nemamo potpis na njegovom računu.",

  // ── Tab Račun (docs/07 §2.3, docs/14 §4) ──────────────────────────────────
  "account.title": "Račun projekta",
  "account.address": "Adresa",
  "account.chain": "Mreža",
  "account.threshold": "Potrebno potpisa",
  "account.thresholdValue": "{threshold} od {owners}",
  "account.signers": "Potpisnici",
  "account.ourSigners": "Naših potpisnika: {count}",
  "account.noOurSigners": "Nemamo nijedan potpis na ovom računu.",
  "account.whyThreshold":
    "Iz računa projekta ne može se isplatiti bez potpisa članova. To je glavna zaštita od toga da izvođač sam sebi plati, i pravi razlog zašto račun ima više potpisnika.",
  "account.deployed": "Račun je otvoren",
  "account.counterfactual": "Adresa je izračunata unaprijed; račun se otvara prvom transakcijom.",
  "account.explorerDemo":
    "Adresa je izvedena iz naziva projekta i ne postoji na mreži, pa ovdje nema poveznice na preglednik blokova. Kad podaci postanu stvarni, poveznica dolazi na ovo mjesto.",
  "account.switchRails": "Prebaci na svoje šine",
  "account.switchRailsHint":
    "Nositelj u nekoliko koraka može prijeći na vlastiti račun i vlastitog izvođača.",

  // ── Tab Situacije (P6, docs/14 §5.1) ──────────────────────────────────────
  "milestones.title": "Plaćanje po situaciji",
  "milestones.intro":
    "Novac se ne isplaćuje unaprijed nego po napretku radova, svaki put uz potpise članova. Zato neisplaćeni dio ostaje kod njih ako izvođač ne isporuči.",
  "milestones.released": "Isplaćeno",
  "milestones.pending": "Neisplaćeno",
  "milestones.releasedAt": "Isplaćeno {date}",
  "milestones.notReleased": "Čeka napredak radova",
  "milestones.progress": "{done} od {total} situacija",

  // ── Tab Knjiga doprinosa ──────────────────────────────────────────────────
  "ledger.title": "Knjiga doprinosa",
  "ledger.intro":
    "Javni zid. Svaki doprinos je vidljiv i vremenski označen — to je javni dokaz doprinosa, ne potvrda o ulaganju.",
  "ledger.who": "Tko",
  "ledger.amount": "Iznos",
  "ledger.when": "Kada",
  "ledger.rail.sepa": "SEPA",
  "ledger.rail.eure": "EURe",
  "ledger.rail.card": "Kartica",
  "ledger.share": "Udio u proizvedenoj energiji",
  "ledger.shareValue": "{bp} bp",
  "ledger.verified": "eID",
  "ledger.empty": "Još nema doprinosa.",
  "ledger.count": "{count} doprinosa",
  "ledger.txDemo": "Oznaka transakcije je izmišljena i ne postoji na mreži.",

  // ── Tab Dokumenti ─────────────────────────────────────────────────────────
  "documents.title": "Dokumenti",
  "documents.intro":
    "Popis pokazuje koji se dokumenti traže i je li priložen. Nositelj ih prilaže, mi ih ne izdajemo.",
  "documents.kind.site_right": "Pravo na lokaciju",
  "documents.kind.statute": "Statut",
  "documents.kind.installer_quote": "Ponuda instalatera",
  "documents.kind.grid_decision": "Priključak",
  "documents.kind.other": "Ostalo",
  "documents.issuedAt": "Izdano {date}",
  "documents.noDate": "Bez datuma",
  "documents.attached": "Priloženo",
  "documents.missing": "Nije priloženo u prototipu",
  "documents.missingHint":
    "U prototipu nijedan dokument ne postoji, pa ovdje nema poveznice. Lažna poveznica na nepostojeći dokument bila bi gora od prazne.",
  "documents.empty": "Za ovaj projekt nije naveden nijedan dokument.",

  // ── Tab Tijek (K1, docs/13) ───────────────────────────────────────────────
  "timeline.title": "Tijek",
  "timeline.intro":
    "Od predaje projekta do prve kilovatsatne proizvodnje. Pomaci i kašnjenja stoje ovdje, ne u mailu.",
  "timeline.step.submitted": "Projekt predan",
  "timeline.step.funded": "Cilj prikupljen",
  "timeline.step.signed": "Ugovor potpisan",
  "timeline.step.ordered": "Oprema naručena",
  "timeline.step.mounted": "Montaža dovršena",
  "timeline.step.connected": "Priključeno na mrežu",
  "timeline.planned": "Plan: {date}",
  "timeline.actual": "Ostvareno: {date}",
  "timeline.pending": "Predstoji",
  "timeline.unscheduled": "Rok još nije postavljen",
  "timeline.lateBy": "kasni {days} dana",
  "timeline.driftLate": "{days} dana kasnije od plana",
  "timeline.driftEarly": "{days} dana ranije od plana",
  "timeline.onTime": "Po planu",
  "timeline.lateBanner":
    "Ovaj projekt kasni za planom. Kašnjenje piše ovdje jer je, kad smo mi izvođač, to naše neispunjenje ugovora — ne vijest koju biramo hoćemo li poslati.",
  "timeline.asOf": "Stanje na dan {date}",

  // ── Tijek doprinosa (docs/07 §2.4) ────────────────────────────────────────
  "contribute.title": "Doprinos projektu",
  "contribute.stepOf": "Korak {step} od {total}",
  "contribute.step.amount": "Iznos",
  "contribute.step.who": "Tko si",
  "contribute.step.eid": "Identitet",
  "contribute.step.method": "Način",
  "contribute.step.confirm": "Potvrda",
  "contribute.amountLabel": "Koliko želiš doprinijeti",
  "contribute.amountHint": "Najmanji doprinos za ovaj projekt je {min}.",
  "contribute.amountCustom": "Drugi iznos",
  "contribute.amountTooLow": "Iznos je manji od najmanjeg doprinosa.",
  "contribute.nameLabel": "Ime uz doprinos",
  "contribute.namePlaceholder": "Ime i prezime ili naziv",
  "contribute.anonymous": "Upiši me kao anonimno",
  "contribute.messageLabel": "Poruka uz doprinos",
  "contribute.messagePlaceholder": "Nije obavezno",
  "contribute.eidTitle": "Prijava identiteta",
  "contribute.eidWhy":
    "Kod članskog uloga u zajednicu identitet je obavezan — članstvo je pravni odnos, ne anonimna uplata.",
  "contribute.eidSimulated":
    "U prototipu je prijava simulirana. Ne otvara se Certilia i ne šalje se nijedan podatak.",
  "contribute.eidConfirm": "Simuliraj prijavu",
  "contribute.eidDone": "Identitet potvrđen (simulirano)",
  "contribute.membershipTitle": "Pristupnica",
  "contribute.membershipNote":
    "Uz članski ulog dobivaš članstvo, glas u zajednici i udio u proizvedenoj energiji. Ne dobivaš pravo na novac.",
  "contribute.membershipShare": "Tvoj udio u proizvedenoj energiji bio bi otprilike {bp} bp.",
  "contribute.methodTitle": "Način uplate",
  "contribute.method.sepa": "SEPA nalog s uplatnim kodom",
  "contribute.method.sepaHint": "Klasičan nalog iz banke, na poziv na broj projekta.",
  "contribute.method.eure": "EURe izravno na račun projekta",
  "contribute.method.eureHint": "Za one koji već imaju novčanik.",
  "contribute.method.qr": "QR kod",
  "contribute.method.qrHint": "Skeniraj u mobilnom bankarstvu.",
  "contribute.confirmTitle": "Doprinos zabilježen",
  "contribute.confirmLead":
    "Ovo je ekran potvrde. U prototipu nije zatražena nijedna uplata i nijedan podatak nije poslan.",
  "contribute.summary": "Sažetak",
  "contribute.proofTitle": "Javni dokaz doprinosa",
  "contribute.proofNote":
    "Kad podaci postanu stvarni, doprinos se upisuje u knjigu doprinosa projekta, vremenski označen i javno provjerljiv.",
  "contribute.backToProject": "Natrag na projekt",
  "contribute.next": "Dalje",
  "contribute.prev": "Natrag",
  "contribute.finish": "Zabilježi doprinos",

  // ── Prebacivanje na svoje šine (P3, docs/07 §2.10) ────────────────────────
  "rails.title": "Prebaci na svoje šine",
  "rails.lead":
    "Novac može ići preko tvog računa, bez nas u sredini. Ovo je ono što tvrdnju da ne držimo tvoj novac čini provjerljivom umjesto marketinškom.",
  "rails.step1": "Unesi svoj Monerium IBAN",
  "rails.step2": "Poveži svoj Safe multisig",
  "rails.step3": "Potvrdi potpisnike i prag",
  "rails.step4": "Gotovo — novac više ne ide kroz nas",
  "rails.accountLevel": "Postavka vrijedi za sve tvoje projekte, ne samo za ovaj.",
  "rails.afterNote":
    "Nakon prebacivanja prestajemo biti potpisnik. Ako i dalje želiš da mi gradimo, to je zaseban odnos: plaćaš nas sa svog računa.",
  "rails.current": "Trenutno stanje",
  "rails.currentPlatform": "Novac ide preko našeg računa.",
  "rails.currentClient": "Novac već ide preko računa nositelja.",
  "rails.simulated": "U prototipu su svi koraci simulirani i ništa se ne sprema.",
  "rails.start": "Pokreni prebacivanje",
  "rails.done": "Prebacivanje je odigrano do kraja (simulirano).",

  // ── Projekti na ulaznom ekranu + lista čekanja (K4) ────────────────────────
  "projects.title": "Projekti koji traže suradnju",
  "projects.lead": "Elektrane koje se upravo grade zajedno.",
  "projects.none": "Trenutno nijedan projekt ne prikuplja.",
  "projects.noneHint":
    "To je normalno stanje između dva projekta, ne kvar. Ostavi kontakt i javimo ti kad krene sljedeći.",
  "projects.openCount": "{count} otvorenih",

  "waitlist.title": "Javi mi kad krene sljedeći projekt",
  "waitlist.lead":
    "Lista stoji trajno, i kad je projekt otvoren i kad nije. Nema smisla da netko dođe u krivom tjednu i nema gdje ostaviti trag.",
  "waitlist.emailLabel": "E-pošta",
  "waitlist.emailPlaceholder": "ime@primjer.hr",
  "waitlist.countyLabel": "Županija koja te zanima",
  "waitlist.anyCounty": "Bilo koja",
  "waitlist.submit": "Upiši me",
  "waitlist.invalid": "Upiši adresu e-pošte.",
  "waitlist.done": "Upisano — u prototipu.",
  "waitlist.doneHint":
    "Nijedna adresa nije poslana ni spremljena. Obrazac postoji da se vidi kako radi, a ne da prikuplja kontakte.",
  "waitlist.simulated": "Prototip: ništa se ne šalje ni ne sprema.",

  // ── Zajednice (docs/07 §2.5) ──────────────────────────────────────────────
  "communities.title": "Energetske zajednice",
  "communities.lede":
    "Zajednica je vidljiva i prije nego pravno postoji. Zamisao i priprema su normalna stanja, ne nedostatak.",
  "communities.count": "{registered} registrirano u Hrvatskoj, {shown} na ovoj stranici.",
  "communities.empty": "Nijedna zajednica nije upisana.",
  "communities.open": "Otvori zajednicu",

  "community.notFound": "Zajednica nije pronađena",
  "community.notFoundHint": "Možda je uklonjena ili je poveznica netočna.",
  "community.back": "Natrag na zajednice",
  "community.registration": "Registracija",
  "community.state.idea": "Zamisao",
  "community.state.preparing": "U pripremi",
  "community.state.filed": "Predano u registar",
  "community.state.registered": "Registrirana",
  "community.stateHint.idea": "Skupina ljudi s namjerom. Još nema dokumenata ni pravne osobe.",
  "community.stateHint.preparing": "Statut i osnivački dokumenti se pripremaju.",
  "community.stateHint.filed": "Predano nadležnom registru, čeka se rješenje.",
  "community.stateHint.registered": "Pravna osoba postoji i može sklapati ugovore.",
  "community.legalForm": "Pravni oblik",
  "community.legalForm.association": "Udruga",
  "community.legalForm.cooperative": "Zadruga",
  "community.legalForm.not_yet_registered": "Još nije registrirana",
  "community.oib": "OIB",
  "community.noOib": "Nema OIB dok registracija ne završi.",
  "community.members": "Članovi",
  "community.memberCount": "{count} članova",
  "community.role.member": "Član",
  "community.role.board": "Upravni odbor",
  "community.role.signer": "Potpisnik",
  "community.share": "Udio u proizvedenoj energiji",
  "community.joined": "Član od",
  "community.membersNote":
    "Registar članova vodi zajednica, ne mi. Ovdje se vidi samo ono što je potrebno da bude jasno tko potpisuje i koliki je čiji udio u energiji.",
  "community.safe": "Zajednički račun",
  "community.plants": "Elektrane",
  "community.noPlants": "Zajednica još nema elektranu.",
  "community.projects": "Projekti",
  "community.noProjects": "Zajednica trenutno nema otvoren projekt.",
  "community.statute": "Statut",
  "community.statuteMissing": "Statut nije priložen.",
  "community.guideTitle": "Što osnivanje stvarno košta",
  "community.guideCost": "Trošak osnivanja: od {amount}",
  "community.guideMonths": "Trajanje: više od {months} mjeseci",
  // Bez točke na kraju: hrvatski datum („15. rujna 2026.") već završava točkom.
  "community.guideSource": "Izvor: {source}, provjereno {date}",
  "community.guideNote":
    "Ovo ne radimo umjesto vas. Osnivanje je pravni posao, ne tehnički. Platforma nudi predložak statuta, popis koraka i procjenu troška — i ništa više od toga.",
  "community.guideSolves": "Što platforma stvarno rješava",
  "community.solves.capital": "Udruživanje sredstava bez posrednika.",
  "community.solves.proof": "Dokaz tko je koliko uložio, javan i vremenski označen.",
  "community.solves.control": "Kontrola tko smije potrošiti novac, kroz više potpisa.",
  "community.notSolves": "Što ne rješava",
  "community.notSolves.founding": "Osnivanje zajednice i trošak koji uz njega ide.",
  "community.notSolves.grid": "Priključak na mrežu.",
  "community.notSolves.billing":
    "Obračun raspodjele energije — to radi opskrbljivač ili operator distribucijskog sustava.",

  // ── Čarobnjak za novi projekt (docs/07 §2.7, docs/03 §8) ──────────────────
  "wizard.title": "Novi projekt",
  "wizard.lead":
    "Redoslijed pitanja nije stvar ukusa. Tip nositelja mijenja sve dalje, pa ide prvi.",
  "wizard.stepOf": "Korak {step} od {total}",
  "wizard.next": "Dalje",
  "wizard.prev": "Natrag",
  "wizard.required": "Ovo polje je obavezno.",
  "wizard.draftRestored": "Nacrt je vraćen iz prethodnog pokušaja.",
  "wizard.simulated":
    "Prototip: projekt se nigdje ne šalje. Nacrt se privremeno čuva samo u ovoj kartici preglednika.",

  "wizard.step.holder": "Nositelj",
  "wizard.step.model": "Model",
  "wizard.step.plant": "Elektrana",
  "wizard.step.siteRight": "Pravo na lokaciju",
  "wizard.step.cost": "Cilj i trošak",
  "wizard.step.account": "Račun",
  "wizard.step.description": "Opis",
  "wizard.step.review": "Pregled",

  "wizard.holderQuestion": "Tko je nositelj projekta?",
  "wizard.holderHint":
    "Nositelj sklapa ugovor, odgovara za dozvole i porezni tretman. O njemu ovisi koji su modeli uopće mogući.",
  "wizard.holderWarn.person":
    "Elektrana na privatnom krovu podiže vrijednost privatne imovine. Doprinos pojedincu nema poreznu zaštitu i lako postaje oporeziv primitak ili prikriveni ulog — model je čist kad je korisnik kolektivan.",
  "wizard.holderWarn.company":
    "Doprinos trgovačkom društvu je prihod i ulazi u poreznu osnovicu.",

  "wizard.modelQuestion": "Koji model?",
  "wizard.modelHint": "Model određuje što uplatitelj dobiva. To je pravna, ne stilska razlika.",
  "wizard.modelDisabledTitle": "Zašto su dva modela onemogućena",
  "wizard.modelC": "Zajam ili vlasnički udio",
  "wizard.modelCWhy":
    "Traži odobrenje HANFA-e kao pružatelja usluga skupnog financiranja. Nemamo ga, pa ga ne nudimo. Odluka o rokovima je tri mjeseca od urednog zahtjeva, uz test znanja, razdoblje razmišljanja i kapitalne zahtjeve.",
  "wizard.modelD": "Prenosivi udio s tržišnom cijenom",
  "wizard.modelDWhy":
    "Gotovo sigurno je vrijednosni papir. Traži zasebno društvo po elektrani, prospekt koji odobrava HANFA i nadzor nad trgovanjem. Izvan opsega platforme dok to ne postoji.",
  "wizard.modelDisabledNote":
    "Ova dva modela stoje na popisu namjerno. Ograničenje na prva dva je jedina stvar koja platformu drži izvan licence — mrtav gumb bez objašnjenja bio bi propuštena prilika da se to kaže.",
  "wizard.disabled": "Onemogućeno",

  "wizard.plantQuestion": "Koja elektrana?",
  "wizard.plantExisting": "Postojeća iz registra",
  "wizard.plantNew": "Nova elektrana",
  "wizard.plantSearch": "Traži po nazivu ili mjestu",
  "wizard.plantNewName": "Naziv nove elektrane",
  "wizard.plantNewCapacity": "Snaga (kWp)",
  "wizard.plantNewCounty": "Županija",
  "wizard.plantNoResults": "Nema elektrane koja odgovara pretrazi.",

  "wizard.siteRightQuestion": "Kakvo je pravo na lokaciju?",
  "wizard.siteRightHint":
    "Bez dokaza prava na lokaciju projekt se ne objavljuje. Elektrana mora stajati na krovu na koji nositelj ima uredno pravo.",
  "wizard.siteRightDoc": "Naziv dokumenta koji to dokazuje",

  "wizard.goalQuestion": "Koliko treba prikupiti?",
  "wizard.goalLabel": "Cilj (EUR)",
  "wizard.costTitle": "Razrada troška",
  "wizard.costHint":
    "Razrada je javna prije prve uplate. Ako gradimo mi, marža izvođača je stavka u ovoj tablici kao i svaka druga.",
  "wizard.costLabel": "Naziv stavke",
  "wizard.costAmount": "Iznos (EUR)",
  "wizard.costAdd": "Dodaj stavku",
  "wizard.costRemove": "Ukloni",
  "wizard.costTotal": "Zbroj razrade",
  "wizard.costMismatch": "Zbroj razrade ({total}) ne odgovara cilju ({goal}).",
  "wizard.costMatch": "Zbroj razrade odgovara cilju.",
  "wizard.surplusLabel": "Što se događa s viškom iznad cilja",
  "wizard.surplusHint":
    "Neutrošena sredstva postaju oporeziv primitak. Namjena viška se izjavljuje prije, ne poslije.",

  "wizard.accountQuestion": "Kako se otvara račun projekta?",
  "wizard.accountHint":
    "Račun traži više potpisa. Prag i broj potpisnika moraju odgovarati statutu nositelja — ovdje se ne postavlja nešto što statut ne poznaje.",
  "wizard.threshold": "Potrebno potpisa",
  "wizard.owners": "Ukupno potpisnika",
  "wizard.ourSigner": "Uključi naš potpis (gradimo mi)",
  "wizard.conflictOk": "Naš potpis ne čini većinu praga.",
  "wizard.conflictBad":
    "Ovakav račun ne prolazi: naš bi potpis činio većinu praga, pa bismo si mogli isplatiti bez članova.",
  "wizard.thresholdBad": "Prag ne može biti veći od broja potpisnika.",

  "wizard.descriptionQuestion": "Opis projekta",
  "wizard.descriptionHint":
    "Opis se provjerava prije predaje. Rečenica koja obeća financijsku korist premješta projekt u režim za koji platforma nema licencu.",
  "wizard.descriptionPlaceholder": "Što se gradi, za koga i zašto.",
  "wizard.blockedTitle": "Opis ne može proći",
  "wizard.blockedHint":
    "Makni označene izraze. Dopušteno je: doprinos, članski ulog, udio u proizvedenoj energiji, glas u zajednici, javni dokaz doprinosa, predujam na elektranu.",
  "wizard.blockedItem": "„{match}“ — {why}",
  "wizard.descriptionOk": "Opis prolazi provjeru.",

  "wizard.reviewTitle": "Pregled prije predaje",
  "wizard.submit": "Predaj na pregled",
  "wizard.submitted": "Projekt je predan na pregled — u prototipu.",
  "wizard.submittedHint":
    "Nijedan podatak nije poslan. U pravoj verziji projekt ide u stanje „u pregledu“ i objavljuje se tek nakon provjere nositelja i prava na lokaciju.",
  "wizard.startOver": "Počni ispočetka",

  // Zajedničko
  "common.of": "od",
  "common.close": "Zatvori",
  "common.showMore": "Prikaži još",
  "common.copy": "Kopiraj",
  "common.copied": "Kopirano",
} as const;

export type MessageKey = keyof typeof hr;
export type Catalog = Record<MessageKey, string>;

/**
 * Hrvatska naselja s koordinatama i županijom — geografska podloga za mock
 * registar (lib/mock.ts).
 *
 * Naselja i koordinate su STVARNI (to je zemljopis, ne podatak o elektrani).
 * Elektrane koje se na njih vežu su izmišljene i nose `demo: true`
 * (docs/00 pravilo 7: ne izmišljaj elektrane — a kad su izmišljene, to se vidi).
 *
 * `weight` je grubi relativni udio u broju krovnih elektrana: obala i Slavonija
 * imaju više sunca, Zagreb i okolica više krovova. Služi samo tome da mock skup
 * izgleda kao Hrvatska, a ne kao ravnomjerna rešetka — nije tvrdnja o tržištu.
 */
export interface Town {
  readonly name: string;
  readonly county: string;
  readonly lat: number;
  readonly lon: number;
  readonly weight: number;
}

export const TOWNS: readonly Town[] = [
  // Grad Zagreb i Zagrebačka
  { name: "Zagreb", county: "Grad Zagreb", lat: 45.815, lon: 15.982, weight: 30 },
  { name: "Sesvete", county: "Grad Zagreb", lat: 45.832, lon: 16.116, weight: 9 },
  { name: "Velika Gorica", county: "Zagrebačka", lat: 45.713, lon: 16.076, weight: 10 },
  { name: "Samobor", county: "Zagrebačka", lat: 45.803, lon: 15.711, weight: 8 },
  { name: "Zaprešić", county: "Zagrebačka", lat: 45.856, lon: 15.808, weight: 6 },
  { name: "Dugo Selo", county: "Zagrebačka", lat: 45.827, lon: 16.235, weight: 5 },
  { name: "Jastrebarsko", county: "Zagrebačka", lat: 45.669, lon: 15.647, weight: 4 },
  { name: "Vrbovec", county: "Zagrebačka", lat: 45.884, lon: 16.424, weight: 4 },
  { name: "Ivanić-Grad", county: "Zagrebačka", lat: 45.708, lon: 16.393, weight: 4 },

  // Krapinsko-zagorska
  { name: "Krapina", county: "Krapinsko-zagorska", lat: 46.161, lon: 15.879, weight: 4 },
  { name: "Zabok", county: "Krapinsko-zagorska", lat: 46.029, lon: 15.913, weight: 4 },
  { name: "Donja Stubica", county: "Krapinsko-zagorska", lat: 45.984, lon: 15.976, weight: 3 },
  { name: "Pregrada", county: "Krapinsko-zagorska", lat: 46.166, lon: 15.752, weight: 2 },
  { name: "Oroslavje", county: "Krapinsko-zagorska", lat: 46.006, lon: 15.921, weight: 2 },

  // Sisačko-moslavačka
  { name: "Sisak", county: "Sisačko-moslavačka", lat: 45.485, lon: 16.376, weight: 6 },
  { name: "Petrinja", county: "Sisačko-moslavačka", lat: 45.443, lon: 16.283, weight: 4 },
  { name: "Kutina", county: "Sisačko-moslavačka", lat: 45.483, lon: 16.778, weight: 4 },
  { name: "Novska", county: "Sisačko-moslavačka", lat: 45.339, lon: 16.978, weight: 3 },
  { name: "Glina", county: "Sisačko-moslavačka", lat: 45.339, lon: 16.093, weight: 2 },

  // Karlovačka
  { name: "Karlovac", county: "Karlovačka", lat: 45.487, lon: 15.548, weight: 6 },
  { name: "Ogulin", county: "Karlovačka", lat: 45.264, lon: 15.229, weight: 3 },
  { name: "Duga Resa", county: "Karlovačka", lat: 45.445, lon: 15.501, weight: 3 },
  { name: "Ozalj", county: "Karlovačka", lat: 45.61, lon: 15.475, weight: 2 },
  { name: "Slunj", county: "Karlovačka", lat: 45.113, lon: 15.585, weight: 2 },

  // Varaždinska
  { name: "Varaždin", county: "Varaždinska", lat: 46.308, lon: 16.338, weight: 8 },
  { name: "Ivanec", county: "Varaždinska", lat: 46.223, lon: 16.123, weight: 4 },
  { name: "Ludbreg", county: "Varaždinska", lat: 46.253, lon: 16.617, weight: 3 },
  { name: "Novi Marof", county: "Varaždinska", lat: 46.164, lon: 16.325, weight: 3 },

  // Koprivničko-križevačka
  { name: "Koprivnica", county: "Koprivničko-križevačka", lat: 46.163, lon: 16.828, weight: 6 },
  { name: "Križevci", county: "Koprivničko-križevačka", lat: 46.032, lon: 16.545, weight: 5 },
  { name: "Đurđevac", county: "Koprivničko-križevačka", lat: 46.038, lon: 17.068, weight: 3 },

  // Bjelovarsko-bilogorska
  { name: "Bjelovar", county: "Bjelovarsko-bilogorska", lat: 45.898, lon: 16.849, weight: 5 },
  { name: "Daruvar", county: "Bjelovarsko-bilogorska", lat: 45.591, lon: 17.225, weight: 3 },
  { name: "Garešnica", county: "Bjelovarsko-bilogorska", lat: 45.572, lon: 16.939, weight: 2 },
  { name: "Čazma", county: "Bjelovarsko-bilogorska", lat: 45.75, lon: 16.615, weight: 2 },

  // Primorsko-goranska
  { name: "Rijeka", county: "Primorsko-goranska", lat: 45.327, lon: 14.442, weight: 12 },
  { name: "Opatija", county: "Primorsko-goranska", lat: 45.338, lon: 14.305, weight: 5 },
  { name: "Crikvenica", county: "Primorsko-goranska", lat: 45.174, lon: 14.692, weight: 4 },
  { name: "Krk", county: "Primorsko-goranska", lat: 45.027, lon: 14.575, weight: 4 },
  { name: "Delnice", county: "Primorsko-goranska", lat: 45.401, lon: 14.799, weight: 2 },
  { name: "Mali Lošinj", county: "Primorsko-goranska", lat: 44.533, lon: 14.469, weight: 3 },
  { name: "Rab", county: "Primorsko-goranska", lat: 44.756, lon: 14.762, weight: 3 },

  // Ličko-senjska
  { name: "Gospić", county: "Ličko-senjska", lat: 44.546, lon: 15.374, weight: 3 },
  { name: "Senj", county: "Ličko-senjska", lat: 44.99, lon: 14.906, weight: 2 },
  { name: "Otočac", county: "Ličko-senjska", lat: 44.869, lon: 15.238, weight: 2 },
  { name: "Novalja", county: "Ličko-senjska", lat: 44.556, lon: 14.885, weight: 3 },

  // Virovitičko-podravska
  { name: "Virovitica", county: "Virovitičko-podravska", lat: 45.831, lon: 17.384, weight: 4 },
  { name: "Slatina", county: "Virovitičko-podravska", lat: 45.702, lon: 17.703, weight: 3 },
  { name: "Orahovica", county: "Virovitičko-podravska", lat: 45.534, lon: 17.884, weight: 2 },

  // Požeško-slavonska
  { name: "Požega", county: "Požeško-slavonska", lat: 45.34, lon: 17.675, weight: 4 },
  { name: "Pleternica", county: "Požeško-slavonska", lat: 45.288, lon: 17.804, weight: 2 },
  { name: "Pakrac", county: "Požeško-slavonska", lat: 45.437, lon: 17.189, weight: 2 },

  // Brodsko-posavska
  { name: "Slavonski Brod", county: "Brodsko-posavska", lat: 45.16, lon: 18.016, weight: 7 },
  { name: "Nova Gradiška", county: "Brodsko-posavska", lat: 45.256, lon: 17.383, weight: 3 },

  // Zadarska
  { name: "Zadar", county: "Zadarska", lat: 44.119, lon: 15.232, weight: 11 },
  { name: "Biograd na Moru", county: "Zadarska", lat: 43.938, lon: 15.451, weight: 4 },
  { name: "Benkovac", county: "Zadarska", lat: 44.035, lon: 15.611, weight: 3 },
  { name: "Pag", county: "Zadarska", lat: 44.444, lon: 15.058, weight: 3 },
  { name: "Obrovac", county: "Zadarska", lat: 44.202, lon: 15.68, weight: 2 },
  { name: "Nin", county: "Zadarska", lat: 44.242, lon: 15.18, weight: 3 },

  // Osječko-baranjska
  { name: "Osijek", county: "Osječko-baranjska", lat: 45.555, lon: 18.695, weight: 10 },
  { name: "Đakovo", county: "Osječko-baranjska", lat: 45.309, lon: 18.41, weight: 4 },
  { name: "Našice", county: "Osječko-baranjska", lat: 45.491, lon: 18.092, weight: 3 },
  { name: "Valpovo", county: "Osječko-baranjska", lat: 45.658, lon: 18.418, weight: 3 },
  { name: "Beli Manastir", county: "Osječko-baranjska", lat: 45.773, lon: 18.607, weight: 3 },
  { name: "Belišće", county: "Osječko-baranjska", lat: 45.681, lon: 18.407, weight: 2 },

  // Šibensko-kninska
  { name: "Šibenik", county: "Šibensko-kninska", lat: 43.735, lon: 15.89, weight: 7 },
  { name: "Knin", county: "Šibensko-kninska", lat: 44.042, lon: 16.199, weight: 3 },
  { name: "Vodice", county: "Šibensko-kninska", lat: 43.76, lon: 15.778, weight: 3 },
  { name: "Drniš", county: "Šibensko-kninska", lat: 43.86, lon: 16.157, weight: 2 },
  { name: "Primošten", county: "Šibensko-kninska", lat: 43.586, lon: 15.925, weight: 2 },

  // Vukovarsko-srijemska
  { name: "Vukovar", county: "Vukovarsko-srijemska", lat: 45.351, lon: 19.001, weight: 4 },
  { name: "Vinkovci", county: "Vukovarsko-srijemska", lat: 45.288, lon: 18.805, weight: 5 },
  { name: "Županja", county: "Vukovarsko-srijemska", lat: 45.076, lon: 18.696, weight: 3 },
  { name: "Ilok", county: "Vukovarsko-srijemska", lat: 45.223, lon: 19.376, weight: 2 },

  // Splitsko-dalmatinska
  { name: "Split", county: "Splitsko-dalmatinska", lat: 43.508, lon: 16.44, weight: 16 },
  { name: "Sinj", county: "Splitsko-dalmatinska", lat: 43.703, lon: 16.639, weight: 5 },
  { name: "Makarska", county: "Splitsko-dalmatinska", lat: 43.297, lon: 17.017, weight: 4 },
  { name: "Omiš", county: "Splitsko-dalmatinska", lat: 43.445, lon: 16.689, weight: 4 },
  { name: "Trogir", county: "Splitsko-dalmatinska", lat: 43.517, lon: 16.252, weight: 4 },
  { name: "Imotski", county: "Splitsko-dalmatinska", lat: 43.447, lon: 17.216, weight: 3 },
  { name: "Solin", county: "Splitsko-dalmatinska", lat: 43.542, lon: 16.492, weight: 5 },
  { name: "Kaštela", county: "Splitsko-dalmatinska", lat: 43.552, lon: 16.387, weight: 5 },
  { name: "Hvar", county: "Splitsko-dalmatinska", lat: 43.172, lon: 16.442, weight: 3 },
  { name: "Supetar", county: "Splitsko-dalmatinska", lat: 43.385, lon: 16.551, weight: 3 },

  // Istarska
  { name: "Pula", county: "Istarska", lat: 44.867, lon: 13.85, weight: 9 },
  { name: "Poreč", county: "Istarska", lat: 45.228, lon: 13.594, weight: 6 },
  { name: "Rovinj", county: "Istarska", lat: 45.081, lon: 13.639, weight: 5 },
  { name: "Pazin", county: "Istarska", lat: 45.24, lon: 13.937, weight: 3 },
  { name: "Labin", county: "Istarska", lat: 45.095, lon: 14.12, weight: 3 },
  { name: "Umag", county: "Istarska", lat: 45.432, lon: 13.524, weight: 4 },
  { name: "Buzet", county: "Istarska", lat: 45.409, lon: 13.966, weight: 2 },

  // Dubrovačko-neretvanska
  { name: "Dubrovnik", county: "Dubrovačko-neretvanska", lat: 42.65, lon: 18.094, weight: 6 },
  { name: "Metković", county: "Dubrovačko-neretvanska", lat: 43.054, lon: 17.649, weight: 3 },
  { name: "Ploče", county: "Dubrovačko-neretvanska", lat: 43.057, lon: 17.434, weight: 2 },
  { name: "Korčula", county: "Dubrovačko-neretvanska", lat: 42.96, lon: 17.136, weight: 2 },
  { name: "Opuzen", county: "Dubrovačko-neretvanska", lat: 43.014, lon: 17.564, weight: 2 },

  // Međimurska
  { name: "Čakovec", county: "Međimurska", lat: 46.389, lon: 16.434, weight: 6 },
  { name: "Prelog", county: "Međimurska", lat: 46.339, lon: 16.613, weight: 3 },
  { name: "Mursko Središće", county: "Međimurska", lat: 46.508, lon: 16.45, weight: 2 },
];

/** Granice Hrvatske za početni pogled karte: [zapad, jug, istok, sjever]. */
export const HR_BOUNDS: readonly [number, number, number, number] = [
  13.35, 42.35, 19.45, 46.6,
];

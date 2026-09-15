/**
 * Kopira maplibreov worker u `public/maplibre/` prije dev-a i builda.
 *
 * ⚠️ ZAŠTO OVO POSTOJI (zamka, ne stil):
 *
 * maplibre-gl 6 sam pronalazi svoj worker ovako:
 *
 *   let e = import.meta.url;
 *   if (!/^https?:/.test(e)) return "";          // ← ovdje pada
 *   return new URL("./maplibre-gl-worker.mjs", e).href;
 *
 * Turbopack (Next 16) prepiše `import.meta.url` u vrijednost koja NIJE
 * `http(s):`, pa funkcija vrati prazan string. Posljedica je tiha i lako se
 * krivo dijagnosticira: stil, sprite i TileJSON se dohvate s 200, canvas i
 * WebGL rade, ali nijedan `.pbf` se ne zatraži, `map.loaded()` ostaje `false`,
 * karta je prazna — i u konzoli NEMA nijedne greške.
 *
 * Rješenje je `setWorkerUrl()` (javni API) uz worker poslužen s vlastite
 * domene. Worker je ES modul koji uvozi `./maplibre-gl-shared.mjs` relativno
 * u odnosu na sebe, pa obje datoteke moraju stajati jedna uz drugu.
 *
 * Kopira se pri `predev`/`prebuild`, a ne commita, da se 500 kB vendoriranog
 * koda ne razidje s verzijom u `package.json`.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl.mjs"));
const target = join(process.cwd(), "public", "maplibre");

mkdirSync(target, { recursive: true });

// Worker i dijeljeni modul koji uvozi — oba, i to jedan uz drugi.
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(target, file));
}

console.log(`copy-maplibre-worker: public/maplibre/ osvježen iz maplibre-gl.`);

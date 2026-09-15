"use client";

/**
 * Karta Hrvatske s elektranama — docs/08.
 *
 * UZOR: `karta-hrvatske/apps/karta-web/src/hooks/usePinkaLayer.ts` (docs/10 §7).
 * Preuzeto: `loadingRef` umjesto state-a, `esc()` na svemu iz podataka, popup s
 * CTA-om, deep-link koji jednom odleti na značajku. Promijenjeno: izvor je mock,
 * boje su naše, i dodan je clustering.
 *
 * ⚠️ Pri 44.000 elektrana pojedinačni markeri su neupotrebljivi — clustering je
 * obavezan, s brojem u klasteru i ukupnim MW (docs/08 §3.1).
 *
 * ⚠️ `plants` je VEĆ filtriran skup. Karta ne filtrira ništa sama — to je ista
 * lista koju vidi i popis ispod (docs/07 §2.1).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  getWorkerUrl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useT } from "@/lib/i18n";
import { plantsToGeoJson } from "@/lib/geojson";
import { formatAggregateCapacity, formatKwp } from "@/lib/format";
import { HR_BOUNDS } from "@/lib/mock-geo";
import type { Plant } from "@/lib/types";
import {
  CREAM,
  INK,
  MARKER_COLOR_EXPRESSION,
  MARKER_RADIUS_EXPRESSION,
  MARKER_RING_RADIUS_EXPRESSION,
  MARKER_STROKE_COLOR_EXPRESSION,
  SAND_DEEP,
  SOLAR,
} from "@/lib/map-colors";

const SOURCE_ID = "plants";
const CLUSTER_LAYER = "plants-cluster";
const CLUSTER_COUNT_LAYER = "plants-cluster-count";
const POINT_LAYER = "plants-point";
const POINT_RING_LAYER = "plants-point-ring";

/** OpenFreeMap positron — bez ključa, ista podloga kao gis.domovina.ai. */
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

/**
 * ⚠️ Worker se mora postaviti ručno — inače karta ostane prazna BEZ greške.
 *
 * maplibre 6 traži svoj worker preko `import.meta.url` i odustane ako to nije
 * `http(s):` URL. Turbopack (Next 16) ga prepiše u nešto drugo, pa maplibre
 * dobije prazan URL: stil, sprite i TileJSON se dohvate s 200, canvas i WebGL
 * rade, ali nijedan `.pbf` se ne zatraži i `map.loaded()` zauvijek ostaje
 * `false`. U konzoli nema ničega.
 *
 * Datoteke vendorira `scripts/copy-maplibre-worker.mjs` pri `predev`/`prebuild`.
 * Vlastita domena, ne CDN — demo na sajmu mora raditi offline (docs/06 §6).
 */
const WORKER_URL = "/maplibre/maplibre-gl-worker.mjs";

/**
 * Podržava li preglednik WebGL. maplibre bez njega ne radi, a publika na sajmu
 * dolazi s vlastitim uređajima (docs/09 §6.6) — popis ispod tada nosi teret.
 */
function hasWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return (
      canvas.getContext("webgl2") !== null || canvas.getContext("webgl") !== null
    );
  } catch {
    return false;
  }
}

/** Escape svega što dolazi iz podataka i ide u popup HTML (uzor: `esc()`). */
function esc(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

interface Props {
  /** Već filtrirani skup — isti koji vidi popis. */
  readonly plants: readonly Plant[];
  /** Deep-link `?e={slug}` — doleti na elektranu i otvori popup jednom. */
  readonly focusSlug?: string | null;
}

export function PlantMap({ plants, focusSlug = null }: Props) {
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const focusedRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  // WebGL se provjeri jednom, prije pokušaja stvaranja karte. Tako se uobičajen
  // razlog neuspjeha (staro računalo na štandu, isključeno hardversko ubrzanje)
  // ne rješava kroz setState u efektu, nego je poznat već pri prvom renderu.
  // Komponenta se učitava dinamički s `ssr: false`, pa `window` ovdje postoji.
  const [webglAvailable] = useState(hasWebGl);

  // Prijevodi se čitaju unutar maplibre callbackova (popup se gradi kao HTML,
  // izvan Reacta). Ref drži svježu verziju bez ponovnog stvaranja karte pri
  // promjeni jezika; upisuje se u efektu, ne tijekom rendera.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const openPopup = useCallback(
    (map: MapLibreMap, feature: MapGeoJSONFeature) => {
      const p = feature.properties;
      if (p === null) return;
      const geometry = feature.geometry;
      if (geometry.type !== "Point") return;
      const [lon, lat] = geometry.coordinates as [number, number];

      const name = esc(String(p["name"] ?? ""));
      const place = esc(String(p["location_name"] ?? p["county"] ?? ""));
      const slug = esc(String(p["slug"] ?? ""));
      const kwp = Number(p["capacity_kwp"] ?? 0);
      const status = String(p["status"] ?? "planned");
      const grid = String(p["grid_status"] ?? "not_applicable");

      const statusLabel = esc(tRef.current(`status.${status}` as "status.planned"));
      const gridLabel = esc(tRef.current(`grid.${grid}` as "grid.connected"));
      const cta = esc(tRef.current("map.openPlant"));
      const demoNote = esc(tRef.current("demo.badge"));

      popupRef.current?.remove();
      popupRef.current = new Popup({
        closeButton: true,
        maxWidth: "280px",
        className: "plant-popup",
      })
        .setLngLat([lon, lat])
        .setHTML(
          `<div class="pm">
             <div class="pm-demo">${demoNote}</div>
             <div class="pm-name">${name}</div>
             <div class="pm-loc">${place}</div>
             <div class="pm-stats">${esc(formatKwp(kwp))} · ${statusLabel}</div>
             <div class="pm-grid">${gridLabel}</div>
             <a class="pm-cta" href="/elektrana/${slug}/">${cta}</a>
           </div>`,
        )
        .addTo(map);
    },
    [],
  );

  // Stvaranje karte — jednom.
  useEffect(() => {
    const container = containerRef.current;
    if (container === null || mapRef.current !== null) return;

    if (!webglAvailable) return;

    // Postavi prije prvog `new MapLibreMap` — nakon toga se worker pool već
    // podigao s praznim URL-om.
    if (getWorkerUrl() !== WORKER_URL) setWorkerUrl(WORKER_URL);

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container,
        style: STYLE_URL,
        bounds: [
          [HR_BOUNDS[0], HR_BOUNDS[1]],
          [HR_BOUNDS[2], HR_BOUNDS[3]],
        ],
        fitBoundsOptions: { padding: 24 },
        attributionControl: false,
      });
    } catch (error) {
      // Neočekivan kvar pri stvaranju karte. Popis ispod prikazuje isti skup,
      // pa stranica i dalje radi — karta ostaje na traci „učitavanje".
      console.error("[karta] stvaranje karte nije uspjelo", error);
      return;
    }

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    map.on("load", () => setReady(true));
    map.on("error", (e) => {
      console.error("[karta]", e.error?.message ?? e);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [webglAvailable]);

  // Izvor + slojevi — nakon `load`.
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !ready || map.getSource(SOURCE_ID) !== undefined) return;

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: plantsToGeoJson(plants),
      cluster: true,
      clusterMaxZoom: 11,
      clusterRadius: 52,
      // Ukupna snaga u klasteru — docs/08 §3.1 traži broj I ukupne MW.
      clusterProperties: { sumKwp: ["+", ["get", "capacity_kwp"]] },
    });

    map.addLayer({
      id: CLUSTER_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": SOLAR,
        "circle-opacity": 0.9,
        "circle-stroke-color": CREAM,
        "circle-stroke-width": 2,
        "circle-radius": [
          "step",
          ["get", "point_count"],
          16,
          10, 21,
          40, 27,
          120, 34,
        ],
      },
    });

    map.addLayer({
      id: CLUSTER_COUNT_LAYER,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-allow-overlap": true,
      },
      paint: { "text-color": INK },
    });

    // Prsten oko onih koje traže suradnju — docs/08 §3.1 „puni krug + prsten".
    map.addLayer({
      id: POINT_RING_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: ["all", ["!", ["has", "point_count"]], ["get", "seeking"]],
      paint: {
        "circle-color": "rgba(0,0,0,0)",
        "circle-radius": MARKER_RING_RADIUS_EXPRESSION,
        "circle-stroke-color": MARKER_COLOR_EXPRESSION,
        "circle-stroke-width": 1.5,
        "circle-stroke-opacity": 0.55,
      },
    });

    map.addLayer({
      id: POINT_LAYER,
      type: "circle",
      source: SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": MARKER_COLOR_EXPRESSION,
        "circle-radius": MARKER_RADIUS_EXPRESSION,
        "circle-stroke-color": MARKER_STROKE_COLOR_EXPRESSION,
        "circle-stroke-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          2.6,
          1.3,
        ],
        "circle-opacity": 0.92,
      },
    });
    // `plants` namjerno nije u ovisnostima — slojevi se dodaju jednom, a
    // podaci se osvježavaju u sljedećem efektu (`setData`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Osvježavanje podataka kad se promijeni filtrirani skup.
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !ready) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (source === undefined) return;
    popupRef.current?.remove();
    popupRef.current = null;
    source.setData(plantsToGeoJson(plants));
  }, [plants, ready]);

  // Interakcija: klik na klaster → približi; klik na marker → popup.
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !ready) return;

    let hovered: string | number | null = null;

    const onClusterClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (feature === undefined) return;
      const clusterId = feature.properties?.["cluster_id"];
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (source === undefined || typeof clusterId !== "number") return;
      void source.getClusterExpansionZoom(clusterId).then((zoom) => {
        if (feature.geometry.type !== "Point") return;
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom,
          duration: 450,
        });
      });
    };

    const onPointClick = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (feature === undefined) return;
      openPopup(map, feature);
    };

    const onMove = (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (feature === undefined) return;
      const id = feature.id;
      if (id === undefined) return;
      if (hovered !== null && hovered !== id) {
        map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: false });
      }
      hovered = id;
      map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
      map.getCanvas().style.cursor = "pointer";
    };

    const onLeave = () => {
      if (hovered !== null) {
        map.setFeatureState({ source: SOURCE_ID, id: hovered }, { hover: false });
        hovered = null;
      }
      map.getCanvas().style.cursor = "";
    };

    const onClusterEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    map.on("click", CLUSTER_LAYER, onClusterClick);
    map.on("click", POINT_LAYER, onPointClick);
    map.on("mousemove", POINT_LAYER, onMove);
    map.on("mouseleave", POINT_LAYER, onLeave);
    map.on("mouseenter", CLUSTER_LAYER, onClusterEnter);
    map.on("mouseleave", CLUSTER_LAYER, onLeave);

    return () => {
      map.off("click", CLUSTER_LAYER, onClusterClick);
      map.off("click", POINT_LAYER, onPointClick);
      map.off("mousemove", POINT_LAYER, onMove);
      map.off("mouseleave", POINT_LAYER, onLeave);
      map.off("mouseenter", CLUSTER_LAYER, onClusterEnter);
      map.off("mouseleave", CLUSTER_LAYER, onLeave);
    };
  }, [ready, openPopup]);

  // Deep-link — odleti na elektranu jednom (uzor: `focusedRef` u usePinkaLayer).
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !ready) return;
    if (focusSlug === null || focusedRef.current === focusSlug) return;
    const target = plants.find((p) => p.slug === focusSlug);
    if (target === undefined || target.latitude === null || target.longitude === null) return;
    focusedRef.current = focusSlug;
    map.easeTo({ center: [target.longitude, target.latitude], zoom: 13, duration: 900 });
  }, [focusSlug, plants, ready]);

  if (!webglAvailable) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-1 rounded-md border border-ink/8 bg-sand p-6 text-center">
        <p className="text-sm font-medium text-inkSoft">{t("map.unavailable")}</p>
        <p className="text-sm text-inkMuted">{t("map.unavailableHint")}</p>
      </div>
    );
  }

  const total = plants.reduce((sum, p) => sum + (p.capacity_kwp ?? 0), 0);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-ink/8">
      <div ref={containerRef} className="h-full w-full" aria-label={t("map.title")} />
      {!ready ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sand text-sm text-inkMuted"
          style={{ backgroundColor: SAND_DEEP }}
        >
          {t("map.loading")}
        </div>
      ) : null}
      {ready && plants.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-max rounded-sm bg-cream/95 px-3 py-1.5 text-xs text-inkMuted shadow-soft">
          {t("map.emptyView")}
        </div>
      ) : null}
      {ready && plants.length > 0 ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-sm bg-cream/95 px-2.5 py-1 text-[11px] text-inkMuted shadow-soft">
          {t("map.cluster", { count: plants.length })} ·{" "}
          {t("map.clusterCapacity", { capacity: formatAggregateCapacity(total) })}
        </div>
      ) : null}
    </div>
  );
}

"use client";

/**
 * Dijagram toka novca za uže ekrane (<1024px) — Mermaid (docs/06 §5).
 *
 * Graf se NE piše ovdje. Cijeli izvor je `lib/energy-machine.ts`; ova datoteka
 * ga samo prevodi u mermaid sintaksu. Ako se čvor doda ondje, pojavi se i ovdje
 * i u React Flow prikazu — dvije ručno održavane slike raziđu se tiho.
 *
 * ⚠️ ČEKAJ `document.fonts` PRIJE `mermaid.render` (CLAUDE.md §Naučene zamke,
 * iz `zef-novcanik-prototip`). Inače mermaid mjeri širinu čvorova fallback
 * fontom i tekst se odsiječe — kvar koji se vidi tek na tuđem uređaju.
 *
 * ⚠️ Bez `useState` za rezultat: mermaid vraća SVG string, koji se upisuje
 * izravno u DOM kroz ref. `setState` iz efekta ruši lint
 * (`react-hooks/set-state-in-effect`, dnevnik §7.6), a ovdje ga i ne treba —
 * mermaid je vanjski crtač, kao i maplibre.
 */
import { useEffect, useId, useRef } from "react";
import {
  edges,
  nodes,
  type EdgeId,
  type NodeId,
  type Scenario,
} from "@/lib/energy-machine";
import { scenarioSubset } from "@/lib/energy-machine";
import {
  BORDER_SOLID,
  CREAM,
  INK,
  INK_MUTED,
  SAND,
  SOLAR,
  SOLAR_INK,
} from "@/lib/diagram-colors";
import type { Locale } from "@/lib/i18n";

/** Mermaid labele ne podnose navodnike ni prelome — jedan red, bez znakova. */
function safeLabel(text: string): string {
  return text.replace(/["'`<>]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Graf → mermaid izvor.
 *
 * Čvorovi izvan scenarija ostaju NACRTANI, samo prigušeni: scenarij se tako
 * čita kao dio cjeline, a ne kao druga slika (isti izbor kao React Flow prikaz).
 */
export function toMermaid(
  scenario: Scenario,
  locale: Locale,
  activeEdge: EdgeId | null,
): string {
  const subset = scenarioSubset(scenario);
  const lines: string[] = ["flowchart TD"];

  for (const node of nodes) {
    const label = safeLabel(node.title[locale]);
    const shape = node.kind === "outcome" ? `([${label}])` : `["${label}"]`;
    lines.push(`  ${node.id}${shape}`);
  }

  for (const edge of edges) {
    const used = subset.edges.has(edge.id);
    const label = safeLabel(edge.label[locale]);
    // Neiskorištena veza ostaje točkasta — vidi se da postoji, ali ne sudjeluje.
    const arrow = used ? `-- "${label}" -->` : `-. "${label}" .->`;
    lines.push(`  ${edge.source} ${arrow} ${edge.target}`);
  }

  for (const node of nodes) {
    const inScenario = subset.nodes.has(node.id);
    lines.push(`  class ${node.id} ${inScenario ? "on" : "off"}`);
  }

  if (activeEdge !== null && subset.edges.has(activeEdge)) {
    const index = edges.findIndex((edge) => edge.id === activeEdge);
    if (index >= 0) {
      lines.push(`  linkStyle ${index} stroke:${SOLAR},stroke-width:3px`);
    }
  }

  lines.push(`  classDef on fill:${CREAM},stroke:${INK},stroke-width:1.5px,color:${INK}`);
  // ⚠️ Samo heks boje — `rgba()` ovdje razbije parser i dijagram tiho nestane
  // (vidi `BORDER_SOLID` u lib/diagram-colors.ts).
  lines.push(`  classDef off fill:${SAND},stroke:${BORDER_SOLID},color:${INK_MUTED}`);

  return lines.join("\n");
}

interface Props {
  readonly scenario: Scenario;
  readonly locale: Locale;
  readonly activeEdge: EdgeId | null;
  /** Čvor na kojem novac trenutno stoji — dobiva jantarni obrub. */
  readonly activeNode: NodeId | null;
  /** Što pisati ako se dijagram ne uspije nacrtati. */
  readonly failureText: string;
}

export function MoneyFlowMermaid({
  scenario,
  locale,
  activeEdge,
  activeNode,
  failureText,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  // `useId` daje stabilan ključ i na poslužitelju i na klijentu; mermaid traži
  // jedinstven id po renderu, inače dva dijagrama na stranici gaze jedan drugog.
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const source = toMermaid(scenario, locale, activeEdge);

  useEffect(() => {
    let cancelled = false;
    const element = host.current;
    if (element === null) return;

    const run = async (): Promise<void> => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
        flowchart: { curve: "basis", padding: 12, useMaxWidth: true },
        themeVariables: {
          background: "transparent",
          primaryColor: CREAM,
          primaryTextColor: INK,
          primaryBorderColor: INK,
          lineColor: INK_MUTED,
          fontSize: "13px",
        },
      });

      // ⚠️ Tek SADA se smije crtati (vidi zaglavlje). `document.fonts` ne
      // postoji u svakom pregledniku, pa je čekanje uvjetno, a ne obavezno.
      if (typeof document !== "undefined" && "fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          // Font se nije učitao — dijagram je i dalje čitljiv, samo užeg fonta.
        }
      }
      if (cancelled) return;

      const { svg } = await mermaid.render(`flow-${baseId}-${Date.now()}`, source);
      if (cancelled) return;
      element.innerHTML = svg;

      if (activeNode !== null) {
        // Mermaid ispisuje id čvora u `id` atributu oblika `flowchart-<id>-N`.
        const target = element.querySelector<SVGGElement>(`g[id*="-${activeNode}-"]`);
        const shape = target?.querySelector<SVGElement>("rect, polygon, path");
        if (shape !== null && shape !== undefined) {
          shape.style.stroke = SOLAR;
          shape.style.strokeWidth = "3px";
          shape.style.fill = CREAM;
        }
        const text = target?.querySelector<SVGElement>("text, .nodeLabel");
        if (text !== null && text !== undefined) text.style.fill = SOLAR_INK;
      }
    };

    // ⚠️ Kvar se PRIKAZUJE, ne prešućuje. Dijagram koji tiho ostane prazan je
    // ista klasa greške kao maplibre worker koji se ne podigne bez poruke — i
    // upravo se to dogodilo prvi put, na `rgba()` u `classDef`.
    void run().catch((error: unknown) => {
      if (cancelled || element === null) return;
      element.textContent = failureText;
      console.error("[money-flow] mermaid nije nacrtan:", error);
    });
    return () => {
      cancelled = true;
    };
  }, [source, baseId, activeNode, failureText]);

  return (
    <div
      ref={host}
      // Dijagram je slika toka; opis stoji u koracima ispod, koje čitač ekrana
      // čita kao tekst.
      aria-hidden="true"
      className="flex w-full justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
    />
  );
}

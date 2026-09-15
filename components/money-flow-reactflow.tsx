"use client";

/**
 * Dijagram toka novca za šire ekrane (≥1024px) — React Flow (docs/06 §5).
 *
 * Kao i Mermaid prikaz, ovdje se graf NE piše — dolazi iz
 * `lib/energy-machine.ts`. Jedina razlika između dva prikaza smije biti kako
 * izgledaju, nikad što prikazuju.
 *
 * ⚠️ React Flow traži svoj CSS. Uvozi se OVDJE, a ne u `globals.css`, da ga ne
 * plaćaju stranice bez dijagrama — isti razlog iz kojeg se maplibre stil uvozi
 * u `plant-map.tsx`.
 */
import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  edges as machineEdges,
  nodes as machineNodes,
  scenarioSubset,
  type EdgeId,
  type NodeId,
  type Scenario,
} from "@/lib/energy-machine";
import {
  BORDER,
  CREAM,
  INK,
  INK_MUTED,
  INK_SOFT,
  SAND,
  SOLAR,
  SOLAR_INK,
  SOLAR_SOFT,
} from "@/lib/diagram-colors";
import type { Locale } from "@/lib/i18n";

interface Props {
  readonly scenario: Scenario;
  readonly locale: Locale;
  readonly activeEdge: EdgeId | null;
  readonly activeNode: NodeId | null;
}

export function MoneyFlowReactFlow({ scenario, locale, activeEdge, activeNode }: Props) {
  const subset = useMemo(() => scenarioSubset(scenario), [scenario]);

  const nodes = useMemo<Node[]>(
    () =>
      machineNodes.map((node) => {
        const inScenario = subset.nodes.has(node.id);
        const isActive = node.id === activeNode;
        return {
          id: node.id,
          position: { x: node.x, y: node.y },
          data: { label: node.title[locale] },
          // Čvor izvan scenarija ostaje nacrtan, samo prigušen — scenarij se
          // tada čita kao dio cjeline, a ne kao druga slika.
          style: {
            width: 190,
            padding: "10px 12px",
            borderRadius: 12,
            border: `${isActive ? 2 : 1}px solid ${
              isActive ? SOLAR : inScenario ? INK : BORDER
            }`,
            background: isActive ? SOLAR_SOFT : inScenario ? CREAM : SAND,
            color: isActive ? SOLAR_INK : inScenario ? INK : INK_MUTED,
            fontSize: 13,
            fontWeight: inScenario ? 600 : 400,
            textAlign: "center" as const,
            opacity: inScenario ? 1 : 0.55,
          },
          // Ishod (elektrana) nema izlaznu vezu i to se vidi po obliku.
          type: node.kind === "outcome" ? "output" : "default",
          // ⚠️ Tok je VODORAVAN, pa i hvatišta moraju biti lijevo/desno.
          // Zadano je gore/dolje, i s njim strelice cik-cakaju kroz čvorove
          // umjesto da teku — vidjelo se tek u pregledniku, ne u kodu.
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          selectable: false,
          draggable: false,
          connectable: false,
        };
      }),
    [subset, locale, activeNode],
  );

  const edges = useMemo<Edge[]>(
    () =>
      machineEdges.map((edge) => {
        const inScenario = subset.edges.has(edge.id);
        const isActive = edge.id === activeEdge;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label[locale],
          animated: isActive,
          type: edge.lateral === true ? "smoothstep" : "default",
          style: {
            stroke: isActive ? SOLAR : inScenario ? INK_SOFT : BORDER,
            strokeWidth: isActive ? 2.5 : inScenario ? 1.5 : 1,
            strokeDasharray: inScenario ? undefined : "4 4",
          },
          labelStyle: {
            fill: isActive ? SOLAR_INK : inScenario ? INK_SOFT : INK_MUTED,
            fontSize: 11,
          },
          labelBgStyle: { fill: CREAM, fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
        };
      }),
    [subset, locale, activeEdge],
  );

  return (
    // Graf je širok i nizak (sedam čvorova u nizu + jedna grana ispod), pa mu
    // `fitView` ionako mjeri širinu. Viši okvir bi samo dodao prazninu ispod.
    <div className="h-[340px] w-full rounded-md border border-ink/8 bg-cream">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.14 }}
        proOptions={{ hideAttribution: false }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
        preventScrolling={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color={BORDER} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

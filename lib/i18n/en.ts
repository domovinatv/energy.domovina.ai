/**
 * English catalogue — DERIVED from `hr.ts`, which is the source of truth.
 *
 * Typed as `Catalog`, so a missing or stale key fails `tsc` instead of
 * silently falling through in production. Change both catalogues together.
 *
 * ⚠️ The same legal boundary applies here, and the forbidden list is longer in
 * English: yield · return · roi · dividend · interest · profit share ·
 * secondary market · sell your share (docs/03 §3). `scripts/check-copy.ts`
 * checks this file too.
 */
import type { Catalog } from "./hr";

export const en: Catalog = {
  "nav.registry": "Map and registry",
  "nav.communities": "Communities",
  "nav.how": "How it works",
  "nav.skipToContent": "Skip to content",
  "nav.menu": "Menu",

  "lang.switch": "Language",
  "lang.hr": "Hrvatski",
  "lang.en": "English",

  "demo.bar": "Prototype. Every figure on this page is made up and exists to show the interface.",
  "demo.barShort": "Prototype — made-up data",
  "demo.badge": "Demo",
  "demo.plantNotice":
    "This plant is made up. It exists to show how the interface works, not to describe a real installation.",
  "demo.noChain":
    "The account address is derived from the project name and is not real. Do not send anything to it.",

  "home.title": "Croatia's sun, in shared ownership",
  "home.lede":
    "The law has allowed shared ownership of a power plant since 2021. Croatia has three such communities. We are building the fourth — and making it easier than the first three.",
  "home.coverage": "{total} plants are connected in Croatia. {shown} of them are on this map.",
  "home.coverageNote":
    "The registry is not complete yet, and we say so. Public registers may only be used once the data licence is settled.",

  "stats.plants": "plants",
  "stats.capacity": "total capacity",
  "stats.operational": "operational",
  "stats.seeking": "seeking partners",
  "stats.awaitingGrid": "waiting on the grid",
  "stats.filtered": "in the selected set",

  "filter.title": "Filters",
  "filter.county": "County",
  "filter.allCounties": "All counties",
  "filter.status": "Status",
  "filter.allStatuses": "All statuses",
  "filter.gridStatus": "Grid connection",
  "filter.allGridStatuses": "All connection states",
  "filter.capacity": "Capacity",
  "filter.allCapacities": "All capacities",
  "filter.seeking": "Only those seeking partners",
  "filter.search": "Search",
  "filter.searchPlaceholder": "Name, town or county",
  "filter.reset": "Clear filters",
  "filter.resultCount": "Showing {count} of {total} plants",
  "filter.empty": "No plant matches the selected filters.",
  "filter.emptyHint": "Clear the filters or widen the capacity range.",

  "map.title": "Map",
  "map.loading": "Loading map…",
  "map.unavailable": "The map cannot be displayed in this browser.",
  "map.unavailableHint": "The list below shows the same set of plants.",
  "map.cluster": "{count} plants",
  "map.clusterCapacity": "{capacity} in total",
  "map.zoomIn": "Zoom in",
  "map.zoomOut": "Zoom out",
  "map.resetView": "All of Croatia",
  "map.attribution": "Basemap: OpenFreeMap · OpenStreetMap contributors",
  "map.legend": "Legend",
  "map.openPlant": "Open plant",
  "map.emptyView": "No plants in this view.",

  "list.title": "Plants",
  "list.sameSet": "The list shows the same set as the map.",

  "status.planned": "Planned",
  "status.under_construction": "Under construction",
  "status.operational": "Operational",
  "status.decommissioned": "Decommissioned",

  "grid.not_applicable": "Off-grid",
  "grid.not_requested": "Not requested",
  "grid.requested": "Request submitted",
  "grid.approved": "Approval issued",
  "grid.connected": "Connected",
  "grid.rejected": "Request rejected",
  "grid.label": "Grid connection",
  "grid.requestedAt": "Request submitted on {date}.",
  "grid.warning":
    "No grid connection has been requested yet. A plant without a connection cannot feed the grid.",

  "owner.person": "Private individual",
  "owner.association": "Association",
  "owner.cooperative": "Cooperative",
  "owner.company": "Company",
  "owner.municipality": "Town or municipality",
  "owner.community": "Energy community",
  "owner.label": "Owner",

  "plant.notFound": "Plant not found",
  "plant.notFoundHint": "It may have been removed from the registry, or the link is wrong.",
  "plant.back": "Back to the registry",
  "plant.capacity": "Capacity",
  "plant.annualProduction": "Annual production",
  "plant.annualProductionEstimate": "Estimate",
  "plant.productionDisclaimer":
    "Estimated from installed capacity and location. Actual output is not metered here — that is done by the supplier or the distribution system operator.",
  "plant.commissioned": "Operational since",
  "plant.location": "Location",
  "plant.county": "County",
  "plant.verifiedOwner": "eID-verified owner",
  "plant.tech": "Technical details",
  "plant.tech.panels": "Panels",
  "plant.tech.inverters": "Inverters",
  "plant.tech.mounting": "Mounting",
  "plant.tech.unknown": "No technical details recorded.",
  "plant.onMap": "On the map",
  "plant.coordinates": "Coordinates",
  "plant.noProject": "This plant has no open project.",
  "plant.noProjectHint":
    "A plant can exist in the registry without any project. The registry is public and needs no sign-in.",
  "plant.hasProject": "This plant is seeking partners",
  "plant.openProject": "Open the project",
  "plant.raisedOf": "{raised} of {goal}",
  "plant.nearby": "Nearby",

  "model.donation": "Contribution",
  "model.community": "Membership stake in a community",
  "model.label": "Model",
  "model.noPromise": "We do not offer a financial gain or a share of profit.",
  "model.donationExplain":
    "A contribution funds construction. It grants no claim to money and no share of profit.",
  "model.communityExplain":
    "A membership stake grants membership, a vote in the community, and a share of the energy produced. It grants no claim to money.",
  "conflict.disclosure":
    "The contractor for this project is {contractor}. Paying out of the project account takes {threshold} of {owners} signatures, and only one of them is ours.",

  "footer.about": "About the platform",
  "footer.disclaimerTitle": "Regulatory notice",
  "footer.disclaimer":
    "{operator} is a non-custodial software provider. Funds never pass through the platform and the platform never holds keys. Regulated e-money functions are performed by Monerium (EMI, MiCA EMT). The platform is not a crowdfunding service provider under Regulation (EU) 2020/1503, is not an investment firm, and gives no investment advice. The project organiser is responsible for legal form, permits and tax treatment.",
  "footer.noCommission":
    "We take no percentage of the money raised. We earn as the contractor — on building the plant — and the price of that work is public in every project's cost breakdown.",
  "footer.impressum": "Company details",
  "footer.director": "Director",
  "footer.court": "Register",
  "footer.stage": "Closed beta",
  "footer.docs": "Knowledge base",

  "common.of": "of",
  "common.close": "Close",
  "common.showMore": "Show more",
  "common.copy": "Copy",
  "common.copied": "Copied",
};

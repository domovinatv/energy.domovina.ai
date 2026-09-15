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

  // ── Marketplace: project (docs/07 §2.3) ───────────────────────────────────
  "nav.newProject": "New project",

  "project.notFound": "Project not found",
  "project.notFoundHint": "It may have been withdrawn, or the link is wrong.",
  "project.back": "Back to the registry",
  "project.toPlant": "Open the plant",
  "project.holder": "Project holder",
  "project.holderOib": "Holder's company number",
  "project.goal": "Goal",
  "project.raised": "Raised",
  "project.remaining": "Still needed",
  "project.contributors": "Contributors",
  "project.minContribution": "Smallest contribution",
  "project.deadline": "Closes",
  "project.noDeadline": "No closing date",
  "project.daysLeft": "{days} days left",
  "project.deadlinePassed": "the closing date has passed",
  "project.contribute": "Contribute",
  "project.closed": "This project is not taking contributions right now.",
  "project.closedHint":
    "Either the round is closed or the project has moved into construction. The build log stays public either way.",
  "project.maxCoowners": "Co-owner limit",
  "project.maxCoownersNote":
    "The cap is deliberate. Administering a very large number of co-owners is what killed Sun Exchange, and we take no percentage to pay for it.",
  "project.surplusTitle": "What happens to money above the goal",
  "project.siteRightLabel": "Right to the site",
  "project.siteRight.owner": "Ownership",
  "project.siteRight.co_owner_consent": "Co-owners' consent",
  "project.siteRight.building_right": "Right to build",
  "project.siteRight.lease": "Lease",
  "project.siteRightNote":
    "No project is published without proof of the right to the site. A share in a plant on somebody else's roof, with the paperwork unfinished, is exactly what RealT was sued over.",

  "project.state.draft": "Draft",
  "project.state.review": "In review",
  "project.state.active": "Open",
  "project.state.funded": "Fully funded",
  "project.state.expired": "Closed",
  "project.state.building": "Under construction",
  "project.state.completed": "Completed",

  "project.mode.integrated": "We build it",
  "project.mode.byo": "Their own rails",
  "project.mode.integratedExplain":
    "The holder ordered the work from us. The money sits in the project account and is released against progress, each time with the members' signatures.",
  "project.mode.byoExplain":
    "The holder uses their own account and their own contractor. The money never passes through us and we hold no signature on this account.",

  "project.tab.overview": "Overview",
  "project.tab.plant": "Plant",
  "project.tab.funding": "Funding",
  "project.tab.account": "Account",
  "project.tab.milestones": "Stages",
  "project.tab.ledger": "Contribution book",
  "project.tab.documents": "Documents",
  "project.tab.timeline": "Progress",

  // ── Funding tab (P5, docs/14 §3.1) ────────────────────────────────────────
  "funding.title": "Cost breakdown",
  "funding.intro":
    "Every line is here before anyone pays anything. That is the price of claiming we take no percentage of the money raised.",
  "funding.item": "Line",
  "funding.amount": "Amount",
  "funding.total": "Total",
  "funding.matchesGoal": "The breakdown adds up to the project goal.",
  "funding.margin": "Our margin",
  "funding.marginShare": "{share} of the total build cost",
  "funding.marginNote":
    "We take no percentage of the money raised. We earn as the contractor, on building the plant, and that amount is a line of its own in this table.",
  "funding.noMargin": "We are not the contractor on this project.",
  "funding.noMarginNote":
    "The holder builds with a contractor of their choosing. We earn nothing from this project and hold no signature on its account.",

  // ── Account tab (docs/07 §2.3, docs/14 §4) ────────────────────────────────
  "account.title": "Project account",
  "account.address": "Address",
  "account.chain": "Network",
  "account.threshold": "Signatures required",
  "account.thresholdValue": "{threshold} of {owners}",
  "account.signers": "Signatories",
  "account.ourSigners": "Signatures held by us: {count}",
  "account.noOurSigners": "We hold no signature on this account.",
  "account.whyThreshold":
    "Nothing leaves the project account without the members' signatures. That is the main protection against a contractor paying itself, and the real reason the account has more than one signatory.",
  "account.deployed": "The account is open",
  "account.counterfactual": "The address is computed in advance; the account opens on the first transaction.",
  "account.explorerDemo":
    "The address is derived from the project name and does not exist on any network, so there is no block explorer link here. Once the data is real, the link belongs in this spot.",
  "account.switchRails": "Switch to your own rails",
  "account.switchRailsHint":
    "In a few steps the holder can move to their own account and their own contractor.",

  // ── Stages tab (P6, docs/14 §5.1) ─────────────────────────────────────────
  "milestones.title": "Paid against progress",
  "milestones.intro":
    "Money is not paid up front but against progress on site, each time with the members' signatures. That is why the unreleased part stays with them if the contractor fails to deliver.",
  "milestones.released": "Released",
  "milestones.pending": "Not released",
  "milestones.releasedAt": "Released {date}",
  "milestones.notReleased": "Waiting on progress",
  "milestones.progress": "{done} of {total} stages",

  // ── Contribution book tab ─────────────────────────────────────────────────
  "ledger.title": "Contribution book",
  "ledger.intro":
    "A public wall. Every contribution is visible and time-stamped — public proof that it was made, not a certificate of investment.",
  "ledger.who": "Who",
  "ledger.amount": "Amount",
  "ledger.when": "When",
  "ledger.rail.sepa": "SEPA",
  "ledger.rail.eure": "EURe",
  "ledger.rail.card": "Card",
  "ledger.share": "Share of the energy produced",
  "ledger.shareValue": "{bp} bp",
  "ledger.verified": "eID",
  "ledger.empty": "No contributions yet.",
  "ledger.count": "{count} contributions",
  "ledger.txDemo": "The transaction reference is made up and exists on no network.",

  // ── Documents tab ─────────────────────────────────────────────────────────
  "documents.title": "Documents",
  "documents.intro":
    "The list shows which documents are required and whether each is attached. The holder attaches them; we do not issue them.",
  "documents.kind.site_right": "Right to the site",
  "documents.kind.statute": "Statute",
  "documents.kind.installer_quote": "Installer's quote",
  "documents.kind.grid_decision": "Grid connection",
  "documents.kind.other": "Other",
  "documents.issuedAt": "Issued {date}",
  "documents.noDate": "No date",
  "documents.attached": "Attached",
  "documents.missing": "Not attached in the prototype",
  "documents.missingHint":
    "No document exists in the prototype, so there is no link here. A link to a document that does not exist would be worse than none.",
  "documents.empty": "No documents are listed for this project.",

  // ── Progress tab (K1, docs/13) ────────────────────────────────────────────
  "timeline.title": "Progress",
  "timeline.intro":
    "From the project being filed to the first kilowatt-hour. Slippage and delays live here, not in an email.",
  "timeline.step.submitted": "Project filed",
  "timeline.step.funded": "Goal reached",
  "timeline.step.signed": "Contract signed",
  "timeline.step.ordered": "Equipment ordered",
  "timeline.step.mounted": "Installation finished",
  "timeline.step.connected": "Connected to the grid",
  "timeline.planned": "Planned: {date}",
  "timeline.actual": "Actual: {date}",
  "timeline.pending": "Ahead",
  "timeline.unscheduled": "No date set yet",
  "timeline.lateBy": "{days} days late",
  "timeline.driftLate": "{days} days later than planned",
  "timeline.driftEarly": "{days} days earlier than planned",
  "timeline.onTime": "On plan",
  "timeline.lateBanner":
    "This project is behind plan. The delay is written here because, when we are the contractor, it is our failure to perform — not a piece of news we get to choose whether to send.",
  "timeline.asOf": "As of {date}",

  // ── Contribution flow (docs/07 §2.4) ──────────────────────────────────────
  "contribute.title": "Contribute to the project",
  "contribute.stepOf": "Step {step} of {total}",
  "contribute.step.amount": "Amount",
  "contribute.step.who": "Who you are",
  "contribute.step.eid": "Identity",
  "contribute.step.method": "Method",
  "contribute.step.confirm": "Confirmation",
  "contribute.amountLabel": "How much would you like to contribute",
  "contribute.amountHint": "The smallest contribution on this project is {min}.",
  "contribute.amountCustom": "Another amount",
  "contribute.amountTooLow": "That is below the smallest contribution.",
  "contribute.nameLabel": "Name shown with the contribution",
  "contribute.namePlaceholder": "Your name, or an organisation",
  "contribute.anonymous": "List me as anonymous",
  "contribute.messageLabel": "A message with the contribution",
  "contribute.messagePlaceholder": "Optional",
  "contribute.eidTitle": "Identity sign-in",
  "contribute.eidWhy":
    "For a membership stake in a community, identity is required — membership is a legal relationship, not an anonymous payment.",
  "contribute.eidSimulated":
    "Sign-in is simulated in the prototype. Certilia is not opened and no data is sent.",
  "contribute.eidConfirm": "Simulate sign-in",
  "contribute.eidDone": "Identity confirmed (simulated)",
  "contribute.membershipTitle": "Membership form",
  "contribute.membershipNote":
    "A membership stake gives you membership, a vote in the community and a share of the energy produced. It gives you no claim to money.",
  "contribute.membershipShare": "Your share of the energy produced would be about {bp} bp.",
  "contribute.methodTitle": "How to pay",
  "contribute.method.sepa": "SEPA transfer with a payment code",
  "contribute.method.sepaHint": "An ordinary bank transfer against the project's reference number.",
  "contribute.method.eure": "EURe straight to the project account",
  "contribute.method.eureHint": "For those who already have a wallet.",
  "contribute.method.qr": "QR code",
  "contribute.method.qrHint": "Scan it in your banking app.",
  "contribute.confirmTitle": "Contribution recorded",
  "contribute.confirmLead":
    "This is the confirmation screen. In the prototype no payment was requested and no data was sent.",
  "contribute.summary": "Summary",
  "contribute.proofTitle": "Public proof of the contribution",
  "contribute.proofNote":
    "Once the data is real, the contribution is written into the project's contribution book, time-stamped and publicly verifiable.",
  "contribute.backToProject": "Back to the project",
  "contribute.next": "Next",
  "contribute.prev": "Back",
  "contribute.finish": "Record the contribution",

  // ── Switching to your own rails (P3, docs/07 §2.10) ───────────────────────
  "rails.title": "Switch to your own rails",
  "rails.lead":
    "The money can run through your own account, with us out of the middle. This is what makes the claim that we do not hold your money checkable rather than promotional.",
  "rails.step1": "Enter your Monerium IBAN",
  "rails.step2": "Connect your Safe multisig",
  "rails.step3": "Confirm the signatories and the threshold",
  "rails.step4": "Done — the money no longer passes through us",
  "rails.accountLevel": "The setting applies to all your projects, not just this one.",
  "rails.afterNote":
    "After the switch we stop being a signatory. If you still want us to build, that is a separate relationship: you pay us from your own account.",
  "rails.current": "Where things stand",
  "rails.currentPlatform": "The money runs through our account.",
  "rails.currentClient": "The money already runs through the holder's account.",
  "rails.simulated": "Every step is simulated in the prototype and nothing is saved.",
  "rails.start": "Start the switch",
  "rails.done": "The switch was played through to the end (simulated).",

  // ── Projects on the entry screen + waiting list (K4) ───────────────────────
  "projects.title": "Projects looking for partners",
  "projects.lead": "Plants being built together right now.",
  "projects.none": "No project is collecting at the moment.",
  "projects.noneHint":
    "That is the normal state between two projects, not a fault. Leave your contact and we will tell you when the next one starts.",
  "projects.openCount": "{count} open",

  "waitlist.title": "Tell me when the next project starts",
  "waitlist.lead":
    "The list stands permanently, whether a project is open or not. There is no sense in somebody arriving in the wrong week with nowhere to leave a trace.",
  "waitlist.emailLabel": "Email",
  "waitlist.emailPlaceholder": "name@example.com",
  "waitlist.countyLabel": "County you are interested in",
  "waitlist.anyCounty": "Any",
  "waitlist.submit": "Add me",
  "waitlist.invalid": "Enter an email address.",
  "waitlist.done": "Added — in the prototype.",
  "waitlist.doneHint":
    "No address was sent or stored. The form exists to show how it works, not to collect contacts.",
  "waitlist.simulated": "Prototype: nothing is sent and nothing is stored.",

  // ── Communities (docs/07 §2.5) ────────────────────────────────────────────
  "communities.title": "Energy communities",
  "communities.lede":
    "A community is visible before it legally exists. An idea and a preparation are normal states, not a gap.",
  "communities.count": "{registered} registered in Croatia, {shown} on this page.",
  "communities.empty": "No community is listed.",
  "communities.open": "Open the community",

  "community.notFound": "Community not found",
  "community.notFoundHint": "It may have been removed, or the link is wrong.",
  "community.back": "Back to communities",
  "community.registration": "Registration",
  "community.state.idea": "Idea",
  "community.state.preparing": "In preparation",
  "community.state.filed": "Filed with the register",
  "community.state.registered": "Registered",
  "community.stateHint.idea": "A group of people with an intention. No documents and no legal entity yet.",
  "community.stateHint.preparing": "The statute and founding documents are being prepared.",
  "community.stateHint.filed": "Filed with the competent register, waiting on the decision.",
  "community.stateHint.registered": "The legal entity exists and can enter into contracts.",
  "community.legalForm": "Legal form",
  "community.legalForm.association": "Association",
  "community.legalForm.cooperative": "Cooperative",
  "community.legalForm.not_yet_registered": "Not registered yet",
  "community.oib": "Company number",
  "community.noOib": "There is no company number until registration completes.",
  "community.members": "Members",
  "community.memberCount": "{count} members",
  "community.role.member": "Member",
  "community.role.board": "Board",
  "community.role.signer": "Signatory",
  "community.share": "Share of the energy produced",
  "community.joined": "Member since",
  "community.membersNote":
    "The community keeps the register of members, not us. Only what is needed to make clear who signs and whose share of the energy is what appears here.",
  "community.safe": "Shared account",
  "community.plants": "Plants",
  "community.noPlants": "The community has no plant yet.",
  "community.projects": "Projects",
  "community.noProjects": "The community has no open project right now.",
  "community.statute": "Statute",
  "community.statuteMissing": "The statute is not attached.",
  "community.guideTitle": "What founding one actually costs",
  "community.guideCost": "Cost to found: from {amount}",
  "community.guideMonths": "Time: more than {months} months",
  "community.guideSource": "Source: {source}, checked {date}.",
  "community.guideNote":
    "We do not do this for you. Founding a community is legal work, not technical work. The platform offers a model statute, a list of steps and a cost estimate — and nothing beyond that.",
  "community.guideSolves": "What the platform does solve",
  "community.solves.capital": "Pooling money without an intermediary.",
  "community.solves.proof": "Proof of who put in how much, public and time-stamped.",
  "community.solves.control": "Control over who may spend the money, through multiple signatures.",
  "community.notSolves": "What it does not solve",
  "community.notSolves.founding": "Founding the community and the cost that comes with it.",
  "community.notSolves.grid": "Connection to the grid.",
  "community.notSolves.billing":
    "Working out how the energy is allocated — that is done by the supplier or the distribution system operator.",

  // ── New project wizard (docs/07 §2.7, docs/03 §8) ─────────────────────────
  "wizard.title": "New project",
  "wizard.lead":
    "The order of the questions is not a matter of taste. The type of holder changes everything downstream, so it comes first.",
  "wizard.stepOf": "Step {step} of {total}",
  "wizard.next": "Next",
  "wizard.prev": "Back",
  "wizard.required": "This field is required.",
  "wizard.draftRestored": "A draft from an earlier attempt was restored.",
  "wizard.simulated":
    "Prototype: the project is sent nowhere. The draft is kept only in this browser tab.",

  "wizard.step.holder": "Holder",
  "wizard.step.model": "Model",
  "wizard.step.plant": "Plant",
  "wizard.step.siteRight": "Right to the site",
  "wizard.step.cost": "Goal and cost",
  "wizard.step.account": "Account",
  "wizard.step.description": "Description",
  "wizard.step.review": "Review",

  "wizard.holderQuestion": "Who holds the project?",
  "wizard.holderHint":
    "The holder signs the contract and answers for permits and tax treatment. Which models are possible at all depends on this answer.",
  "wizard.holderWarn.person":
    "A plant on a private roof raises the value of private property. A contribution to an individual has no tax protection and quickly becomes either taxable income or a disguised stake — the model is clean when the beneficiary is collective.",
  "wizard.holderWarn.company":
    "A contribution to a company is income and is taxed as such.",

  "wizard.modelQuestion": "Which model?",
  "wizard.modelHint": "The model decides what the contributor gets. That is a legal difference, not a stylistic one.",
  "wizard.modelDisabledTitle": "Why two models are disabled",
  "wizard.modelC": "A loan or an equity stake",
  "wizard.modelCWhy":
    "This needs authorisation from HANFA as a crowdfunding service provider. We do not have it, so we do not offer it. The decision takes three months from a complete application, and brings a knowledge test, a reflection period and capital requirements with it.",
  "wizard.modelD": "A transferable stake with a market price",
  "wizard.modelDWhy":
    "Almost certainly a security. It needs a separate company per plant, a prospectus approved by HANFA and supervised trading. Out of scope for the platform until that exists.",
  "wizard.modelDisabledNote":
    "These two are on the list on purpose. Limiting the platform to the first two is the only thing keeping it out of licensing — a dead button with no explanation would waste the chance to say so.",
  "wizard.disabled": "Disabled",

  "wizard.plantQuestion": "Which plant?",
  "wizard.plantExisting": "An existing one from the registry",
  "wizard.plantNew": "A new plant",
  "wizard.plantSearch": "Search by name or place",
  "wizard.plantNewName": "Name of the new plant",
  "wizard.plantNewCapacity": "Capacity (kWp)",
  "wizard.plantNewCounty": "County",
  "wizard.plantNoResults": "No plant matches that search.",

  "wizard.siteRightQuestion": "What is the right to the site?",
  "wizard.siteRightHint":
    "Without proof of the right to the site the project is not published. The plant has to stand on a roof the holder properly has rights to.",
  "wizard.siteRightDoc": "Name of the document that proves it",

  "wizard.goalQuestion": "How much needs to be raised?",
  "wizard.goalLabel": "Goal (EUR)",
  "wizard.costTitle": "Cost breakdown",
  "wizard.costHint":
    "The breakdown is public before the first payment. If we are building, the contractor's margin is a line in this table like any other.",
  "wizard.costLabel": "Line name",
  "wizard.costAmount": "Amount (EUR)",
  "wizard.costAdd": "Add a line",
  "wizard.costRemove": "Remove",
  "wizard.costTotal": "Breakdown total",
  "wizard.costMismatch": "The breakdown ({total}) does not match the goal ({goal}).",
  "wizard.costMatch": "The breakdown matches the goal.",
  "wizard.surplusLabel": "What happens to money above the goal",
  "wizard.surplusHint":
    "Money left unspent becomes taxable income. What happens to a surplus is declared beforehand, not afterwards.",

  "wizard.accountQuestion": "How is the project account opened?",
  "wizard.accountHint":
    "The account takes more than one signature. The threshold and the number of signatories have to match the holder's statute — this is not the place to set up something the statute does not know about.",
  "wizard.threshold": "Signatures required",
  "wizard.owners": "Signatories in total",
  "wizard.ourSigner": "Include our signature (we are building)",
  "wizard.conflictOk": "Our signature does not make up a majority of the threshold.",
  "wizard.conflictBad":
    "An account like this does not pass: our signature would make up a majority of the threshold, so we could pay ourselves without the members.",
  "wizard.thresholdBad": "The threshold cannot exceed the number of signatories.",

  "wizard.descriptionQuestion": "Project description",
  "wizard.descriptionHint":
    "The description is checked before it is filed. A sentence promising a financial gain moves the project into a regime the platform is not licensed for.",
  "wizard.descriptionPlaceholder": "What is being built, for whom, and why.",
  "wizard.blockedTitle": "The description cannot pass",
  "wizard.blockedHint":
    "Remove the highlighted phrases. What is allowed: a contribution, a membership stake, a share of the energy produced, a vote in the community, public proof of a contribution, an advance on a plant.",
  "wizard.blockedItem": "“{match}” — {why}",
  "wizard.descriptionOk": "The description passes the check.",

  "wizard.reviewTitle": "Review before filing",
  "wizard.submit": "File for review",
  "wizard.submitted": "The project was filed for review — in the prototype.",
  "wizard.submittedHint":
    "No data was sent. In the real version the project moves to the “in review” state and is published only after the holder and the right to the site have been checked.",
  "wizard.startOver": "Start over",

  "common.of": "of",
  "common.close": "Close",
  "common.showMore": "Show more",
  "common.copy": "Copy",
  "common.copied": "Copied",
};

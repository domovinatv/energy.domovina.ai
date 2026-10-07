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


  // ───────────────────────────────────────────────────────────────────────────
  // LANDING — Phase 1d (docs/06 §1). Twelve sections; the twelfth is the footer.
  //
  // ⚠️ The same legal boundary applies, and the forbidden list is longer in
  // English. Every figure arrives through a `{variable}` from `lib/facts.ts` or
  // `lib/fees.ts` — none is written here.
  // ───────────────────────────────────────────────────────────────────────────

  "landing.hero.eyebrow": "Energy communities in Croatia",
  "landing.hero.title":
    "The law has allowed this since 2021. Croatia has {communities} such communities. We are building the fourth — and making it easier than the first three.",
  "landing.hero.lede":
    "Whoever has a roof, capital and patience has a plant. Whoever lives in a flat, or does not have twelve thousand euros, does not. That is a matter of structure, not of information, and shared ownership is what changes it.",
  "landing.hero.ctaMap": "See the map",
  "landing.hero.ctaProject": "Start a project",
  "landing.hero.disclaimer":
    "That would require authorisation from HANFA under Regulation (EU) 2020/1503, and we do not have it. We offer what the law has allowed since 2021 and almost nobody uses: that you own a plant together and use the electricity it makes.",

  "landing.problem.eyebrow": "The problem",
  "landing.problem.title": "In Croatia, solar is a solo sport",
  "landing.problem.lead":
    "It is not that people do not know about the sun. They know, and they build. But each of them builds alone, because everything else is too expensive and takes too long.",
  "landing.problem.plantsLabel": "plants on the grid",
  "landing.problem.plantsNote":
    "Around {mw} MW in total. The knowledge and the will are there — what is missing is a way for people to join forces.",
  "landing.problem.communitiesLabel": "energy communities",
  "landing.problem.communitiesNote":
    "Renewable energy communities number {zoe}, five years after the law that introduced them.",
  "landing.problem.costLabel": "to register a community",
  "landing.problem.costNote":
    "A lower bound. That is what the paperwork costs, before a single panel goes up.",
  "landing.problem.monthsValue": "{months}+ mo.",
  "landing.problem.monthsLabel": "how long it takes",
  "landing.problem.monthsNote":
    "The first community actually sharing electricity is {place}. One, in the whole country.",
  "landing.problem.demandProof":
    "The demand is proven; the tooling is not. A Croatian energy cooperative raised {amount} in about ten days ({days}) from {members} people — and the sign-up tool was a form in a spreadsheet. To them this is not competition but the tool they were missing.",

  "landing.map.eyebrow": "The registry",
  "landing.map.title": "A map of plants, open and without an account",
  "landing.map.lead":
    "The registry works with no projects and no users at all. A plant may sit on the map even when nobody is raising anything — which is exactly why the registry was built first.",
  "landing.map.cta": "Open the full registry",

  "landing.flow.eyebrow": "How it works",
  "landing.flow.title": "Where the money is at every moment",
  "landing.flow.lead":
    "No treasurer to trust. The money comes in from a bank, sits in an account that needs several signatures, goes out to the contractor as the build progresses, and ends up in a bank again. Pick a scenario and walk through it step by step.",

  "landing.fees.eyebrow": "Fees",
  "landing.fees.title": "We take no percentage of what is raised",
  "landing.fees.lead":
    "That does not make every step free for everyone. The table below says who pays what — including what the contributor pays their own bank, and what we ourselves earn on.",

  "landing.models.eyebrow": "Models",
  "landing.models.title": "Two models we do, and two we do not",
  "landing.models.lead":
    "The difference between them is not a matter of style but of licensing. So this section also states what we do not do — if we do not say it, somebody else will, in front of an audience that knows.",
  "landing.models.donationTitle": "You fund somebody else's roof",
  "landing.models.donationWho":
    "For schools, fire stations, associations and local councils. The holder is the institution, the contributor is a donor, and the plant stays with the institution.",
  "landing.models.communityTitle": "You become a co-owner",
  "landing.models.communityWho":
    "For neighbourhoods, apartment buildings and cooperatives. The holder is an energy community, the contributor becomes a member with a vote, and the electricity is shared among the members.",
  "landing.models.boundary":
    "The line is simple: the moment what a contributor holds carries an expectation of financial gain, or is transferable at a market price, it needs authorisation from HANFA under Regulation (EU) 2020/1503. We do not have one, so we do not build a product that needs one. The same two models sit disabled in the new-project wizard — that is a check at entry, not a note.",

  "landing.proof.eyebrow": "Checkable",
  "landing.proof.title": "What you can check without taking our word for it",
  "landing.proof.lead":
    "A claim that cannot be checked is not a claim but an advertisement. These four can be checked outside this website.",
  "landing.proof.eid.title": "The holder's identity",
  "landing.proof.eid.body":
    "A project holder confirms their identity with a state eID. The verified mark is computed on the server, not filled into a form — nobody can award it to themselves.",
  "landing.proof.safe.title": "An account with several signatures",
  "landing.proof.safe.body":
    "Nothing leaves the project account without M of N signatures. The threshold must match the holder's statute, and our signature never makes up a majority of it.",
  "landing.proof.ledger.title": "A public ledger",
  "landing.proof.ledger.body":
    "The balance and every release are public, with no account and no permission needed. Who gave how much is recorded and time-stamped.",
  "landing.proof.exit.title": "An exit in a few clicks",
  "landing.proof.exit.body":
    "A project can move to its own bank account, its own multi-signature account and a contractor of its choice. From then on the money does not pass through us at all.",
  "landing.proof.prototypeNote":
    "In the closed beta the eID and the project account are simulated, and the addresses are derived from the project name. This describes how the system is put together, not what is connected today.",
  "landing.proof.rippleTitle": "The platform fails, the asset remains",
  "landing.proof.rippleBody":
    "Ripple Energy went into administration, and the cooperatives it started carry on — one of them has {members} members. The plants were never Ripple's; they were theirs. That is the argument proven on a real case, not a promise of ours.",
  "landing.proof.sunexTitle": "Why the cost per member must be near zero",
  "landing.proof.sunexBody":
    "Sun Exchange failed on the cost of administering some {owners} co-owners. Without a percentage of what is raised, any feature that needs human work per member is a cost that never comes back — so it gets refused or automated.",

  "landing.audience.eyebrow": "Who it is for",
  "landing.audience.title": "Four situations people arrive from",
  "landing.audience.lead":
    "Each has its own first step. None of them needs an account to see what this is about.",
  "audience.community.title": "A community forming",
  "audience.community.pain":
    "Twenty people want a plant, and nobody wants to hold the shared money.",
  "audience.community.offer":
    "An account with several signatures, a public ledger of contributions, and a template for the steps to a registered community.",
  "audience.community.cta": "See the communities",
  "audience.holder.title": "A project holder",
  "audience.holder.pain":
    "You have the project and the standing, but no tool for collecting or for reporting.",
  "audience.holder.offer":
    "A project page, a cost breakdown item by item, and a public timeline whose deadlines are not quietly rewritten.",
  "audience.holder.cta": "Start a project",
  "audience.contributor.title": "A contributor",
  "audience.contributor.pain":
    "You want to take part with two hundred euros, not twelve thousand.",
  "audience.contributor.offer":
    "Entry from a small amount, public proof of your contribution, and sight of where the money is at any moment.",
  "audience.contributor.cta": "Projects seeking partners",
  "audience.owner.title": "A plant owner",
  "audience.owner.pain":
    "Your plant is nowhere to be seen and there is no reference point to compare it with.",
  "audience.owner.offer":
    "A free entry in the public registry and a place on the map, with no campaign and no obligation.",
  "audience.owner.cta": "Open the registry",

  "landing.open.eyebrow": "Open source",
  "landing.open.title": "Software that does not hold on to you",
  "landing.open.lead":
    "If the exit is real, it has to work once we are gone. So the plan is the same as in the rest of the product family: the code open, the implementation paid for.",
  "landing.open.codeTitle": "MIT-licensed code",
  "landing.open.codeBody":
    "A cooperative, a municipality or another platform may take the same software, run it at their own address and work without us. No permission and no fee is required for that.",
  "landing.open.codePending":
    "The repository is not public yet, so there is deliberately no link here — a link into nothing is worse than no link.",
  "landing.open.labelTitle": "White label and setup",
  "landing.open.labelBody":
    "We charge for setting it up, adapting it and maintaining it — never for access. Whoever wants to do it themselves has the code; whoever wants it done gets an invoice.",

  "landing.roadmap.eyebrow": "The plan",
  "landing.roadmap.title": "Where we are and what comes next",
  "landing.roadmap.lead":
    "Ordered by phase, not by quarter. A phase that is not finished stays where it is instead of quietly sliding.",
  "landing.roadmap.done": "Delivered",
  "landing.roadmap.done1": "Foundations: design tokens, a bilingual catalogue, checks on every change.",
  "landing.roadmap.done2": "Registry: a map of the whole country, filters in the address, a page per plant.",
  "landing.roadmap.done3": "Marketplace: the project page, the contribution flow, communities and a waiting list.",
  "landing.roadmap.done4": "A new-project wizard that checks the description as it is written.",
  "landing.roadmap.now": "In progress",
  "landing.roadmap.now1": "This page: twelve sections, from the problem to the contact form.",
  "landing.roadmap.now2": "The money-flow diagram, with scenarios and the tests that guard it.",
  "landing.roadmap.now3": "A fee comparison, marked as illustrative.",
  "landing.roadmap.now4": "Contrast measurement and a pass on a real mobile device.",
  "landing.roadmap.next": "Next",
  "landing.roadmap.next1": "Working offline — a demo at a fair must not depend on the WiFi.",
  "landing.roadmap.next2": "A layout for a large screen, not just for phones and laptops.",
  "landing.roadmap.next3": "Live data: a real project account, a real eID, real bank orders.",
  "landing.roadmap.next4": "A solar plant layer on the shared map of Croatia.",
  "landing.roadmap.note":
    "Loans, equity stakes and transferable stakes are not on the plan but behind a condition: they need an authorisation we do not have. Until it exists, they do not appear even as “coming soon”.",

  "landing.contact.eyebrow": "Get in touch",
  "landing.contact.title": "Write if you have a roof, a community or a question",
  "landing.contact.lead":
    "The waiting list stands whether a project is open or not. The gap between two projects is a normal state rather than a fault — and no reason to send anyone away empty-handed.",

  "flow.totalLabel": "Total in this example",
  "flow.peopleLabel": "People",
  "flow.thresholdLabel": "Signatures to release",
  "flow.threshold": "{m} of {n}",
  "flow.ourKeysLabel": "Keys we hold",
  "flow.ourKeys": "{count}",
  "flow.ourKeysNone": "none",
  "flow.prev": "Back",
  "flow.next": "Next",
  "flow.restart": "Start over",
  "flow.stepOf": "Step {index} of {total}",
  "flow.noMoney": "Moves no money",
  "flow.signatures": "Signatures: {given}, {required} required",
  "flow.diagramFailed":
    "The diagram could not be drawn. The steps below show the same flow and are correct regardless of the picture.",
  "flow.invariantTitle": "The contributor has paid us {amount}.",
  "flow.invariantBody":
    "That much at every step and in every scenario — not a promise but a rule the tests break the moment it stops holding. To their own bank they paid {bankFee} for the orders, exactly as for any other order. We earn as the contractor, on the build, and the price of the build is public in every project's cost breakdown.",

  "fees.tableCaption": "Who pays for which step, and how much",
  "fees.colStep": "Step",
  "fees.colWhoPays": "Who pays",
  "fees.colHowMuch": "How much",
  "fees.rowSepa": "Bank order",
  "fees.rowMint": "Swapping euro for e-money and back",
  "fees.rowChain": "On-chain transaction",
  "fees.rowContribution": "Contribution to a project",
  "fees.rowPayout": "Release to the contractor",
  "fees.rowPlatform": "The platform",
  "fees.paysContributorBank": "the contributor, to their own bank",
  "fees.paysNobody": "nobody",
  "fees.paysUs": "we do",
  "fees.aboutCent": "about €0.01",
  "fees.notFreeTitle": "Zero per cent is not the same as free.",
  "fees.notFreeBody":
    "We take no percentage of the money raised. We earn as the contractor — on building the plant — and the price of the build is public in every project's cost breakdown, item by item, before anyone pays anything.",

  "calc.title": "How much reaches the project",
  "calc.lead":
    "Enter how many of you there are and how much each one gives. The comparison is with a typical crowdfunding platform, not with a named product.",
  "calc.peopleLabel": "How many people",
  "calc.amountLabel": "How much each one gives (€)",
  "calc.total": "{people} people × {each} = {total}",
  "calc.classicTitle": "Through a typical platform",
  "calc.classicCut": "platform fee {pct}: −{amount}",
  "calc.classicCard": "card fee {pct} + {fixed} per payment: −{amount}",
  "calc.oursTitle": "This way",
  "calc.oursCut": "platform fee {pct}: −{amount}",
  "calc.oursBank": "contributors to their own banks for the orders: {amount}",
  "calc.difference": "The difference that reaches the project: {amount}.",
  "calc.illustrative":
    "Illustrative. The rates are the card processor's public rates and a typical crowdfunding platform fee, and the bank charge is taken at the upper end of the range for Croatian banks. The real figure depends on the contributor's bank and on the platform being compared against. This is neither an offer nor financial advice.",

  "common.of": "of",
  "common.close": "Close",
  "common.showMore": "Show more",
  "common.copy": "Copy",
  "common.copied": "Copied",
  // ── Beta: real projects (docs/15) ─────────────────────────────────────────
  "beta.bar": "Real projects. Payments are real money and are publicly visible on Gnosis Chain.",
  "beta.barShort": "Real projects, real money",
  "beta.title": "Three solar plants, funded in the open",
  "beta.intro":
    "Each plant has its own multi-signature account (Safe) on Gnosis Chain. You pay by SEPA transfer and the money lands on that account. This page never receives or holds money; it only shows what is on chain.",
  "beta.who":
    "The plants are funded by the owner of the sites and people he knows personally. This is not a public fundraiser.",
  "beta.prototypeLink": "What the full platform will look like: prototype",
  "beta.campaign": "Campaign",
  "beta.progress": "Raised {received} of {goal} ({percent})",
  "beta.power": "Capacity",
  "beta.connections": "Grid connections: {count}",
  "beta.node": "A Gnosis node runs on this site",
  "beta.goal": "Goal",
  "beta.goalPending": "The goal will be set from the installer's quote",
  "beta.received": "Received in total",
  "beta.balance": "Currently on the account",
  "beta.loading": "Reading Gnosis Chain…",
  "beta.chainError": "Chain data is unavailable right now. Check Gnosisscan directly.",
  "beta.recent": "Latest payments",
  "beta.noTransfers": "No payments yet.",
  "beta.viewOnChain": "All transfers on Gnosisscan",
  "beta.pending": "In preparation: this plant's account is not open yet, so payments are not possible.",
  "beta.payTitle": "How to pay",
  "beta.payPending":
    "The plant's account is open, but SEPA payment is not connected yet. Payment instructions will appear here.",
  "beta.signers":
    "A payout needs {threshold} of {count} signatures. All three signing keys are currently held by the same person, the site owner: this shows how the mechanism works, not independent control.",
  "beta.amount": "Amount",
  "beta.beneficiary": "Beneficiary",
  "beta.iban": "IBAN",
  "beta.bic": "BIC",
  "beta.reference": "Payment reference",
  "beta.referenceExact": "If you pay manually, enter the reference exactly as shown and pay exactly this amount — that is how the payment is recognised.",
  "beta.intentScan": "Scan it in your banking app: the recipient, IBAN and amount {amount} fill in.",
  "beta.revolutReference": "Before confirming, check that the payment reference is filled in. Revolut sometimes drops it after a scan. If it is empty, cancel and pay manually: copy the IBAN, amount and reference below. Without the exact reference the payment does not reach the plant.",
  "beta.intentAwaiting": "Waiting for a payment of {amount}. This page notices on its own when it arrives.",
  "beta.intentReceived": "Payment of {amount} received",
  "beta.intentReceivedSub":
    "The euros have arrived: Monerium has received your SEPA payment and it is already counted towards the campaign. It becomes verifiable on Gnosisscan once Monerium issues the EURe and it is forwarded to the plant's Safe.",
  "beta.intentReviewNote":
    "This is probably the first payment from your account. Monerium checks such payments before issuing EURe, which can take from a few minutes to a few hours. The money has been received in the meantime; you can close this page.",
  "beta.intentMintingSub": "EURe has been issued and is being forwarded to the plant's Safe.",
  "beta.intentSettledSub": "The money is on the plant's Safe, publicly visible on Gnosis Chain.",
  "beta.intentRejected": "The payment was rejected. The money goes back to the account it came from.",
  "beta.intentExpired": "The time for this payment has run out. Start a new one.",
  "beta.intentTx": "Transfer to the Safe on Gnosisscan",
  "beta.intentNew": "New payment",
  "beta.intentCancel": "Cancel",
  "beta.justArrived": "+{amount} just arrived",
  "beta.includesUnconfirmed": "Includes {amount} that Monerium has already received in euros (SEPA). It appears on Gnosisscan once the EURe is issued — for a first payment from a new account, only after a few hours.",
  "beta.rowReceived": "received, awaiting EURe",
  "beta.rowIndexing": "on Gnosis Chain",
  "beta.payButton": "Pay {amount}",
  "beta.payBusy": "Preparing the payment…",
  "beta.payHow":
    "A QR code for your bank appears here. As soon as the payment arrives, this page shows it, usually within seconds.",
  "beta.payErrorWhitelist": "Payments for this plant are not switched on yet. Please try again later.",
  "beta.payErrorGeneric": "The payment cannot be prepared right now. Please try again in a minute.",
  "beta.amountCustom": "Other amount",
  "beta.amountInvalid": "Enter an amount in euros, e.g. 25 or 12.50 (at most {max}).",
  "beta.photoBefore": "The site today, drone shot",
  "beta.photoRender": "How the plant could look",
  "beta.photoAfter": "Finished plant",
  "beta.photoBeforePending": "Site photo coming soon",
  "beta.photoRenderPending": "Visualisation in preparation",
  "beta.photoAfterPending": "Photo after installation",
  "beta.photoRenderBadge": "AI visualisation",
  "beta.photoRenderNote": "Generated by AI from the site photo, not a photograph. Panel layout and landscaping are illustrative.",
  "beta.photoAlt.before": "{place}: roof before panels are installed, drone shot",
  "beta.photoAlt.render": "{place}: AI visualisation of the roof with solar panels",
  "beta.photoAlt.after": "{place}: finished solar plant on the roof",
  "beta.hepTitle": "HEP ODS metering point",
  "beta.hepOmm": "Metering point (OMM)",
  "beta.hepMeter": "Meter number",
  "beta.hepAddress": "Address (HEP ODS)",
  "beta.hepTariff": "Tariff",
  "beta.hepReading": "Meter reading {date}",
  "beta.hepReadingValue": "High {t1} · Low {t2} kWh",
  "beta.hepYear": "Consumption, last 12 months",
  "beta.hepChart": "Consumption per billing period",
  "beta.hepKind.izmjereno": "measured",
  "beta.hepKind.procjena": "HEP estimate",
  "beta.hepKind.korekcija": "correction after estimates",
  "beta.hepCorrectionNote": "Between actual readings HEP estimates consumption. When an actual reading arrives, the difference of all estimates lands in one period, so that period shows more than the month really used. The 12-month total is exact because meter readings define it.",
  "beta.hepTable": "All periods as a table",
  "beta.hepPeriod": "Period",
  "beta.hepTotal": "Total",
  "beta.hepKindHeader": "Data",
  "beta.hepSource": "Source: HEP ODS Moja mreža (mojamreza.hep.hr), retrieved by the metering point holder with their own login on {date}.",
  "beta.backToList": "← All plants",
  "beta.openProject": "See the plant and contribute →",
  "beta.safe": "Plant account (Safe)",
  "beta.notInvestment":
    "A payment is not an investment: it gives no stake in the plant and no claim to the money back. {brand} holds no keys to any Safe.",
};

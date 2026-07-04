# BioCoda: Claude Design Brief

**Two scopes in one brief:**
1. **Scope A:** Brand and visual uplift of the **web dashboard** (the product).
2. **Scope B:** **Website branding and marketing** (the public site and launch).

Both sit on one shared brand foundation (Section 1) so the product and the marketing feel like the same company. Hand this brief to the design workstream as the source of truth. Colours, type, and tokens below are a committed starting direction, refined during exploration, not arbitrary.

> Product in one line: 30-year Biodiversity Net Gain habitat monitoring, where Earth observation, field verification, and the Defra Metric combine into durable, defensible evidence. Buyers are responsible bodies, LPAs, developers, and ecologists. The mood is quiet authority: scientific credibility with understated luxury.

---

## 1. Brand foundation (shared)

### 1.1 Positioning and essence

- **Category:** B2G environmental compliance and Earth-observation monitoring.
- **Positioning:** Not another Metric calculator. BioCoda is the long-horizon evidence layer that proves habitats are on trajectory across the statutory 30-year tail.
- **Essence:** *Evidence you can trust, for thirty years.*
- **Personality:** Calm, exact, credible, premium. The confidence of a fine instrument, not the noise of a consumer app. Natural-world richness without eco-cliché.
- **Three adjectives to design against:** Trustworthy, Luminous, Enduring.

### 1.2 Brand principles

1. **Evidence over decoration.** Every visual element earns its place by clarifying a decision. Luxury here is restraint, space, and precision, not ornament.
2. **Honest over flattering.** At-risk is shown plainly and early. The design never hides a bad trajectory behind pretty styling.
3. **Calm under density.** The product is data-heavy. Hierarchy, whitespace, and typographic discipline keep it serene.
4. **Durable, like the obligation.** A 30-year product should look timeless, not trend-chasing. Choose classic over novel where they conflict.

### 1.3 Voice and tone

Plain, precise, quietly confident. Short sentences. Verbs that commit ("track", "prove", "flag"), never hype. Funder-credible and procurement-credible. Avoid jargon walls; define terms once. (House style note: no em-dashes anywhere; use colons, commas, or periods.)

### 1.4 Visual identity

**Logotype and mark**
- Refined wordmark "BioCoda" set in the display serif.
- Abstract mark options to explore: a rising contour/trajectory line that resolves into a leaf vein or a parcel boundary; a single ascending stroke that reads as both "gain" and "growth". Keep it geometric, single-weight, works at 16px.
- One-colour, reversible, and a monogram ("GK") for favicons and the mobile app tile.

**Colour system (committed starting direction)**

The luxe cue is a deep forest green and warm parchment paired with a single restrained brass accent, plus generous negative space and hairline rules. Warm neutrals (not cold grey) carry the "luxurious" feel.

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0E1A12` | Near-black green; primary text, dark surfaces |
| `forest` | `#14613A` | Primary brand green; headers, primary actions |
| `moss` | `#1F6F43` | Secondary green; accents, links |
| `brass` | `#B8924A` | Luxury accent; used sparingly for premium highlights, focus, "verified" |
| `parchment` | `#F7F5F0` | Warm paper background |
| `stone-100` | `#EDEAE3` | Card edges, dividers, muted fills |
| `track` | `#15803D` | Status: on track |
| `risk` | `#B5532F` | Status: at risk (an elegant terracotta, not alarm-red) |
| `unknown` | `#A8A29E` | Status: no EO yet |

- **Condition data-viz scale (0 to 3):** a sequential ramp from `risk` terracotta through warm neutral to `track`/`forest` green, colour-blind safe, tested against WCAG.
- **Executive dark mode:** deep forest near-black surfaces (`ink` family), parchment text, brass accent. Marketed as a premium "boardroom" view.

**Typography**
- **Display / headings:** a contemporary editorial serif (explore Fraunces, GT Sectra, or Newsreader) for premium, considered headlines and KPI numerals where appropriate.
- **UI / body:** a clean humanist grotesk (explore Inter, Geist, or Söhne) for dense data legibility.
- **Numerals:** tabular lining figures everywhere data aligns (KPIs, tables, charts).
- Scale: a clear type ramp (display, h1 to h4, body, caption, mono for refs/IDs).

**Iconography**
- Single-weight line icons, 1.5px, rounded joins, on a consistent grid. A small bespoke set for the domain: parcel, trajectory, EO/satellite, field survey, verification, Metric link, report.

**Imagery and texture**
- Real Earth-observation tiles and habitat photography, treated with a consistent duotone (forest + parchment) for cohesion. Data-as-art: contour lines, trajectory curves, parcel meshes used as quiet background texture. No stock-photo clichés.

**Motion**
- Purposeful and physical: 180 to 260ms, ease-out. Charts draw on. Toggles cross-fade and slide. Map uses smooth fly-to. Respect `prefers-reduced-motion`.

**Data-visualisation language**
- One charting style across product and marketing: hairline gridlines, dashed "required" curve, solid "EO actual", dotted field points, a "now" marker, target-year marker. Consistent legend and colour semantics so a chart reads the same on a slide or in the app.

### 1.5 Design tokens and tech

- Deliver as **design tokens** (JSON) feeding **Tailwind theme** + CSS variables, so product and site share one source.
- Component layer: **shadcn/ui** primitives restyled to the brand (already the app's stack), MapLibre style JSON for the map, and a documented motion spec.
- Storybook (or equivalent) for the component library.

### 1.6 Accessibility and B2G constraints

- **WCAG 2.2 AA minimum** (public-sector requirement): contrast, focus-visible, keyboard paths, semantic landmarks, reduced-motion, screen-reader labels on every chart and toggle.
- UK data-residency and tenant-isolation messaging must never be undercut by the design (no third-party fonts/CDNs that leak; self-host).

---

## 2. Scope A: Dashboard brand and visual uplift (web app)

### 2.1 Objective

Transform the functional MVP dashboard into a beautiful, modern, luxurious, and genuinely usable monitoring product, where active toggles make exploring a 40-to-thousands-parcel portfolio fast and pleasurable, without sacrificing the "honest, evidence-first" character.

### 2.2 Success metrics

- Time to find the parcels needing attention this quarter: under 15 seconds.
- Time to produce an annual monitoring pack: measurably reduced vs. baseline.
- Stakeholder demo reaction: "this looks like a premium, trustworthy product."
- Accessibility: passes automated and manual WCAG 2.2 AA audit.

### 2.3 Current state to target state

| Area | Current (MVP) | Target |
|---|---|---|
| Visual system | Default Tailwind, stone/green, basic cards | Tokenised brand system, parchment + forest + brass, editorial type |
| Map | Basemap-free, status-coloured dots | Branded MapLibre style, layered, animated, legible at every zoom |
| Trajectory chart | Functional SVG | Signature data-viz, annotated, animated draw-on |
| Controls | One filter link, plain role/tenant selects | A rich, active toggle system (see 2.5) |
| States | Minimal | Considered empty, loading (skeleton), error, success |
| Modes | Light only | Light + executive dark |

### 2.4 Workstreams

1. **Foundation:** tokens, Tailwind theme, type loading (self-hosted), base layout grid, spacing/elevation scale.
2. **Component system:** navigation/top bar, KPI stat cards, data tables (sortable, density toggle, sticky headers), status badges and condition pills, the map, the trajectory chart, drawers/sheets for parcel detail, toasts, dialogs, forms.
3. **Screen redesigns:**
   - **Portfolio:** hero KPIs, branded map, early-warning rail, refined parcel table. A calm command-centre.
   - **Parcel detail:** signature trajectory chart, Metric linkage panel, field-verification timeline, prominent "Dispatch survey" and "Export pack" actions.
   - **Reporting:** a beautiful, printable annual-pack layout (PDF-grade), branded cover, evidence sections.
   - **Mobile (ecologist app) visual alignment:** carry tokens, type, and status language into the Expo app.
4. **States and microcopy:** empty/loading/error/success for every surface, written in brand voice.
5. **Motion and polish:** chart draw-on, toggle transitions, map fly-to, hover/focus, page transitions.
6. **Dark (executive) mode** and **responsive** behaviour (1440 down to tablet; portfolio is desktop-first, detail is tablet-friendly).
7. **Accessibility pass** baked in, not bolted on.

### 2.5 The active toggle system (the heart of the UX)

A coherent family of controls, all sharing one interaction and visual language:

- **View segmented control:** Portfolio / Map / Timeline. Animated underline, instant switch.
- **Status filter chips (multi-select):** All / On track / At risk / No EO yet. Map, table, and KPIs react together with a smooth transition.
- **30-year time scrubber (signature interaction):** scrub across the management period; the map recolours, KPIs recount, and the early-warning list re-ranks to that year. Play/scrub the whole trajectory like a timeline. This is the "wow" moment and the clearest expression of the 30-year story.
- **Map layer toggles:** Condition status / Habitat type / EO recency / Verification status, with a clean legend that updates per layer.
- **Series toggles (parcel detail):** EO actual / Required curve / Field verifications, each independently on/off on the chart.
- **Table density toggle:** Comfortable / Compact.
- **Role lens:** Responsible body / LPA / Developer / Ecologist, reframing emphasis (a developer sees "where to intervene"; a responsible body sees "evidence and risk").
- **Light / Executive dark toggle.**

Interaction spec for all toggles: clear default and active states, keyboard operable, `aria-pressed`/`role` correct, optimistic UI with sub-260ms transitions, state reflected in the URL where it aids sharing (filters, year, view).

### 2.6 Deliverables

- Brand foundation applied: token set, Tailwind theme, type, iconography.
- Restyled component library (Storybook) covering Section 2.4.2.
- High-fidelity designs for Portfolio, Parcel detail, Reporting, plus the full toggle system, in light and executive dark.
- MapLibre brand style JSON and the redesigned trajectory chart spec.
- Motion spec and microcopy kit.
- Implementation handoff: the design ships as real Tailwind/shadcn components in `apps/web`, not just mockups.

### 2.7 Phases

- **Phase 1: Foundation and direction.** Tokens, type, two key screens at high fidelity, the toggle language, sign-off on direction.
- **Phase 2: Component build.** Library + states + dark mode in code.
- **Phase 3: Screen build and motion.** Portfolio, Parcel detail, Reporting, the time scrubber and map layers.
- **Phase 4: Polish and a11y.** Audit, microcopy, responsive, performance.

### 2.8 Acceptance criteria

- Every screen uses only design tokens (no ad-hoc colours).
- All toggles in 2.5 are functional, animated, keyboard-accessible, and consistent.
- The time scrubber demonstrably animates the portfolio across the 30-year period.
- Light and executive dark both pass WCAG 2.2 AA.
- A stakeholder can run the full demo script and it feels premium and effortless.

---

## 3. Scope B: Website branding and marketing

### 3.1 Objective

A public site and launch system that makes a responsible body, LPA, developer, or grant funder trust BioCoda within 30 seconds and book a demo or pilot. Beautiful, modern, captivating, and unmistakably the same brand as the product.

### 3.2 Success metrics

- Demo/pilot enquiries per month.
- Funder-credibility signals (named pilots, compliance, data residency) visible above the fold.
- Qualified-traffic growth from target search terms (BNG monitoring, 30-year management, biodiversity net gain compliance).
- Bounce reduced; time-on-page and scroll-depth on the product story increased.

### 3.3 Audiences and journeys

- **Responsible body:** holds the 30-year obligation. Needs: proof each parcel is on trajectory, early warning. Journey: Home > How it works > Evidence/compliance > Book demo.
- **LPA ecologist:** portfolio oversight. Journey: Home > For LPAs > Demo.
- **Developer / land manager:** must deliver and show progress. Journey: Home > For developers > Pricing > Demo.
- **Grant funder (Defra, Innovate UK):** credibility and innovation. Journey: Home > Approach/Science > About > Contact.
- **Field ecologist / consultancy:** partner channel.

### 3.4 Sitemap and page specs

1. **Home:** hero (positioning line + the signature trajectory visual), the problem (30-year tail), how it works (EO + field + Metric), proof/trust strip, personas, CTA.
2. **Product / How it works:** EO condition trajectory, field verification, Metric linkage, reporting. Interactive trajectory demo embedded.
3. **For responsible bodies / For LPAs / For developers:** three persona pages, each with their job-to-be-done, value props, and proof.
4. **Evidence and trust:** compliance posture, 30-year durability, UK data residency, tenant isolation, security. Critical for B2G procurement.
5. **Approach / science:** the EO-not-calculator thesis, methodology, accuracy framing (decision-support EO, authoritative field verification).
6. **Pricing:** annual per-organisation licence scaled by hectares under monitoring, with Earth observation monitoring at the core (not an add-on); field-verification module as a genuine add-on; paid pilot credited to year one, with a grant-funded pathway. Framed as indicative, not advice. Canonical model and tiers: docs/marketing/PRICING.md.
7. **About:** mission, team, Astragrid context, funders/partners.
8. **Insights / resources:** articles, the case-study template, BNG explainer content (SEO engine).
9. **Contact / Book a demo:** low-friction form, calendar, security/data note.

### 3.5 Messaging architecture

- **One-liner:** Prove your Biodiversity Net Gain is on trajectory, for the full 30 years.
- **Value pillars:** (1) See the 30-year tail, not just year one. (2) Earth observation at portfolio scale. (3) Field verification where it counts. (4) Evidence the regulator and funder accept.
- **Proof points:** EO + field reconciliation, Metric linkage, durable timestamped records, UK data residency, role-based access, pilot programmes.
- **CTAs:** primary "Book a demo"; secondary "See the trajectory" (interactive), "Talk about a pilot".

### 3.6 Visual direction for marketing

- Extends Section 1: forest + parchment + brass, editorial serif headlines, generous space, the trajectory/contour motif as a hero device.
- Hero: a live or animated trajectory rising toward "Good", with EO tiles and habitat duotone imagery.
- Motion: tasteful scroll-reveals, the chart drawing on, a scrubbable 30-year hero for the captivating moment.
- A compact brand-in-marketing kit: social templates, slide master, one-pager/leaflet for procurement, email signature and pitch template (consistent with existing Astragrid patterns), press/funder kit.

### 3.7 Content and campaign engine

- Launch kit: announcement, persona one-pagers, a founding case-study template, FAQ.
- SEO: target the BNG/30-year-monitoring term cluster; technical SEO, structured data, fast self-hosted assets.
- Outreach: funder and LPA/responsible-body shortlist, partner ecology consultancies, sector press, a creator/expert shortlist (mirroring the marketing patterns already used on sibling Astragrid products).
- Analytics: privacy-respecting, UK-friendly analytics; conversion tracking on demo/pilot.

### 3.8 Deliverables

- Full brand kit (logo suite, colour, type, tokens, guidelines PDF).
- Designed and built marketing site (all pages in 3.4), responsive, AA-accessible, fast.
- Interactive trajectory hero/demo component (shareable with the product's chart language).
- Launch and campaign kit (3.7), templates, and the procurement one-pager.

### 3.9 Phases

- **Phase 1:** Brand kit + messaging + home and one persona page at high fidelity.
- **Phase 2:** Full site build + interactive hero.
- **Phase 3:** Launch kit, SEO, outreach assets, analytics.

---

## 4. Ways of working

- **Single source of truth:** one token set feeds product and site. Brand changes propagate from `brand.ts` + tokens, never hand-copied.
- **Shipped, not just shown:** dashboard work lands as real `apps/web` components; site lands as a real, deployable build.
- **Cadence:** direction sign-off after each Phase 1 before committing to build.
- **Out of scope:** rebuilding product logic, the EO/Metric engines, or the data model (visual layer only). Statutory Metric calculation remains out of scope per the product spec.
- **Risks to manage:** keeping "luxurious" from tipping into "decorative" (principle 1 guards this); accessibility in a data-dense UI; performance with self-hosted fonts and map assets.

### 4.1 Open decisions for the kickoff

1. Display-serif choice (Fraunces vs. GT Sectra vs. Newsreader) and licensing.
2. How prominent the brass accent should be (subtle luxury vs. signature).
3. Whether executive dark mode ships in Phase 1 of the dashboard or later.
4. Marketing site platform and hosting (static export vs. the Next app), and analytics vendor under UK data rules.

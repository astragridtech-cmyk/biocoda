# BioCoda: Product Knowledge Brief (for marketing writing)

*Self-contained reference. Everything a writer (or a fresh Claude chat) needs to
produce accurate, compelling BioCoda marketing. Live product at
https://biocoda.astragrid.tech.*

## 1. One-liner and elevator pitch

**One-liner:** BioCoda monitors Biodiversity Net Gain habitats from space for
their full 30-year lifespan, so the people responsible for them can prove those
habitats are actually thriving, and act early when they are not.

**Elevator pitch:** When a development in England triggers Biodiversity Net Gain,
someone has to guarantee the replacement or enhanced habitat reaches its target
condition and holds it for at least 30 years. In practice that is checked by the
occasional site visit, so a habitat can quietly fail for years before anyone
notices. BioCoda watches every parcel continuously using free, science-grade
satellite imagery, compares each one against the condition it is legally
contracted to reach, flags the ones slipping behind, and sends field ecologists
to exactly where they are needed. The ecologist's on-the-ground verification
becomes the authoritative record, and BioCoda keeps a timestamped, tamper-evident
evidence trail for the full three decades.

## 2. The problem

- **Biodiversity Net Gain** (mandatory in England since early 2024 under the
  Environment Act 2021) requires most new development to deliver at least a 10%
  net gain in biodiversity, **secured and maintained for a minimum of 30 years.**
- That long obligation has to be monitored and enforced. Today that means
  periodic ecologist site visits: expensive, infrequent, and easy to let slip
  over three decades.
- Result: a monitoring and enforcement gap. Habitats can degrade or fail years
  before it is caught, undermining the whole point of the policy and leaving
  responsible bodies, councils, and developers exposed.

## 3. The solution and the core principle

BioCoda pairs **satellite monitoring at scale** with **targeted human
verification.**

- **Earth observation is decision support:** cheap, continuous, covers every
  parcel, catches problems early. It estimates condition, it does not certify it.
- **Field verification is authoritative:** an ecologist assessing condition
  against the recognised criteria, on site, is the record that carries legal and
  compliance weight.

BioCoda's job is to link the two and hold the 30-year evidence trail. The
satellite tells you **where to look**; the field survey **confirms it**. This
"honest, not flattering" stance is central to the brand: BioCoda never claims the
satellite replaces the ecologist.

## 4. Who it is for (audiences)

- **Responsible bodies** (organisations holding and enforcing conservation
  covenants / long-term habitat obligations): the primary user. They must
  demonstrate 30-year compliance across a whole portfolio of sites.
- **Local Planning Authorities:** monitor and enforce Biodiversity Net Gain
  delivery across their area.
- **Developers and landowners:** prove their on-site or off-site habitat is on
  track, and protect themselves against long-tail liability.
- **Field ecologists:** receive targeted survey tasks and record verifications
  (condition, geotagged photos, notes) from a mobile app.

## 5. How it works (the workflow)

1. **Bring in the plan or boundary.** Import a management plan (a Habitat
   Management and Monitoring Plan, a Landscape and Ecological Management Plan, or
   a Biodiversity Gain Plan) as a document, and BioCoda extracts each habitat
   parcel, its baseline and target condition, the year the target must be
   reached, the management actions, and the exact clause each value came from.
   Or upload an Area of Interest as a boundary file.
2. **Set the trajectory.** Each parcel gets a required curve: the minimum
   condition it must hold each year, rising from baseline to target and then
   held.
3. **Monitor from space.** Sentinel-2 satellite imagery (via Copernicus)
   estimates current condition continuously. BioCoda compares actual against
   required and classifies every parcel: on track, at risk, or awaiting a
   baseline.
4. **Verify on the ground.** When a parcel slips behind (or on demand), dispatch
   a field survey. An ecologist assesses condition on site with geotagged photos;
   that verification becomes the authoritative record and can confirm or override
   the satellite signal.
5. **Stay informed.** Notifications flag at-risk parcels; a state-of-portfolio
   digest summarises the whole estate.
6. **Prove it.** Generate a branded, timestamped, tamper-evident PDF evidence
   pack for any parcel: condition metrics, before/after satellite imagery,
   detected change, management interventions and progress.

## 6. Key features (with plain descriptions)

- **Portfolio dashboard:** every parcel on a map and in a sortable table, with a
  30-year time scrubber to view the whole estate at any management year from 0 to
  30. Headline figures: on track, at risk, awaiting Earth observation, mean
  condition, and total area under management.
- **Map layers:** colour parcels by condition, habitat type, Earth observation
  recency, or field verification status. Switchable satellite basemaps, including
  a Copernicus Sentinel-2 layer.
- **Habitat change detection:** pick any two periods (a baseline and a comparison
  window) and see before/after satellite imagery side by side, plus a "detected
  change" map (vegetation gain in green, loss in red) confined to the parcel.
  Pan and zoom stay synced across all three views. Historical date-range control.
- **Plan ingestion:** extract parcels, conditions, targets, and management
  actions from plan documents automatically, with a human review-and-approve step
  before anything is committed. Every value keeps its source clause for the
  evidence trail.
- **Area of Interest upload:** create parcels straight from real boundary files.
- **Field survey dispatch and mobile verification:** send an ecologist to a
  flagged parcel; they record the authoritative condition assessment from the
  field.
- **Notifications and portfolio digest:** early warnings and a periodic
  state-of-portfolio summary.
- **Evidence pack (PDF):** BioCoda-branded, with timestamped before/after/change
  satellite imagery, the condition metrics, management interventions and their
  progress, and tamper-evident security (a cryptographic integrity hash, a unique
  document identifier, and a watermark) so an altered pack is detectable.
- **Defra Biodiversity Metric linkage:** every parcel ties back to its Defra
  Metric baseline and target units. BioCoda links to the Metric; it does not
  recalculate or replace it.

## 7. Data and technology (accurate, non-hyped)

- **Imagery:** Sentinel-2, via the Copernicus Data Space Ecosystem. Free, dated
  (so genuine before/after over years is possible), 10 metre resolution, and
  carries the near-infrared band needed to read vegetation health (NDVI).
- **Condition scale:** scored on the Defra bands, poor / moderate / good.
- **Security and residency:** United Kingdom data residency, role-based access,
  and database-level row security so each organisation only sees its own data.
- **Shape:** a web dashboard, a mobile app for field ecologists, and the Earth
  observation processing behind them. Running live on managed cloud
  infrastructure.

## 8. Differentiators and value propositions

- **Continuous vs occasional:** 30 years of continuous monitoring instead of a
  handful of site visits. Catch a failing habitat in months, not years.
- **Triage scarce expertise:** the satellite tells ecologists exactly where to
  spend their limited time, so field budgets go where they matter.
- **Defensible, not flattering:** Earth observation is decision support, field
  verification is authoritative. The distinction is built in, which is what makes
  the evidence trustworthy for regulators.
- **A complete evidence trail:** every parcel ties back to its plan clause and its
  Defra Metric, and any parcel can be exported as a tamper-evident evidence pack.
- **Low imagery cost:** the core monitoring runs on free, science-grade Copernicus
  data, so there is no per-scene imagery bill for continuous coverage.

## 9. Brand

- **Name:** BioCoda, from *bio* + *coda*. A coda is the closing movement of a
  piece of music: here it stands for the long 30-year tail of the obligation,
  the part everyone else stops watching. BioCoda watches it to the end.
- **Signature line:** "Thirty years of habitat, on the record."
- **Logo:** the "trajectory-coda" mark, a green trajectory rising from a baseline
  dot and resolving into a violet coda arc and point.
- **Palette:** forest green (on track), orchid violet (at risk, and the coda
  accent), deep ink, warm neutrals, a pale lichen background.
- **Typography:** Poppins for the wordmark, Inter for body text, Spectral for
  serif headlines on the marketing site.
- **Tone of voice:** credible, precise, quietly confident, and plain-spoken.
  Honest over flattering. Legible to non-specialists (regulators, council
  members, developers), never jargon for its own sake.

## 10. Glossary (use these full terms in copy)

- **Biodiversity Net Gain:** the policy requiring a measurable net improvement in
  biodiversity from development.
- **Responsible body:** an organisation that holds and enforces long-term habitat
  obligations.
- **Local Planning Authority:** the council body that plans and enforces at local
  level.
- **Defra Biodiversity Metric:** the government's official method for scoring
  biodiversity value.
- **Habitat Management and Monitoring Plan / Landscape and Ecological Management
  Plan / Biodiversity Gain Plan:** the plan documents that set out what a site
  must achieve.
- **Condition bands:** poor, moderate, good.
- **Trajectory:** the required condition curve a parcel must follow over the
  30-year period.
- **Earth observation:** monitoring the ground from satellites.
- **Sentinel-2 / Copernicus:** the European Union's free satellite imagery
  programme (keep these names as-is; they are proper names).

## 11. Honest positioning guardrails (do not overclaim)

- Do not imply the satellite replaces ecologists. Earth observation flags and
  triages; field verification certifies.
- Sentinel-2 is 10 metre resolution: excellent for vegetation condition and
  change on real sites, but coarse for very small parcels. Do not imply it
  resolves individual plants, hedgerow gaps, or single trees.
- BioCoda links to the Defra Metric; it does not recalculate or replace it, and
  it does not issue legal determinations. It is a monitoring, triage, and
  evidence tool.
- Condition from Earth observation is an estimate. Say "estimate" or "indicative"
  where appropriate, and let field verification carry the authoritative claims.

## 12. House style (apply to every piece of copy)

- **No em-dashes, ever.** Use commas, colons, parentheses, or full stops instead.
- **Spell out acronyms** in reader-facing copy: "Earth observation" not "EO",
  "Biodiversity Net Gain" not "BNG", "Local Planning Authority" not "LPA". Keep
  genuine proper names and product names as-is (Sentinel-2, Copernicus, Defra).
- **Plain English.** Write so a councillor or a developer's finance director
  understands it on first read.

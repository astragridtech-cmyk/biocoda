# Accessibility self-audit: WCAG 2.2 AA

Astragrid Technologies Ltd, BioCoda. Version 1.0, July 2026. Owner: misi@biocoda.uk.

This is a structured self-audit of the BioCoda web application and website against
the Web Content Accessibility Guidelines (WCAG) version 2.2, level AA. It records
what was found, what was fixed, and what remains, so the accessibility statement is
backed by evidence. A self-audit is not a substitute for an independent audit
(tracked in the readiness checklist), but it is a genuine, code-level review.

## Method

Every user-facing surface was reviewed against the WCAG 2.2 AA success criteria,
including the new 2.2 criteria (2.4.11 Focus Not Obscured, 2.5.7 Dragging
Movements, 2.5.8 Target Size, 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8
Accessible Authentication). Surfaces: the marketing landing page, the legal and
trust pages, sign-in and the enquiry form, the portfolio dashboard (map, table,
scrubber, filters, drawer), the parcel page and its charts, the change-detection
maps, the field-verification form, the survey queue, the admin Team page, and the
password change/reset flows.

## Summary

Foundations were already strong: one `h1` per page, correct landmarks, a working
skip link on the marketing site, `lang` set, `prefers-reduced-motion` honoured,
labelled form fields, no CAPTCHA or cognitive authentication test, and status
conveyed with text and shape, not colour alone. The audit found gaps in ARIA state
on custom controls, unannounced status messages, keyboard operability of the data
table, and several brand colours falling marginally short of contrast for small
text. Most were fixed in this pass.

## Fixed in this pass

**Perceivable**
- Interactive greens and the at-risk purple darkened to meet 4.5:1 for text
  (tokens `moss`/`leaf`/`track` and the at-risk/`risk` colour); status badges,
  pills, condition pills, and the field-verification bands updated accordingly.
- Chart axis ticks and the target label darkened to meet contrast.
- `stone-400` replaced with the darker `muted` token wherever it carried
  meaningful text.
- Form control borders darkened toward the 3:1 non-text contrast minimum.
- Trajectory and timeline SVG charts given `role="img"` and a descriptive
  `aria-label` summarising the actual-versus-required condition and status.
- Decorative icons/glyphs consistently marked `aria-hidden="true"` (fixed several
  malformed bare `aria-hidden` attributes).

**Operable**
- Visible focus outline extended to inputs, selects, textareas, and any
  `[tabindex]` element (previously links and buttons only).
- `scroll-margin-top` added for anchor targets so a focused target is not hidden
  under the sticky header (2.4.11).
- Skip-to-content link and a `main` landmark added to the app layout (2.4.1).
- Data table rows made keyboard operable (focusable, Enter/Space open the drawer).
- Sortable column headers made real keyboard buttons with `aria-sort`.
- The parcel drawer closes on Escape and is labelled by its heading with
  `aria-modal="true"` (2.1.1, 4.1.2).
- Clickable KPI cards made keyboard operable.

**Understandable**
- Enquiry Demo/Pilot toggle and the field-verification condition bands turned into
  labelled radio groups with `aria-checked`, plus a non-colour selected indicator
  (a checkmark) on the bands (1.4.1, 4.1.2).
- Error banners given `role="alert"` and success/info banners `role="status"`
  across sign-in, enquiry, field verification, admin, change-password, and reset,
  so submissions are announced (3.3.1, 4.1.3).
- Sign-in inputs given `autocomplete`; the password-change form shows the
  "at least 8 characters" rule up front (3.3.2), tied via `aria-describedby`.
- Filter chips, segmented view/layer/density controls, and KPI toggles expose
  `aria-pressed`.
- The year scrubber exposes a human-readable `aria-valuetext` ("Year 9, 2034").
- Distinct page title added to the sign-in route (2.4.2).
- The change-detection date inputs given accessible labels (3.3.2).

**Authentication (3.3.8, WCAG 2.2)**
- Confirmed no CAPTCHA or cognitive-function test anywhere; password fields allow
  paste and use `autocomplete` new-password. Passes.

## Outstanding and known limitations

These are honest gaps, tracked for follow-up:

- **Map keyboard selection.** Selecting a parcel on the MapLibre map is
  pointer-only. The keyboard-accessible route is the data table and the at-risk
  register, which are now fully operable and carry the same information. Full
  keyboard marker selection and on-map pan buttons are a roadmap item.
- **Dragging alternative on maps (2.5.7).** Map zoom has buttons; panning still
  requires a drag gesture. The table is the documented non-spatial equivalent.
- **Drawer focus management.** The drawer is labelled, `aria-modal`, and closes on
  Escape, but does not yet trap focus or return focus to the trigger on close.
- **Live announcement of dashboard result changes (4.1.3).** Form messages are
  announced; live announcement of filter/scrubber-driven changes to the KPI and
  table counts is not yet implemented.
- **Target size (2.5.8).** Most controls meet 24 by 24 pixels; a few dense inline
  links and the native range thumb are close to or just under the minimum (the
  spacing exception applies to several).
- **Independent audit.** This is a self-assessment; an external audit should
  confirm it and cover assistive-technology testing.

## Conformance position

BioCoda substantially conforms to WCAG 2.2 AA after this pass, with the documented
exceptions above, principally the interactive map, for which an equivalent
keyboard-accessible experience (the table and register) is provided. This position
is reflected in the public accessibility statement.

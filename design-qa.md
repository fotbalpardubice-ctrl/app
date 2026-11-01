# Design QA — plánování práce

**Source visual truth:** `C:\Users\pmagu\.codex\generated_images\01a1968a-263c-70a2-8a37-4026cff733d4\exec-8cbe4bb9-3c44-4dff-a824-2b9d522ee1cd.png`

**Implementation:** `http://127.0.0.1:5173/` — opened in the Codex in-app browser. The browser capture was inspected live and was not saved as a project image.

**Viewport and state:** Source image 1487 × 1046 px; implementation compared at a 1440 × 1024 CSS viewport (both scaled to 720 × 512 in a temporary side-by-side browser view). November 2026 month table with four sample shifts. Responsive spot check at 390 × 844.

**Full-view comparison evidence:** Source and implementation appeared together in one in-app-browser comparison view at `/qa-compare.html`; the temporary comparison files were removed after review so they do not ship with the app.

**Focused review:** Inspected the form fields and controls at the full app viewport and the monthly table after scrolling. The selected source only shows the request form; the shift selector and month table are intentional additions requested by the user.

## Findings

- No outstanding P0, P1, or P2 findings.
- Initial comparison found a P2 brand/header mismatch: the prototype used a building icon and omitted the help and notification actions visible in the reference. Replaced the brand mark with a wrench icon and added those header actions. The updated combined comparison shows the corrected header.

## Required fidelity surfaces

- **Typography:** Inter/system sans-serif retains the reference's bold navy page title, compact labels, and restrained helper text. Text remains legible at desktop size; the mobile form labels and controls remain readable.
- **Spacing and layout:** The top bar, title, arrival/departure groups, central visit-duration marker, paired company/location fields, full-width requirements area, and right-aligned form actions follow the reference hierarchy. The month table sits below the form as requested.
- **Colors and tokens:** White form surface, pale blue page background, navy text, cobalt primary action, turquoise arrival accent, and fine cool-gray borders align with the reference.
- **Image and icon fidelity:** The reference has no photographic imagery. The app uses the Lucide wrench mark and consistent outline icons; no CSS-drawn or placeholder imagery is used.
- **Copy and content:** Interface copy is Czech. The month table includes date, shift type, company, workplace, arrival, departure, and request details. Night shifts crossing midnight show the following departure date.
- **Responsive and accessible behavior:** At 390 × 844, the form stacks without overlapping; fields and day/night controls remain usable. The desktop schedule becomes stacked shift cards on narrow screens, with no wide table columns required for reading. Fields have labels, buttons expose pressed state, and keyboard focus has a visible ring.

## Interaction check

- Selected Noční and submitted a sample request; it appeared in the selected month's table and the form reset with a success message.
- Advanced to the next month; the table showed the empty state. Reloaded to restore the clean sample state.
- Editing a sample row fills the form; saving updates that row and recalculates the displayed duration. The November 7 night shift correctly ends on November 8.
- Cloud mode presents email sign-in/account creation, loads each user's own records, saves inserts and edits, and subscribes to updates for that user. Demo mode remains local and clearly says its records disappear on refresh.
- `npm run typecheck` and `npm run build` passed. Cloud sign-up and cross-device sync were not exercised because doing so would create a user account and send an email; test the first real sign-in after choosing the app's published URL.

## Follow-up polish

- For production use on a phone, deploy the app to an HTTPS address and add that address to Supabase Auth's allowed redirect URLs. The current localhost preview is only reachable on this computer.

final result: passed

# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Work planner design decisions

- The selected work-planning screen reference is `C:\Users\pmagu\.codex\generated_images\01a1968a-263c-70a2-8a37-4026cff733d4\exec-8cbe4bb9-3c44-4dff-a824-2b9d522ee1cd.png`.
- Keep its light canvas, navy type, cobalt primary action, compact top bar, paired arrival/departure controls, and spacious request form.
- The form includes a selectable Day/Night shift type and the page includes a month-filtered table of all shifts with dates, times, company, location, and work details.
- The user chose cloud synchronization so shifts can be accessed on phone and computer. Use Supabase Auth and per-user protected cloud records; keep demo mode clearly separate from saved data.
- Keep the planner comfortable to use on a phone: stack the form and display monthly shifts as readable compact cards on narrow screens.

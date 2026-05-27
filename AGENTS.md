# Vendio UI Workflow

Use this file when changing the user interface.

## Product Feel

Vendio is an operational demo for marketplace listing automation. Keep the UI calm, confident, and task-focused. It should feel like a polished app, not a marketing landing page.

## Design Rules

- Preserve the single-flow experience: home, connect, upload, generate, review, post, dashboard.
- Optimize for scanability and repeated action: clear hierarchy, restrained color, compact controls, and predictable navigation.
- Avoid oversized decorative sections, nested cards, vague illustration, gradient-orb backgrounds, and one-note color palettes.
- Make controls complete and obvious: real button states, disabled states, loading states, and responsive behavior.
- Use stable dimensions for step cards, upload zones, listing previews, nav, and buttons so hover/loading text does not shift layout.
- Check mobile and desktop before calling UI work done.
- Text must not overlap, clip, or overflow its container at common widths.

## Verification

For UI changes, run:

```bash
npm run lint
npm run typecheck
npm run ui:snapshots
```

Then inspect the generated images in `artifacts/ui-snapshots/`.

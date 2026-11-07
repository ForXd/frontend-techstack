# Stack Atlas contributor guidance

- This project catalogs open-source frontend implementations only. Do not add proprietary hosted platforms or non-OSI licensed products to the technology catalog.
- Source of truth: `src/data/catalog.json`, `src/data/scenarios.json`, `src/engine.mjs`. Generate skill/public copies with `npm run sync`.
- Preserve stable technology IDs, official sources, repository and license URLs. Update review dates only after checking sources.
- Recommendations are conditional editorial judgments; explain alternatives and separate UI libraries from backend/native responsibilities.
- Keep the app static and compatible with the `/frontend-techstack/` GitHub Pages base path.
- Before publishing: `npm run sync`, `npm run check`, `npm run build`. For UI changes, verify desktop/mobile, keyboard paths and download/export behavior.

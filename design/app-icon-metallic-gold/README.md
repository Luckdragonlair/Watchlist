# Approved metallic-gold Nightfall icon

Owner approved 2026-11-08 after viewing white, flat gold and brighter reflective gold variants. Use the final reflective gold W with the original navy surface and blue ring. Source HTML is derived from the app-icon section in design/nightfall-v2/Watchlist Directions.dc.html; originals are preserved.

Regenerate with node scripts/build-app-icons.cjs from the project root. Requires existing @playwright/test and Edge; embeds the bundled Instrument Serif WOFF2 at generation time, makes no network calls, and writes six static PNG assets to public/icons. No browser/AI/font service is needed at app runtime. The {{FONT_DATA}} source placeholder is filled by the generator. Existing font license remains in public/fonts/instrumentserif-OFL.txt.

Sizes: any-purpose 192 and 512; full-bleed maskable 512 and Apple 180; ringless favicons 32 and 16. The maskable background is opaque edge-to-edge; ring/letter are inset within the 80%-diameter safe circle. Letter reflections use the owner-approved 160-degree multi-stop gold gradient.

Focused verification: tests/pwa/app-icons.spec.ts. Legacy icon-* placeholder files are retained but no longer referenced by current manifest/index.

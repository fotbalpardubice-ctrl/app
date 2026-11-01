# Nářadovna

Kompletní offline PWA pro evidenci firemního nářadí. Veškerá data jsou uložena lokálně v IndexedDB a aplikace nevyužívá žádný backend ani cloudové API.

## Spuštění

```bash
npm install
npm run dev
```

Produkční kontrola:

```bash
npm run typecheck
npm run lint
npm run build
```

## Data a zálohy

- Při prvním spuštění se automaticky načtou data ze `src/data/naradi.json` a `src/data/zamestnanci.json`.
- Další spuštění již počáteční import neopakuje.
- „Uložit databázi“ využije File System Access API, pokud jej prohlížeč podporuje. Uživatel tak může v systémovém dialogu zvolit iCloud Drive.
- Na Safari a dalších prohlížečích se použije standardní stažení souboru `naradi-db.json`, který lze uložit do aplikace Soubory/iCloud Drive.
- Import zálohy přepíše IndexedDB a obnoví aplikaci.

## Architektura

- `src/db` — Dexie databáze, seed a repository vrstva
- `src/pages` — lazy-loadované routy
- `src/components` — formuláře, dialogy a opakovaně použitelné prvky
- `src/contexts` a `src/hooks` — stav vzhledu, undo a živá data
- `src/utils` — JSON, PDF a Excel exporty
- `src/styles` — responzivní design a světlé/tmavé téma

Service worker a offline cache generuje `vite-plugin-pwa` při produkčním sestavení.

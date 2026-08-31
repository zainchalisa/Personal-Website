# Portfolio

Personal site: a Vite + React frontend, with media and design references kept alongside the app but out of the deployed bundle.

```text
frontend/     Vite/React application (this is what Vercel builds)
assets/       Local photography, project, and media files (hosted on Cloudflare)
scripts/      Photography manifest + variant generators
docs/         Mockups, references, and architecture notes
```

## Develop

```bash
npm install --prefix frontend
cp frontend/.env.example frontend/.env   # set VITE_ASSET_BASE_URL
npm run dev
```

```bash
npm run build    # production build
npm run lint     # ESLint
```

Photography helpers (read from `assets/photography/`, write into `frontend/src`):

```bash
npm run generate:photography-manifest
npm run generate:photography-variants
```

## Deploy

The site is a static Vite app. From this repository root, Vercel should install and build `frontend/` (`vercel.json` at the repo root sets `installCommand`, `buildCommand`, and `outputDirectory`). There is no backend in this repo.

Large media stays in `assets/` locally and is served from Cloudflare; see `docs/architecture/ASSET_HOSTING.md` (gitignored).

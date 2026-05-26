# Portfolio asset hosting

Large portfolio files (PDFs, slide decks, LaTeX reports, showcase images) are **not** stored in this website repository. They are hosted separately on **Cloudflare Pages** via Direct Upload.

## Remote base URL

Set in `.env` (see `.env.example`):

```bash
VITE_ASSET_BASE_URL=https://your-assets-host.example
```

Required at dev and build time. Copy `.env.example` to `.env` and set your Cloudflare (or custom domain) assets base URL with no trailing slash.

After re-uploading files, **increment** `VITE_ASSET_CACHE_VERSION` in `.env` (e.g. `2` → `3`) and restart the dev server. Asset URLs get a `?v=` query param so browsers skip stale cached images. Cloudflare may also cache for up to 4 hours (`max-age=14400`); bumping the version fixes the site immediately without a manual purge.

## File layout on Cloudflare

Upload assets under this structure on your static assets deployment:

```text
projects/
  sync/
    cover.webp
    sync-showcase.pdf
  classification-neural-networks/
    cover.webp
    report.pdf
    slides/slide-01.webp … slide-07.webp   (scrollable report in modal)
  sync/slides/
    slide-01.webp … slide-21.webp   (showcase slideshow in modal)
photon/
  logo-light.png
  …/web/*.jpg   (demo album images)
```

Each file must stay **below 25 MiB** (Cloudflare Pages per-file limit). Compress PDFs before upload.

## Adding a new project

1. Export the cover image as `.webp` (optimized, modest dimensions).
2. Upload the cover and any PDF to the Cloudflare Pages assets project, matching the folder layout above.
3. Add a project entry in `src/pages/projects/projectsData.ts` using `assetUrl('/projects/your-slug/...')` for remote paths.
4. Set link fields honestly:
   - `documentLabel` — e.g. `view showcase`, `view report`, `view case study`
   - `githubUrl` / `liveSiteUrl` — only when a real URL exists; use `null` otherwise
5. The modal shows only buttons for links that are non-null.

## Website wiring

- `src/lib/assetUrl.ts` — builds full URLs from `VITE_ASSET_BASE_URL`
- `src/pages/projects/projectsData.ts` — project metadata and remote paths
- `src/pages/photon/` — demo images and logo via `assetUrl('/photon/...')`
- Modal preview loads **cover images only** (lazy). PDFs open in a new tab when the user clicks the document button.

## Trip Dog (password-protected project)

The public repo only has a **stub** in `projectsData.ts` (title emoji, year, empty tags, generic “password protected” line). Real copy and stack tags are **not** committed — they are loaded at runtime from the `TRIPDOG_PROJECT_JSON` environment variable (see `tripdog.project.example.json` for the shape).

1. Copy `tripdog.project.example.json` → `tripdog.project.json` (gitignored), fill in your real description and tags.
2. In `.env`, set `TRIPDOG_PASSWORD` and `TRIPDOG_PROJECT_JSON` (minified single-line JSON). **Never** use a `VITE_` prefix.
3. For production, add both variables in the **Cloudflare Pages** dashboard for the **site** deployment (encrypted).
4. Unlock: `POST /api/tripdog/unlock` returns project JSON once per password entry. Unlock state is kept **in memory only** for the current page visit — a full refresh locks Trip Dog again. **Failed** attempts are rate-limited in app code (5 per 15 minutes per IP per isolate) — see `functions/_lib/rateLimit.ts`, not a separate WAF config in this repo.
5. Local dev: Vite proxies `/api/tripdog/unlock` via `vite.config.ts`; production uses `functions/api/tripdog/unlock`.

### Test rate limiting

**Application limit** (wrong passwords only):

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:rate-limit

# Production
BASE_URL=https://your-site.example npm run test:rate-limit
```

Expect HTTP `401` × 5, then `429` with `Retry-After` on the 6th attempt. You can also test in the UI: Projects → Trip Dog portal → enter wrong password six times.

**Cloudflare WAF** (optional dashboard rule): this repo does not define WAF. If you added a rate rule under **Security → WAF**, use that rule’s **Events / Metrics** while running the script against production, or lower the WAF threshold temporarily and confirm you get a Cloudflare block response before your app’s JSON `429`.

## Before pushing to GitHub

```bash
npm run prepush          # checks for staged secrets + runs build
# optional: auto-run on every git push
git config core.hooksPath .githooks
```

Never commit `.env`, `tripdog.project.json`, or `dist/`. Production Trip Dog values belong only in Cloudflare Pages environment variables.

Large portfolio PDFs under `src/pages/projects/assets/` are gitignored for **new** files; game sprites already in the repo stay tracked for the Vite build.
6. Security headers ship via `public/_headers` (Cloudflare Pages) and `vercel.json` (Vercel).

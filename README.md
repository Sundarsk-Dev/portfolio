# Kamal Sundar SK - portfolio

A static portfolio with no build step or runtime dependencies. Open `index.html` locally, or serve this directory from a static host.

## Files to publish

- `index.html`, `projects.html`, `publications.html`
- `projects/research-agent.html`, `projects/trace.html`, `projects/investigative-engine.html`
- `assets/` - the shared `portfolio.css`, `navigation.js` and ten optimized WebP images listed below
- `Kamal_Sundar_SK_FlowCV_Resume_2026-10-24.pdf`

Keep the complete `assets/` directory. The homepage entrance uses both the background and foreground layers; its still image supplies the fallback.

| Image files in assets/ | Purpose |
|---|---|
| `cinematic-silhouette.webp`, `cinematic-silhouette-mobile.webp` | Homepage still and fallback |
| `hero-background.webp`, `hero-background-mobile.webp` | Homepage entrance background |
| `hero-foreground.webp`, `hero-foreground-mobile.webp` | Homepage entrance silhouette |
| `projects-silhouette.webp`, `projects-silhouette-mobile.webp` | Projects: raised-hands control-room figure |
| `publications-silhouette.webp`, `publications-silhouette-mobile.webp` | Publications: seated profile |

## Git and local source files

Keep `.gitignore`, `README.md` and `scripts/` in Git with the site files. Source PNGs, the personal photo and unused experiments remain in `artwork/`; `.gitignore` excludes that folder, `review/` captures, caches and local planning/handoff documents. These files are preserved locally and are not required to publish the site.

A fresh clone works with the committed WebP exports. Keep a separate copy of `artwork/` if you want to regenerate images on another computer; ignored originals do not travel with Git.

## Checks

With Python/Pillow and Node available:

```powershell
python scripts/check_portfolio.py
node scripts/check_motion.cjs
```

Browser checks use an installed Playwright package and Chrome/Chromium:

```powershell
$env:PLAYWRIGHT_MODULE = '<path to the installed Playwright package>'
$env:PORTFOLIO_BROWSER = '<path to Chrome or Chromium>'
node scripts/check_browser.cjs
```

The browser suite checks all six pages at 320, 390, 768, 1024, 1100, 1101, 1440 and 1920 CSS pixels, serves local files through route interception, and writes screenshots to `review/`.

`python scripts/prepare_artwork.py` optionally rebuilds the ten WebP exports from the original PNGs in local `artwork/`. It is a maintenance command, not a deployment build step.

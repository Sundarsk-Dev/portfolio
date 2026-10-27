# Kamal Sundar SK - portfolio

Live site: https://sundarsk-dev.github.io/portfolio/
Repository: https://github.com/Sundarsk-Dev/portfolio

<<<<<<< HEAD

use this link to view my deployed site : https://sundarsk-dev.github.io/portfolio/index.html


## Files to publish
=======
Six static HTML pages with no build step or runtime dependencies. GitHub Pages publishes main from / (root); pushing main redeploys the site. Tags mark milestones but do not choose the deployed version.
>>>>>>> 7c58953 (fixed mobile view , added pagewise heros silo)

## Current baseline

The non-3D portfolio is the release candidate for v1.1.0. Home retains its approved silhouette entrance. Projects uses the supplied Cyberpunk Operations Room image with unobstructed hands and sleeves: figure first, then room/title/copy, settling in 1.4 seconds. Its established Georgia heading and fuller introduction sit beside the artwork on desktop and above it on phones. The oversized centered title trials were reverted. Publications retains its seated-profile artwork: lamp, profile and workspace reveal in about 1.03 seconds on desktop and 600ms on phones.

Projects text follows the figure; keyboard/focus/scroll immediately finishes its entrance. Publications titles and links remain immediate while its artwork waits to enter view. Direct hashes, history, reduced motion, save-data, resize and load failures expose the responsive still. Temporary masked copies are removed at completion. Home and Publications crops remain unchanged.

The case-study journey is Research Agent -> Trace -> Investigative Engine -> Publications. Each study returns to its matching Projects row; Publications returns to the selected list. Lower Home columns align, with static experience/education/about/contact sections and grouped project/research reveals above them.

The moving-tower experiment and its Play UI remain local under experiments/ and review/. Future 3D work is a separate phase. Production pages do not load experimental code or assets.

## Maintenance and file ownership

Read AGENTS.md and transfercontext.md first. The latter contains current checks, boundaries and pending release work. portfolio-plan.md is the current release checklist. Preserve uncommitted work and inspect git status before editing.

| Location | Contents |
|---|---|
| index.html | Home |
| projects.html, publications.html | Indexes |
| projects/*.html | Three detailed case studies |
| assets/ | Shared CSS/JS and all ten active WebPs |
| Kamal_Sundar_SK_FlowCV_Resume_2026-10-24.pdf | Resume referenced by all pages |
| scripts/ | Production checks and retained artwork preparation recipes |
| AGENTS.md, transfercontext.md, portfolio-plan.md, README.md | Instructions, current handoff, release checklist and maintenance guide |
| artwork/ (ignored) | Original/source images; back up separately |
| experiments/ (ignored) | Connected-flow prototype code/brief and retired trials; back up separately |
| review/ (ignored) | Generated captures, videos and review UIs |

Runtime is 19 files: six HTML pages, 12 files in assets/ and the PDF. Keep repository-relative URLs for local previews and the /portfolio/ Pages path. The checker rejects missing or unused deployed assets. Do not ignore image formats globally: active assets must stay versioned.

## Artwork

| WebP base in assets/ | Source in local artwork/ |
|---|---|
| cinematic-silhouette | Cinematic Sci-Fi City Within a Silhouette.png |
| hero-background | hero-background.png |
| hero-foreground | hero-foreground.png |
| projects-silhouette | Cyberpunk Operations Room Silhouette.png |
| publications-silhouette | silo for projects.png |

Each base has desktop and -mobile.webp variants. All ten remain required; they total 781146 bytes. Both Home stills and all four entrance layers are active fallbacks/effect inputs.

Projects uses an inline SVG mask traced from the new source in 1585x992 coordinates. The mobile image/mask follows the x=170..1350 crop. Keep the hands intact and preserve the shared mask/image geometry; the old pose's trace is incompatible. Publications reuses its responsive still under small CSS masks; no new bitmap or pose is needed.

python scripts/prepare_artwork.py exports the active WebPs from local PNGs with Pillow. A clone serves without regeneration. scripts/prepare_hero.py retains the original mask/background reconstruction recipe (Pillow, NumPy, OpenCV); it overwrites source layers and must only run for an explicitly requested artwork change. Retired index-layer work is preserved in experiments/retired/prepare_index_artwork.py and is not a production recipe.

Publication years remain the approved Crossref values 2026/2025. Keep the chapter's differing publisher-year disclosure, HMM under-review status and verified DOI links. Factual boundaries and dates are in AGENTS.md/handoff; do not invent metrics, credentials or links.

## Preview and checks

Open index.html in Chrome using Ctrl+O. For an HTTP preview, run python -m http.server 8000 from this folder and open http://localhost:8000/ when loopback networking is available.

```powershell
python scripts/check_portfolio.py
node scripts/check_motion.cjs
$env:PLAYWRIGHT_MODULE = '<installed Playwright package path>'
$env:PORTFOLIO_BROWSER = '<Chrome or Chromium executable>'
node scripts/check_browser.cjs
```

Current-machine paths are in transfercontext.md. Use installed runtimes; do not install dependencies automatically. The static checker validates links, IDs, assets, image budgets/alignment, factual boundaries, palette contrast, JS syntax and Markdown limits. The motion check uses browser API doubles.

The browser suite covers all six pages at 320/390/768/1024/1100/1101/1440/1920px, lower Home alignment, keyboard/focus, anchors/history, downloads, touch, zoom-equivalent layout, reduced motion and no JS. Projects and Publications include entrance order, matching final still/crop, local-file behavior, cancellation and injected failures. Projects also checks mask landmarks, hand/text clearance and the 1.4-second timing. Target either entrance with --projects-entrance or --publications-entrance. Captures are in review/verification/. Local interception does not verify hosting or other engines.

To see the Projects reveal, open projects.html without a #fragment and reload at the top using the mouse. Allow 1.4 seconds without scrolling or pressing a key. Reduced-motion/save-data and short-screen fallbacks intentionally show the still. The PNG review frames are static; the actual effect runs in the HTML page.

The experimental UI stays at review/connected-flow/index.html; recorded prototype videos are at review/connected-flow/playback.html. Its reproducible scripts moved to experiments/connected-flow/ (prepare_flow_storyboard.py, check_flow_preview.cjs, check_flow_playback.cjs, compose_flow_storyboard.py). Run them from the project root with their new paths and the same environment above. Their content is separate from the release; JPG/PNG frames are static. A Git clone excludes these experiments and source images.

## Publish the non-3D milestone

Local HEAD is 711fcc9. GitHub main was checked/fetched on 2026-10-27 and is one commit ahead at 8aea0b5: a README-only addition of the live-site link, already represented above. Incorporate that commit before pushing. The working candidate is uncommitted; no new tag or deployment is claimed. v1.1.0 is proposed and was absent locally/remotely when checked; never force or move a published tag.

After reviewing the final diff and passing checks, stage only the reviewed release files. The ignore rules exclude original artwork, generated review output, experiments, caches, tool state and local environment files.

```powershell
git status --short
git diff --check
git diff
git add .gitignore AGENTS.md README.md portfolio-plan.md transfercontext.md index.html projects.html publications.html projects assets scripts
git diff --cached --stat
git commit -m "Complete the non-3D portfolio"
git pull --rebase origin main
```

Finish the rebase before tagging or pushing. If the known README-only change conflicts, keep the candidate README, which already contains the live-site link. During this rebase only, the following selects the replayed candidate file and completes the resolution:

```powershell
git checkout --theirs -- README.md
git add README.md
git rebase --continue
```

After a successful rebase, run the static and motion checks above and inspect git status. Then publish:

```powershell
git tag -a v1.1.0 -m "Non-3D portfolio baseline"
git push origin main
git push origin v1.1.0
```

These are user release commands, not actions already performed. After publishing, check https://github.com/Sundarsk-Dev/portfolio/actions for the Pages deployment, then verify live Home, Projects, Publications, exact record links and the PDF. A successful push alone is not deployment verification.

For subsequent updates, use patch tags for fixes, minor tags for features and major tags for substantial redesigns. To undo a published change, use git revert with the identified commit, run checks and push the resulting new commit. Do not rewrite published history or move an existing tag.

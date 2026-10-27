# Portfolio transfer context
Updated: 2026-10-27. Non-3D candidate complete locally; Projects entrance shortened to the requested 1.4 seconds.

## Objective and completed work
- Latest direction: shorten Projects to 1.4 seconds and verify GitHub push readiness. Retain the established typography, expanded side text and new Projects pose.
- Projects uses artwork/Cyberpunk Operations Room Silhouette.png, exported as the two existing projects-silhouette WebPs. Both hands/sleeves are clear; the plant does not overlap the figure.
- Finished the previously partial swap: inline SVG traced in 1585x992 coordinates, responsive image dimensions, and x=170..1350 mobile mask/crop alignment.
- Entrance: figure 0-750ms; room 750-1400ms; title 850-1250ms; copy 950-1350ms; caption 1050-1400ms. Keyboard/focus/scroll/resize cancels into the still.
- Desktop: substantial artwork left, established Georgia heading and expanded introduction right. Edge fade clears the reading area after the right hand. Phones: text above artwork. Both rejected centered-title trials are removed.
- Home keeps its accepted silhouette/layers. Publications keeps the seated profile with lamp -> profile -> workspace (1.03s desktop / 600ms mobile), triggered when visible; its text stays immediate.
- Case-study journey: Research Agent -> Trace -> Investigative Engine -> Publications. Each study returns to its matching Projects row; Publications returns to projects.html#case-studies.
- Lower Home columns align; experience/education/about/contact are static. Grouped project/publication reveals and native scrolling remain.
- Active assets are consolidated in assets/; source inputs in ignored artwork/, experiments in ignored experiments/, generated captures in ignored review/. No production page loads the tower experiment.
- README, portfolio-plan.md and AGENTS.md reflect the current source, timing, rejected title trials and release boundary.

## Actual verification
- Full Chrome 156 browser suite PASS: six pages at 320/390/768/1024/1100/1101/1440/1920px; text/hand clearance, layout, links and targets.
- PASS: both entrance sequences, exact final still/crop, local-file masks, cancellation, keyboard/hash/history, no-JS/reduced/save-data, unsupported APIs and failed/stalled image decode.
- PASS: project/publication journey, current-section tracking, new-tab isolation, PDF download, touch and 720 CSS pixels at DPR 2 (zoom-equivalent layout).
- Projects tests now check source mask landmarks for head/fingers/palms/sleeves, gaps between fingers, and 1400ms completion. Fixed a stale browser test that still expected the old All projects label instead of Back to projects/#trace.
- Static content/link/asset/JS/context checks and motion API-double checks passed. Ten active WebPs total 781146 bytes, within existing budgets.
- Full layout/navigation suite passed before the timing-only revision. Focused Projects suite PASS again at 1.4s (desktop/mobile, silhouette/text order, final crop and fallbacks); static/motion/diff checks also passed.
- Ignore audit: deployable assets/scripts/docs included; artwork/review/experiments excluded. No local source or generated capture is selected by Git's non-ignored file list.
- Local Chrome verification only; no hosted deployment, physical phone or other browser engine verification.

## Reproduction
```powershell
$env:PLAYWRIGHT_MODULE = 'C:/Users/KUZHALAMANI/AppData/Local/Programs/Python/Python311/Lib/site-packages/playwright/driver/package'
$env:PORTFOLIO_BROWSER = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
$env:PLAYWRIGHT_BROWSERS_PATH = 'C:/Users/KUZHALAMANI/AppData/Local/ms-playwright'
python scripts/check_portfolio.py
node scripts/check_motion.cjs
node scripts/check_browser.cjs
git diff --check
```
- Focus either entrance with --projects-entrance or --publications-entrance. Captures: review/verification/projects-entrance-{figure,surroundings,final}-{390,1440}.png.
- To see actual movement: Chrome Ctrl+O -> projects.html (no hash), mouse reload at top, wait 1.4s without scrolling/keyboard input. Reduced-motion/save-data and short-screen modes show the completed still. PNG captures are static.
- Optional HTTP preview: python -m http.server 8000, then http://localhost:8000/projects.html when loopback access is available.

## Pending and boundaries
- Website files/checks are ready. User retains release actions; do not introduce another visual redesign.
- No staging/commit/tag/push/publishing this pass. Read-only remote check plus fetch found origin/main at 8aea0b5, one README-only commit ahead of local HEAD 711fcc9. The current README already includes its live-site link. v1.1.0 remains proposed, absent locally/remotely when checked.
- Before pushing: commit the reviewed candidate, rebase onto origin/main, then tag/push. README has exact commands and the known README conflict resolution. Fetch updated remote-tracking refs only; the local branch was not advanced.
- Preserve the new original PNG and all other source inputs separately when moving computers; Git excludes artwork/ and experiments/.
- Future 3D and tower transitions are a separate phase; no production integration of the experimental connected-flow viewer.
- Keep the dark palette, all ten active WebPs, accepted Home entrance and all interaction/still fallbacks. Do not regenerate Home source layers without an artwork request.
- Publications: verified DOI records and approved Crossref years 2026/2025; keep the differing chapter publisher-year disclosure, HMM under review, Semantic-Merkle excluded. Preserve factual boundaries in AGENTS.md.
- Handoff <=60 lines/6144 bytes; other authored Markdown <=200 lines/16384 bytes. No working.md remains.

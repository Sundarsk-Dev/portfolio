# Non-3D portfolio release checklist
Updated: 2026-10-27. The latest scope is to finish the existing portfolio and prepare it for GitHub Pages; 3D work follows separately.

## Completed implementation
- Keep the accepted Home silhouette and dark palette. No new runtime dependency.
- Research uses the existing seated profile: lamp -> profile -> workspace, about 1.03s desktop / 600ms mobile. Headings/links remain immediate; artwork waits for visibility.
- Projects uses the supplied Cyberpunk Operations Room image and a matching mask: both hands/sleeves clear; figure first, then room/title/copy, completed in 1.4s. Restore established heading typography with expanded side text after the oversized centered title trials were rejected. Stack text above artwork on phones.
- Preserve still/no-JS/reduced-motion/save-data/hash/history/failure behavior and native scrolling.
- Connect Research Agent -> Trace -> Investigative Engine -> Publications. Study returns target #research-agent/#trace/#investigative-engine on Projects; Publications returns to #case-studies.
- Align lower Home columns and quiet experience/education/about/contact motion. Retain grouped project/publication reveals, factual text, original titles and approved publication years.
- Retain every active asset. Keep originals in ignored artwork/, experimental source in ignored experiments/, generated UI/captures in ignored review/. Remove only the verified empty working note.

## Release checks
- python scripts/check_portfolio.py: content, links, IDs, asset references/budgets, syntax and context limits.
- node scripts/check_motion.cjs: native navigation and cancellation checks.
- node scripts/check_browser.cjs: six pages/eight widths, both entrances, original final crops, fallbacks, mobile, keyboard, history, hashes, download, touch and zoom.
- Review current desktop/mobile captures, especially Projects hand/text clearance and Publications title/art balance. The latest Projects arrangement is implemented for review; visual approval is not presumed.
- Audit git ls-files --cached --others --exclude-standard and ignore rules: runtime files and maintained production tooling included; no experimental/source/generated material included.
- README/handoff must reflect actual checks and actual Git actions. Proposed release: v1.1.0; do not represent it as a created tag.

## Publication and future work
Release commands and rollback guidance are in README.md. Remote main is one README-only commit ahead (8aea0b5); the candidate already includes that live-site link. Commit the candidate and complete the documented rebase before tagging/pushing. No commit/tag/push has been performed. Publishing main deploys Pages, so hosted verification follows the user's push.

The previous tower/scene experiment is preserved in experiments/connected-flow/brief.md and its existing Play UI. It is not part of the non-3D runtime. Future 3D concepts and larger scene changes await the user's next instructions.

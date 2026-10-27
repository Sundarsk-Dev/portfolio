# Portfolio working agreements

## Start here

- Read this file and `transfercontext.md` first. Use `README.md` for file ownership, checks, versioning and deployment commands.
- The latest user request sets the scope. Old plans and completed phases are context, not new authorization.
- State concrete deliverables/checks, execute the approved scope, verify, and update the handoff. Ask only for material missing information or a new scope decision.
- Use Ponytail for coding when available. Keep changes small; use installed runtimes and load only relevant enabled skills. No agent/council dispatch unless explicitly requested.
- User-requested skill reading belongs to a subagent; the main agent uses concise findings. Installed paths do not establish session availability.
- For authorized team work, keep one writer per file and at most four active agents. The main agent reviews every contribution; a separate verifier checks the integrated result. Workers return concise notes for the main agent to fold into working.md/handoff.
- Requested technical consultants use GPT-6 Astra. Stop/replace cross-resource-error instances; after more than three such errors use Sol. Sol fallback is also authorized for Astra token rate limits. Retire stale agents.
- Follow the current user authorization for Git actions and GitHub settings. Without delegation, leave staging, commits, tags, pushes and publishing to the user. Authorization for a completed phase is not standing permission for future releases.
- Pushing `main` redeploys the live Pages site. Never rewrite published history or move an existing release tag as routine cleanup.

## Project map

- Six static HTML pages; `index.html` is the homepage. `projects.html` and `publications.html` are indexes; `projects/*.html` are three case studies.
- `assets/portfolio.css` holds shared styles. `assets/navigation.js` handles progressive motion/navigation and loads in the head before DOMContentLoaded.
- All deployed images are in `assets/`. Keep relative links so both local previews and the `/portfolio/` Pages path work.
- `README.md` is the maintenance guide; `transfercontext.md` is the single current handoff. Both travel with Git, alongside these instructions.
- `artwork/` holds ignored source files; `experiments/` holds ignored prototype code and retired trials; `review/` holds ignored generated previews. Back up originals and experimental source separately when changing computers.

## Accepted design and content

- Retain the charcoal/slate surfaces, warm white text, amber accents, teal/amber artwork, Georgia headings and Segoe UI/Arial body text unless a redesign is requested.
- The cream/teal implementation was rejected on 2026-10-26: pale surrounds clashed with the dark artwork, especially the white frame around Home. The restored dark site is the current baseline; earlier palette approval no longer authorizes that implementation.
- Latest Projects scope allows artwork and text beside each other. Keep the figure substantial with both hands intact; do not move it below the text on desktop. Review a rendered composition before another broad visual pass.
- Home uses the cinematic right-facing silhouette; Projects uses the raised-hands control-room figure; Publications uses the seated profile.
- Both index openings use absolute artwork with live text around the figure; at <=1100px text is above the image. Artwork scrolls away normally into solid reading surfaces.
- Preserve both Projects hands, the Publications profile and homepage layer alignment. Keep titles, dates and captions in HTML.
- The user approved the working homepage silhouette entrance. Preserve its still fallback, background/foreground layers, shared crops, reduced-motion and keyboard behavior.
- The Projects silhouette-first entrance is also approved. Preserve its inline SVG mask, aligned responsive still, room/text reveal and immediate interaction fallbacks.
- Projects now uses Cyberpunk Operations Room Silhouette.png, with clear hands/sleeves and no overlapping foreground plant. Its inline SVG is traced in 1585x992 coordinates; mobile crops x=170..1350. Never reuse the old pose's mask.
- Projects reveals the figure first, then room/title/copy, settling in 1.4 seconds. Oversized centered serif and sans-serif title trials were rejected; the current revision restores the established Georgia heading beside the artwork and adds explanatory text. Do not describe this revision as visually approved yet.
- Publications uses the existing seated profile with a short lamp/profile/workspace reveal. Keep the title and links immediate, wait for the art to enter view, and preserve the original final crop and still fallbacks. No replacement image is needed for this non-3D baseline.
- Homepage order: hero, projects, publications, experience, education, about/current work, contact.
- Keep three detailed projects and six earlier summaries; Claimwise stays deduplicated. Preserve the Projects caption and text-only "Beyond the feature" section.
- Publications retain the resume's titles/status, with both published DOI links verified on 2026-10-27. Use the user-approved Crossref years 2026/2025; the chapter's differing publisher year is disclosed. HMM remains under review; Semantic-Merkle is excluded. Do not invent links, metrics, publication status or credentials.
- Education omits GPA: SNU M.Tech CSE is in progress from July 2026; SRM B.Tech CSBS is 2022-2026. Experience is CyStar April-June 2026 and uTest October 2025.
- Resume changes may affect all six pages. Check shared references and factual content before renaming or replacing the PDF.

## Assets and verification

- Keep every active WebP, including all four homepage entrance layers and both still fallbacks. Validate references before deleting an asset.
- `scripts/prepare_artwork.py` exports the active WebPs from local source PNGs; regeneration is optional and not needed to serve a clone.
- `scripts/prepare_hero.py` is the retained reconstruction recipe, requiring Pillow, NumPy and OpenCV plus local source images. It overwrites source layers; run only when that artwork change is requested.
- The hero mask is traced and the hidden background reconstructed; preserve the accepted layers unless the task requires changing them.
- Run `python scripts/check_portfolio.py` for content, asset, link or documentation changes. Run the motion check for navigation changes and Playwright for rendered layout/interaction changes.
- Re-run checks after relevant edits/failures, not as an unbounded polish loop. Browser commands and actual coverage are documented in README/handoff.
- Before deleting/moving files, verify exact resolved targets stay inside this project and preserve source inputs. Keep only useful current review captures; tests can regenerate the rest.

## Handoff and versioning

- Git commits are working history; annotated `vMAJOR.MINOR.PATCH` tags identify published milestones. Do not create copied site folders or parallel VERSION/changelog catalogs.
- Record actual commits/tags separately from proposed ones. README contains the one-time baseline and subsequent update/rollback steps.
- Update `transfercontext.md` after meaningful progress: objective, completed work, actual checks, pending work/approval, reproduction and boundaries. Replace stale entries.
- Handoff cap: 60 lines and 6 KiB UTF-8. Other authored Markdown: 200 lines and 16 KiB; instruction files are exempt.
- Fold useful facts into the existing instructions/README/handoff and remove superseded plans. At most one optional `working.md`, cleared at handoff.
- Keep credentials out of all files. Report verification limits clearly; a local simulation is not proof that a hosted deployment succeeded.

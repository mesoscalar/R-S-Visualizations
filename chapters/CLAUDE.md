# CLAUDE.md — chapters (book-ordered companion to R&S Part II)

> **Read the root `/CLAUDE.md` first.** It holds the shared rules (verified
> kernels, `npm test` + `npm run build` as the oracle, never weakening
> tolerances, small committed increments, `@rsvis/math` for shared math). This
> file covers only what is specific to `chapters/`.

## What this is

Where the gallery is organised by *idea*, this companion is organised by the
*book*: Rudolph & Schmidt, *Differential Geometry and Mathematical Physics,
Part II* (Springer 2017), chapter by chapter, section by section. The contents
page is a spine of the book's numbered items (Definition/Proposition/
Theorem/Lemma/Corollary/Example/Remark) with page numbers; **stations** are
interactive pictures attached to specific items.

## Rules specific to this subproject

- **The manifest is the source of truth for the book.** `src/book/ch<N>.ts`
  lists sections, numbered items (kind, number, title, page, a one-line
  paraphrased gist) and stations (which items and equations they illustrate).
  Every number, title and page must be read off the book itself — **never
  guessed**. If the relevant pages have not been supplied, leave the section's
  `items` empty (it renders as "not yet covered") and ask for the pages.
- **Never commit the book.** The PDF is copyrighted; read it from a local
  upload (scratchpad), extract text with `pdftotext`, and quote nothing longer
  than a formula. Gists are paraphrases. `*.pdf` is gitignored repo-wide.
- **Use the book's conventions, not ours.** Where the book fixes a convention
  (e.g. Hopf map $(2\bar z_1 z_2, |z_1|^2-|z_2|^2)$, $\kappa_i = z_i/|z_i|$,
  $\omega_c = \bar z_1 dz_1 + \bar z_2 dz_2$ valued in $i\mathbb R$), kernels
  implement exactly that and the tests assert the book's displayed formulas.
  Where a sign depends on an orientation the book leaves implicit, the caption
  says so.
- **Kernels.** Bundle geometry reusable beyond one station goes into
  `@rsvis/math` (e.g. the Hopf trivializations); station-specific logic lives
  in `src/math/` with tests in `test/`. `test/manifest.test.ts` checks the
  manifest's internal consistency (numbering, pages, station citations).
- **Renderers** (`src/stations/*.ts`) export
  `mount(container: HTMLElement): () => void` and are registered in
  `src/stations/index.ts`.
- **Explainers** (the text under each station) live in
  `src/book/explainers.ts`, not in the renderers, with four parts: *what you
  are looking at*, *try this* (concrete experiments and what to notice), *what
  is going on* (the idea in short steps, citing items by number), *where this
  leads*. Write for a reader seeing the idea for the first time: intuition
  before formalism, one claim per sentence. `test/explainers.test.ts` checks
  that every station has one, that all `$…$` TeX compiles in KaTeX, and that
  every cited item exists with the cited kind.

## Deployment

Served at `/R-S-Visualizations/chapters/` (Vite `base`), assembled by the root
Pages workflow next to the gallery and bundle.

## Progress journal

`chapters/PROGRESS.md`: per station — items covered, test results with actual
errors vs tolerance, unverified rendering caveats, and what to look at first.

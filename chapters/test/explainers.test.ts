import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { EXPLAINERS } from '../src/book/explainers';
import { SECTIONS, STATIONS, findItem } from '../src/book';

const texts = (e: (typeof EXPLAINERS)[string]) => [e.see, ...e.tryIt, ...e.idea, ...(e.ahead ? [e.ahead] : [])];
const ABBR: Record<string, string> = {
  Def: 'Definition',
  Prop: 'Proposition',
  Thm: 'Theorem',
  Lemma: 'Lemma',
  Cor: 'Corollary',
  Ex: 'Example',
  Rem: 'Remark',
};

describe('station explainers', () => {
  it('every station has exactly one explainer, and vice versa', () => {
    expect(Object.keys(EXPLAINERS).sort()).toEqual(STATIONS.map((s) => s.id).sort());
  });

  it('every $…$ fragment (explainers, card summaries, item gists) is valid KaTeX', () => {
    const all = [
      ...Object.values(EXPLAINERS).flatMap(texts),
      ...STATIONS.map((s) => s.summary),
      ...SECTIONS.flatMap((s) => s.items.map((i) => i.gist)),
    ];
    for (const t of all) {
      expect(t.split('$').length % 2, `unbalanced $ in: ${t.slice(0, 60)}`).toBe(1);
      for (const m of t.match(/\$[^$]+\$/g) ?? []) {
        expect(() => katex.renderToString(m.slice(1, -1), { throwOnError: true }), m).not.toThrow();
      }
    }
  });

  it('every book item cited by number exists in the manifest with the cited kind', () => {
    for (const e of Object.values(EXPLAINERS)) {
      for (const t of texts(e)) {
        for (const m of t.matchAll(/\b(Def|Prop|Thm|Lemma|Cor|Ex|Rem)\. (1\.\d+\.\d+)/g)) {
          const it = findItem(m[2]);
          expect(it, m[0]).toBeDefined();
          expect(it!.kind, m[0]).toBe(ABBR[m[1]]);
        }
      }
    }
  });
});

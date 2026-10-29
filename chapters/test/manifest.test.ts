import { describe, expect, it } from 'vitest';
import { SECTIONS, STATIONS, findItem } from '../src/book';

describe('the manifest tracks the book', () => {
  it('items are numbered consecutively within each section, in page order', () => {
    for (const s of SECTIONS) {
      s.items.forEach((it, k) => {
        expect(it.num).toBe(`${s.num}.${k + 1}`);
        if (k > 0) expect(it.page).toBeGreaterThanOrEqual(s.items[k - 1].page);
      });
    }
  });

  it('every item lies within its section page range', () => {
    SECTIONS.forEach((s, k) => {
      const next = SECTIONS[k + 1];
      for (const it of s.items) {
        expect(it.page).toBeGreaterThanOrEqual(s.page);
        if (next) expect(it.page).toBeLessThanOrEqual(next.page);
      }
    });
  });

  it('every station cites existing items of its own section, in book order', () => {
    const ids = new Set<string>();
    for (const st of STATIONS) {
      expect(ids.has(st.id)).toBe(false);
      ids.add(st.id);
      expect(SECTIONS.some((s) => s.num === st.section)).toBe(true);
      expect(st.id).toMatch(new RegExp(`^${st.section.replace('.', '\\.')}[a-z]$`));
      st.items.forEach((num, k) => {
        expect(findItem(num)).toBeDefined();
        expect(num.startsWith(`${st.section}.`)).toBe(true);
        if (k > 0) {
          const prev = st.items[k - 1].split('.').map(Number)[2];
          expect(Number(num.split('.')[2])).toBeGreaterThan(prev);
        }
      });
    }
  });
});

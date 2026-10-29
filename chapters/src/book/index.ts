/**
 * All chapters of the manifest, flattened for lookup. Item and station
 * numbers carry their chapter, so they are unique across chapters.
 */
import * as ch1 from './ch1';
import * as ch2 from './ch2';
import type { BookItem, BookSection, Station } from './types';

export type { BookItem, BookSection, ItemKind, Station, StationModule } from './types';
export { itemLabel } from './types';

export interface Chapter {
  num: number;
  title: string;
  sections: BookSection[];
  stations: Station[];
}

export const CHAPTERS: Chapter[] = [ch1, ch2].map((c) => ({ ...c.CHAPTER, sections: c.SECTIONS, stations: c.STATIONS }));
export const SECTIONS: BookSection[] = CHAPTERS.flatMap((c) => c.sections);
export const STATIONS: Station[] = CHAPTERS.flatMap((c) => c.stations);

export function findItem(num: string): BookItem | undefined {
  for (const s of SECTIONS) {
    const it = s.items.find((i) => i.num === num);
    if (it) return it;
  }
  return undefined;
}

/** The chapter a section or station number belongs to ('2.1a' → 2). */
export const chapterOf = (num: string): number => parseInt(num, 10);

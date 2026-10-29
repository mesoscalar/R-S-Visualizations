/** Shared manifest types for all chapters. */

export type ItemKind =
  | 'Definition'
  | 'Proposition'
  | 'Theorem'
  | 'Lemma'
  | 'Corollary'
  | 'Example'
  | 'Remark';

export interface BookItem {
  kind: ItemKind;
  num: string;
  title?: string;
  page: number;
  gist: string;
}

export interface BookSection {
  num: string;
  title: string;
  /** First page of the section (from the table of contents). */
  page: number;
  /** Numbered items, in book order; empty while the section's pages are unread. */
  items: BookItem[];
}

export interface StationModule {
  mount: (container: HTMLElement) => () => void;
}

export interface Station {
  id: string;
  section: string;
  title: string;
  /** Item numbers (e.g. '1.1.20') the station illustrates, in book order. */
  items: string[];
  /** Equation numbers the station uses, e.g. '(1.1.5)'. */
  equations?: string[];
  summary: string;
}

/** Short label, e.g. "Ex. 1.1.20". */
export function itemLabel(it: BookItem): string {
  const abbr: Record<ItemKind, string> = {
    Definition: 'Def.',
    Proposition: 'Prop.',
    Theorem: 'Thm.',
    Lemma: 'Lemma',
    Corollary: 'Cor.',
    Example: 'Ex.',
    Remark: 'Rem.',
  };
  return `${abbr[it.kind]} ${it.num}`;
}

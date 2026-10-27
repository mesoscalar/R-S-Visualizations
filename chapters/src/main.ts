import './style.css';
import { CHAPTER, SECTIONS, STATIONS, findItem, itemLabel, type Station } from './book/ch1';
import { LOADERS } from './stations';
import { renderMath } from './latex';

const app = document.getElementById('app')!;
let cleanup: (() => void) | null = null;

function teardown(): void {
  if (cleanup) {
    try {
      cleanup();
    } catch (e) {
      console.error('station cleanup failed', e);
    }
    cleanup = null;
  }
  app.textContent = '';
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

function mathEl<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, tex: string): HTMLElementTagNameMap[K] {
  const e = el(tag, className);
  renderMath(e, tex);
  return e;
}

function stationCard(st: Station): HTMLElement {
  const live = st.id in LOADERS;
  const card = el(live ? 'a' : 'div', 'card' + (live ? '' : ' pending'));
  if (live) (card as HTMLAnchorElement).href = `#/${st.id}`;
  const cites = st.items
    .map((n) => findItem(n))
    .filter((it) => it !== undefined)
    .map((it) => itemLabel(it!))
    .join(' · ');
  card.append(
    el('div', 'num', `Station ${st.id}` + (live ? '' : ' — in progress')),
    mathEl('h2', '', st.title),
    mathEl('div', 'subtitle', st.summary),
    el('div', 'cites', cites),
  );
  return card;
}

function renderContents(): void {
  teardown();
  const page = el('div', 'landing');
  page.append(
    el('div', 'kicker', 'Rudolph & Schmidt · Differential Geometry and Mathematical Physics, Part II'),
    el('h1', '', `Chapter ${CHAPTER.num} — ${CHAPTER.title}`),
    el(
      'p',
      'framing',
      'A companion that follows the book in order. Each section lists its numbered items with page ' +
        'references; the stations above them are interactive pictures of specific definitions, results ' +
        'and examples, each backed by a numerically tested math kernel.',
    ),
  );

  for (const s of SECTIONS) {
    const sec = el('section', 'book-section' + (s.items.length ? '' : ' unread'));
    const head = el('h2', 'section-head');
    head.append(el('span', 'secnum', `§${s.num}`), document.createTextNode(` ${s.title}`), el('span', 'page', `p. ${s.page}`));
    sec.appendChild(head);
    if (!s.items.length) {
      sec.appendChild(el('div', 'footnote', 'Not yet covered.'));
      page.appendChild(sec);
      continue;
    }
    const stations = STATIONS.filter((st) => st.section === s.num);
    if (stations.length) {
      const cards = el('div', 'cards');
      stations.forEach((st) => cards.appendChild(stationCard(st)));
      sec.appendChild(cards);
    }
    const spine = el('ol', 'spine');
    for (const it of s.items) {
      const li = el('li');
      const tag = el('span', 'tag', itemLabel(it));
      li.appendChild(tag);
      if (it.title) li.appendChild(el('span', 'ititle', it.title));
      li.appendChild(mathEl('span', 'gist', it.gist));
      li.appendChild(el('span', 'page', `p. ${it.page}`));
      const hits = stations.filter((st) => st.items.includes(it.num));
      for (const st of hits) {
        const chip = el(st.id in LOADERS ? 'a' : 'span', 'chip', st.id);
        if (st.id in LOADERS) (chip as HTMLAnchorElement).href = `#/${st.id}`;
        li.appendChild(chip);
      }
      if (hits.length) li.classList.add('shown');
      spine.appendChild(li);
    }
    sec.appendChild(spine);
    page.appendChild(sec);
  }
  page.appendChild(
    el(
      'p',
      'footnote',
      'Item numbers and pages follow the 2017 Springer edition. Gists are paraphrases; read the book for the statements.',
    ),
  );
  app.appendChild(page);
}

async function renderStation(id: string): Promise<void> {
  const st = STATIONS.find((s) => s.id === id);
  const load = LOADERS[id];
  if (!st || !load) {
    location.hash = '#/';
    return;
  }
  teardown();
  const page = el('div', 'widget-page');
  const header = el('div', 'widget-header');
  const back = el('a', 'back', '← Chapter 1');
  back.href = '#/';
  header.append(back, el('span', 'secnum', `§${st.section} · Station ${st.id}`), mathEl('h1', '', st.title));
  page.appendChild(header);

  const trail = el('div', 'trail');
  for (const num of st.items) {
    const it = findItem(num)!;
    const row = el('div', 'trail-item');
    row.append(el('span', 'tag', itemLabel(it)), el('span', 'page', `p. ${it.page}`), mathEl('span', 'gist', it.gist));
    trail.appendChild(row);
  }
  if (st.equations?.length) trail.appendChild(el('div', 'footnote', `Equations: ${st.equations.join(', ')}`));
  page.appendChild(trail);

  const body = el('div', 'widget-body');
  body.appendChild(el('div', 'loading', 'Loading station…'));
  page.appendChild(body);
  app.appendChild(page);

  try {
    const mod = await load();
    body.textContent = '';
    cleanup = mod.mount(body);
  } catch (e) {
    console.error(e);
    body.textContent = '';
    body.appendChild(el('div', 'error-box', `Failed to load station: ${e instanceof Error ? e.message : String(e)}`));
  }
}

function route(): void {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash) void renderStation(hash);
  else renderContents();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

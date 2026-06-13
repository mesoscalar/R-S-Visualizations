import './style.css';
import { WIDGETS } from './registry';
import { renderMath } from './latex';

const app = document.getElementById('app')!;
let cleanup: (() => void) | null = null;

function teardown(): void {
  if (cleanup) {
    try {
      cleanup();
    } catch (e) {
      console.error('widget cleanup failed', e);
    }
    cleanup = null;
  }
  app.textContent = '';
}

function renderLanding(): void {
  teardown();
  const page = document.createElement('div');
  page.className = 'landing';

  const h1 = document.createElement('h1');
  h1.textContent = 'R&S Vol. 2 — A Visual Companion';
  page.appendChild(h1);

  const framing = document.createElement('p');
  framing.className = 'framing';
  framing.textContent =
    'Interactive widgets for the geometry of Rudolph & Schmidt, Differential Geometry and ' +
    'Mathematical Physics, Part II: fibre bundles, connections, homotopy classification, and ' +
    'characteristic classes. Every picture is backed by a numerically verified math kernel — ' +
    'each card states the theorem it demonstrates.';
  page.appendChild(framing);

  const cards = document.createElement('div');
  cards.className = 'cards';
  for (const w of WIDGETS) {
    const card = document.createElement(w.load ? 'a' : 'div');
    card.className = 'card' + (w.load ? '' : ' pending');
    if (w.load) (card as HTMLAnchorElement).href = `#/${w.id}`;
    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = `Widget ${w.num}` + (w.load ? '' : ' — in progress');
    const title = document.createElement('h2');
    renderMath(title, w.title);
    const sub = document.createElement('div');
    sub.className = 'subtitle';
    renderMath(sub, w.subtitle);
    card.append(num, title, sub);
    cards.appendChild(card);
  }
  page.appendChild(cards);
  app.appendChild(page);
}

async function renderWidget(id: string): Promise<void> {
  const entry = WIDGETS.find((w) => w.id === id);
  if (!entry || !entry.load) {
    location.hash = '#/';
    return;
  }
  teardown();
  const page = document.createElement('div');
  page.className = 'widget-page';

  const header = document.createElement('div');
  header.className = 'widget-header';
  const back = document.createElement('a');
  back.className = 'back';
  back.href = '#/';
  back.textContent = '← Gallery';
  const h1 = document.createElement('h1');
  renderMath(h1, `${entry.num}. ${entry.title}`);
  header.append(back, h1);
  page.appendChild(header);

  const body = document.createElement('div');
  body.className = 'widget-body';
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.textContent = 'Loading widget…';
  body.appendChild(loading);
  page.appendChild(body);
  app.appendChild(page);

  try {
    const mod = await entry.load();
    body.textContent = '';
    cleanup = mod.mount(body);
  } catch (e) {
    console.error(e);
    body.textContent = '';
    const err = document.createElement('div');
    err.className = 'error-box';
    err.textContent = `Failed to load widget: ${e instanceof Error ? e.message : String(e)}`;
    body.appendChild(err);
  }
}

function route(): void {
  const hash = location.hash.replace(/^#\/?/, '');
  if (hash) void renderWidget(hash);
  else renderLanding();
}

window.addEventListener('hashchange', route);
route();

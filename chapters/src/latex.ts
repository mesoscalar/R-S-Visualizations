/**
 * Tiny KaTeX wrapper: renders a string with inline $...$ and display $$...$$
 * segments into a target element. Falls back to raw text if KaTeX throws.
 */
import katex from 'katex';
import 'katex/dist/katex.min.css';

export function renderMath(target: HTMLElement, text: string): void {
  target.textContent = '';
  // Split on $$...$$ first, then $...$ within the remainder.
  const parts = text.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  for (const part of parts) {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const span = document.createElement('span');
      tryRender(part.slice(2, -2), span, true);
      target.appendChild(span);
    } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const span = document.createElement('span');
      tryRender(part.slice(1, -1), span, false);
      target.appendChild(span);
    } else if (part) {
      target.appendChild(document.createTextNode(part));
    }
  }
}

function tryRender(tex: string, el: HTMLElement, displayMode: boolean): void {
  try {
    katex.render(tex, el, { displayMode, throwOnError: true });
  } catch {
    el.textContent = tex;
  }
}

/** A station's explainer: what is on screen, things to try, the idea, where it leads. */
export function explainer(e: {
  see: string;
  tryIt: string[];
  idea: string[];
  ahead?: string;
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'caption explainer';
  const section = (title: string, cls: string): HTMLElement => {
    const sec = document.createElement('section');
    sec.className = cls;
    const h = document.createElement('h3');
    h.textContent = title;
    sec.appendChild(h);
    wrap.appendChild(sec);
    return sec;
  };
  const para = (parent: HTMLElement, text: string): void => {
    const p = document.createElement('p');
    renderMath(p, text);
    parent.appendChild(p);
  };
  para(section('What you are looking at', 'ex-see'), e.see);
  const tryList = document.createElement('ol');
  for (const t of e.tryIt) {
    const li = document.createElement('li');
    renderMath(li, t);
    tryList.appendChild(li);
  }
  section('Try this', 'ex-try').appendChild(tryList);
  const idea = section('What is going on', 'ex-idea');
  for (const t of e.idea) para(idea, t);
  if (e.ahead) para(section('Where this leads', 'ex-ahead'), e.ahead);
  return wrap;
}

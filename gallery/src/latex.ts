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

/** Convenience: a styled caption block with rendered math. */
export function captionBlock(text: string): HTMLElement {
  const div = document.createElement('div');
  div.className = 'caption';
  renderMath(div, text);
  return div;
}

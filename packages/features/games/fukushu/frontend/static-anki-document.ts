/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { cardStyles } from './anki-card-css.js';

const allowed = new Set('p br b strong mark details summary i em u s sub sup ruby rt rp ul ol li span div section article table thead tbody tr th td blockquote pre code hr h1 h2 h3 h4 h5 h6'.split(' '));
const discard = new Set('script style iframe object embed svg math form template noscript audio video img link meta base'.split(' '));
const csp = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src 'none'; media-src 'none'; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

export function staticAnkiDocument(html: string, css: string): string {
	// Template parsing is inert. Recreate permitted nodes; never append source nodes.
	const inlet = window.document.createElement('template');
	inlet.innerHTML = html;
	const out = window.document.createElement('div');

	function copy(from: Node, to: Node, depth: number) {
		if (depth > 128) return;
		if (from.nodeType === Node.TEXT_NODE) {
			to.appendChild(window.document.createTextNode(from.textContent ?? ''));
			return;
		}
		if (!(from instanceof Element) || from.namespaceURI !== 'http://www.w3.org/1999/xhtml' || discard.has(from.localName)) return;
		let target = to;
		if (allowed.has(from.localName)) {
			const next = window.document.createElement(from.localName);
			for (const name of ['class', 'id']) {
				const value = from.getAttribute(name);
				if (value && value.length <= 256 && /^[\w\s-]+$/.test(value)) next.setAttribute(name, value);
			}
			if (from.localName === 'td' || from.localName === 'th') {
				for (const name of ['colspan', 'rowspan']) {
					const value = from.getAttribute(name);
					if (value && /^(?:[1-9]|[12][0-9]|3[0-2])$/.test(value)) next.setAttribute(name, value);
				}
			}
			to.appendChild(next);
			target = next;
		}
		for (const node of from.childNodes) copy(node, target, depth + 1);
	}

	for (const node of inlet.content.childNodes) copy(node, out, 0);
	return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>body{overflow-wrap:anywhere;margin:.4rem;color:CanvasText;background:Canvas;color-scheme:light dark}${cardStyles(css)}</style></head><body class="card">${out.innerHTML}</body></html>`;
}

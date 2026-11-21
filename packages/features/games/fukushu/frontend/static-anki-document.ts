/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ankiMediaUriPattern } from '../shared/anki-media.schema.js';
import { cardStyles } from './anki-card-css.js';

const allowed = new Set('p br b strong mark details summary i em u s sub sup ruby rt rp ul ol li span div section article table thead tbody tr th td blockquote pre code hr h1 h2 h3 h4 h5 h6'.split(' '));
const discard = new Set('script style iframe object embed svg math form template noscript audio video img link meta base'.split(' '));
const csp = "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; media-src 'none'; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

export function staticAnkiDocument(
	html: string,
	css: string,
	media?: { image?: { id: string; url: string }; imageLabel: string; audioLabel: string },
) {
	// Template parsing is inert. Recreate permitted nodes; never append source nodes.
	const inlet = window.document.createElement('template');
	inlet.innerHTML = html;
	const inert = inlet.content.ownerDocument;
	const out = inert.createElement('div');
	let imageId: string | undefined;
	let audioId: string | undefined;
	let embeddedImage = false;

	function copy(from: Node, to: Node, depth: number) {
		if (depth > 128) return;
		if (from.nodeType === Node.TEXT_NODE) {
			to.appendChild(inert.createTextNode(from.textContent ?? ''));
			return;
		}
		if (!(from instanceof Element) || from.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
		if (media && (from.localName === 'img' || from.localName === 'audio')) {
			const id = ankiMediaUriPattern.exec(from.getAttribute('src') ?? '')?.[1];
			if (!id) return;
			if (from.localName === 'img') {
				if (imageId && imageId !== id) return;
				imageId = id;
				const alt = from.getAttribute('alt')?.slice(0, 256) ?? '';
				if (!embeddedImage && media.image?.id === id && /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(media.image.url)) {
					const img = inert.createElement('img');
					img.alt = alt;
					img.src = media.image.url;
					to.appendChild(img);
					embeddedImage = true;
				} else {
					to.appendChild(inert.createTextNode(alt || media.imageLabel));
				}
			} else {
				if (audioId && audioId !== id) return;
				audioId = id;
				to.appendChild(inert.createTextNode(media.audioLabel));
			}
			return;
		}
		if (discard.has(from.localName)) return;
		let target = to;
		if (allowed.has(from.localName)) {
			const next = inert.createElement(from.localName);
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
	const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}; img-src ${embeddedImage ? 'data:' : "'none'"}"><style>body{overflow-wrap:anywhere;margin:.4rem;color:CanvasText;background:Canvas;color-scheme:light dark}img{max-inline-size:100%;height:auto}${cardStyles(css)}</style></head><body class="card">${out.innerHTML}</body></html>`;
	return { documentHtml, imageId, audioId };
}

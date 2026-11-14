/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import sanitizeHtml from 'sanitize-html';

/** Assign to iframe.srcdoc, with sandbox="" (never allow-same-origin/scripts). */
export const MAIL_IFRAME_SANDBOX = '';
export const MAIL_HTML_CSP = 'default-src \'none\'; script-src \'none\'; style-src \'none\'; img-src \'none\'; font-src \'none\'; connect-src \'none\'; media-src \'none\'; object-src \'none\'; frame-src \'none\'; base-uri \'none\'; form-action \'none\'';

/**
 * Conservative first version: no remote resources, CSS, clickable links or CID
 * images. CID must later be supplied by an owner-authorized resource path, never
 * fetched from sender URLs. Text/formatting survive even without image support.
 */
export function createMailHtmlDocument(html: string): string {
	const body = sanitizeHtml(html, {
		allowedTags: ['p', 'br', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
		allowedAttributes: {},
		allowedSchemes: [],
		allowProtocolRelative: false,
		disallowedTagsMode: 'discard',
		// Drop active/foreign subtrees, not just their outer tag.
		nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'noscript'],
	});
	return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${MAIL_HTML_CSP}"><meta name="referrer" content="no-referrer"></head><body>${body}</body></html>`;
}

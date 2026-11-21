/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Defense in depth for both received mail and compose previews. Also requires sandbox="". */
export function isolatedMailDocument(html: string, mode: 'received' | 'preview' = 'received'): string {
	// This policy precedes all untrusted markup. Later CSP meta tags cannot relax it.
	// Only our server-generated compose preview may retain inline MFM CSS.
	// Inline styles cannot fetch resources: all resource directives remain none.
	const styleSource = mode === 'preview' ? '\'unsafe-inline\'' : '\'none\'';
	const csp = `default-src \'none\'; script-src \'none\'; style-src ${styleSource}; img-src \'none\'; font-src \'none\'; connect-src \'none\'; media-src \'none\'; object-src \'none\'; frame-src \'none\'; base-uri \'none\'; form-action \'none\'`;
	return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"></head><body>${html}</body></html>`;
}

/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Only presentation rules for the scriptless card document. Let the browser parse
// declarations; reconstruct selected values instead of inserting source CSS.
const properties = ['color', 'background-color', 'font-weight', 'font-size', 'font-style', 'text-align', 'white-space'];
const simpleSelector = /^(?:[a-z][a-z0-9-]*|[.#][a-z_][\w-]*)(?:[.#][a-z_][\w-]*)*$/i;

export function cardStyles(css: string): string {
	if (!css || css.length > 64 * 1024 || typeof CSSStyleSheet === 'undefined' || !CSSStyleSheet.prototype.replaceSync) return '';
	const sheet = new CSSStyleSheet();
	sheet.replaceSync(css);
	const rules: string[] = [];
	for (const rule of sheet.cssRules) {
		if (!(rule instanceof CSSStyleRule) || rule.selectorText.length > 256) continue;
		const selectors = rule.selectorText.split(',').map(part => part.trim());
		if (!selectors.every(selector => selector.split(/\s+/).every(part => simpleSelector.test(part)))) continue;
		const declarations: string[] = [];
		for (const name of properties) {
			const value = rule.style.getPropertyValue(name).trim();
			if (!value || value.length > 128) continue;
			// Keep literal keywords, lengths and colors. No source functions except
			// ordinary color functions with literal numeric arguments.
			if (!/^[\w#.%-]+(?: [\w.%-]+)*$/.test(value) && !/^(rgb|hsl)a?\([\d\s.,%/+\-]+\)$/i.test(value)) continue;
			if (name === 'font-size' && !/^\d*\.?\d+(?:px|pt|em|rem|%)$/i.test(value)) continue;
			declarations.push(name + ':' + (name === 'font-size' ? 'clamp(.5rem,' + value + ',4rem)' : value));
		}
		if (declarations.length) rules.push(selectors.join(',') + '{' + declarations.join(';') + '}');
	}
	return rules.join('\n');
}

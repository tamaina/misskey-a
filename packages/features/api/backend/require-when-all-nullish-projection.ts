/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getRequireWhenAllNullishRegistration } from '../contract/require-when-all-nullish.js';

/** Check every public occurrence before deduplicating shared schema nodes. */
export function assertRequireWhenAllNullishPlacement(schema: object): void {
	const seen = new Set<object>();

	function visit(value: unknown, preceding?: object): void {
		if (value === null || typeof value !== 'object') return;
		const registration = getRequireWhenAllNullishRegistration(value);
		if (registration !== undefined && preceding !== registration.base) {
			throw new Error('Nullish conditional validation must immediately follow its original JSON-object base');
		}
		if (seen.has(value)) return;
		seen.add(value);
		if (Array.isArray(value)) { for (const item of value) visit(item); return; }
		if ('pipe' in value && Array.isArray(value.pipe)) {
			for (const [index, item] of value.pipe.entries()) {
				const previous = value.pipe[index - 1];
				visit(item, previous !== null && typeof previous === 'object' ? previous : undefined);
			}
		}
		for (const [key, child] of Object.entries(value)) {
			if (['wrapped', 'item', 'items', 'key', 'value', 'rest', 'options'].includes(key)) visit(child);
		}
		if ('entries' in value && value.entries !== null && typeof value.entries === 'object') {
			for (const entry of Object.values(value.entries)) visit(entry);
		}
	}

	visit(schema);
}

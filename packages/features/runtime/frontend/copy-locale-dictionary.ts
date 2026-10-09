/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Preserve ordinary dictionary lookup/fallback semantics around VVI's missing-key proxy. */
export function copyLocaleDictionary<T extends object>(dictionary: T): T {
	// Entries copy exactly the typed own keys and values into an ordinary object.
	return Object.fromEntries(Object.entries(dictionary)) as T;
}

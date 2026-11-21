/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Query cleanup remounts RouterView. Keep the code only through that render,
// scoped to its own page/window router, never in persistent browser storage.
const pending = new WeakMap<object, string>();

export function keepForwardingCode(router: object, code: string): void {
	pending.set(router, code);
}

export function takeForwardingCode(router: object): string {
	const code = pending.get(router) ?? '';
	pending.delete(router);
	return code;
}

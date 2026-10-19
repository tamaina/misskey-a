/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '../../api/backend/transport/orpc-error.js';
/** Undefined is legacy unbounded; malformed or elapsed stored dates deny access. */
export function accessTokenExpired(token: { expiresAt?: Date | string | null }, now = Date.now()): boolean {
	if (token.expiresAt == null) return false;
	const expires = token.expiresAt instanceof Date ? token.expiresAt.getTime() : Date.parse(token.expiresAt);
	return !Number.isFinite(expires) || expires <= now;
}
export function selectedTokenExpiry(value?: string | null, now = Date.now()): Date | null {
	if (value == null) return null;
	const expires = new Date(value);
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(expires.getTime()) || expires.getTime() <= now) throw apiError({ code: 'INVALID_PARAM', status: 400, message: 'Select a future token expiry.', id: '1d0c8ad0-78bd-44a7-a845-45d144ff2fd0' });
	return expires;
}
/** Long explicit expiries are chunked, never coerced to Node's 1ms overflow timer. */
export function scheduleTokenExpiry(token: { expiresAt?: Date | string | null }, expire: () => void): () => void {
	let timer: ReturnType<typeof setTimeout> | undefined; let canceled = false;
	const check = () => {
		if (canceled || token.expiresAt == null) return;
		if (accessTokenExpired(token)) { expire(); return; }
		const at = token.expiresAt instanceof Date ? token.expiresAt.getTime() : Date.parse(token.expiresAt);
		timer = setTimeout(check, Math.min(at - Date.now(), 2_147_483_647)); timer.unref?.();
	};
	check(); return () => { canceled = true; if (timer) clearTimeout(timer); };
}

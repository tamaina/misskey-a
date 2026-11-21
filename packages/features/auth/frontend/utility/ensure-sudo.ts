/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineAsyncComponent } from 'vue';
import { popup } from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '../i.js';
import { isSameLiveCredential } from './live-account.js';

/** The server owns expiry. No client cache or successful dialog can authorize a write. */
export async function ensureSudo(isCurrent: () => boolean = () => true, signal?: AbortSignal): Promise<boolean> {
	const owner = ensureSignin();
	const userId = owner.id; const token = owner.token;
	const current = () => !signal?.aborted && isCurrent() && isSameLiveCredential(userId, token, ensureSignin().id, ensureSignin().token);
	if (!current()) return false;
	const status = await misskeyApi('i/sudo/status', {});
	if (!current()) return false;
	if (status.active) return true;
	return await new Promise<boolean>(resolve => {
		let settled = false;
		const finish = (value: boolean) => {
			if (settled) return;
			settled = true;
			signal?.removeEventListener('abort', onAbort);
			resolve(value && current());
			dispose();
		};
		const onAbort = () => finish(false);
		const { dispose } = popup(defineAsyncComponent(() => import('../components/MkSudoDialog.vue')), { isCurrent: current }, {
			done: value => finish(value),
			closed: () => finish(false),
		});
		signal?.addEventListener('abort', onAbort, { once: true });
		if (signal?.aborted) onAbort();
	});
}

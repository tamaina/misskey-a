/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineAsyncComponent } from 'vue';
import { popup } from '@features/ui/frontend/os.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { ensureSignin } from '../i.js';

/** The server owns expiry. No client cache or successful dialog can authorize a write. */
export async function ensureSudo(isCurrent: () => boolean = () => true, signal?: AbortSignal): Promise<boolean> {
	const owner = ensureSignin();
	const userId = owner.id; const token = owner.token;
	const current = () => !signal?.aborted && isCurrent() && ensureSignin().id === userId && ensureSignin().token === token;
	if (!current()) return false;
	if (token.startsWith('bs_')) {
		const status = await misskeyApi('i/sudo/status', {});
		if (!current()) return false;
		if (status.active) return true;
	}
	const confirmed = await new Promise<boolean>(resolve => {
		const aborted = () => { resolve(false); dispose(); };
		const { dispose } = popup(defineAsyncComponent(() => import('../components/MkSudoDialog.vue')), { isCurrent: current }, {
			done: value => { signal?.removeEventListener('abort', aborted); resolve(value); },
			closed: () => { signal?.removeEventListener('abort', aborted); resolve(false); dispose(); },
		});
		signal?.addEventListener('abort', aborted, { once: true });
		if (signal?.aborted) aborted();
	});
	return confirmed && current();
}

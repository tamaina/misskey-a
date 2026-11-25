/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { $i } from '../i.js';
import { isSameLiveCredential } from './live-account.js';
/** Each consent belongs to the actor and screen that began it, including popup waits. */
export function useCredentialOperation(clear: () => void = () => {}) {
	const busy = ref(false); let active = true; let generation = 0; let controller: AbortController | undefined;
	const cancel = () => { generation++; controller?.abort(); controller = undefined; busy.value = false; clear(); };
	onActivated(() => { active = true; }); onDeactivated(() => { active = false; cancel(); }); onUnmounted(() => { active = false; cancel(); });
	watch(() => [$i?.id, $i?.token] as const, ([id, token], previous) => {
		const [prevId, prevToken] = previous ?? [id, token];
		if (id !== prevId || (token !== prevToken && !isSameLiveCredential(prevId ?? '', prevToken ?? '', id, token))) cancel();
	}, { flush: 'sync' });

	async function run(action: (current: () => boolean, signal: AbortSignal) => Promise<void>): Promise<void> {
		if (!active || busy.value) return;
		const owner = ++generation; const ownerId = $i?.id ?? ''; const ownerToken = $i?.token ?? '';
		const ownController = new AbortController(); controller = ownController; busy.value = true;
		const current = () => active && generation === owner && isSameLiveCredential(ownerId, ownerToken, $i?.id, $i?.token) && !ownController.signal.aborted;
		try { await action(current, ownController.signal); } finally { if (controller === ownController) controller = undefined; if (generation === owner) busy.value = false; }
	}

	return { busy, run };
}
export function selectedCredentialExpiry(value: string | null): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error('Select a future expiry');
	return date.toISOString();
}

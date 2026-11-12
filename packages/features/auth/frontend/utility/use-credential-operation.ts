/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { onActivated, onDeactivated, onUnmounted, ref, watch } from 'vue';
import { $i } from '../i.js';
/** Each consent belongs to the actor and screen that began it, including popup waits. */
export function useCredentialOperation(clear: () => void = () => {}) {
	const busy = ref(false); let active = true; let generation = 0; let controller: AbortController | undefined;
	const actor = () => JSON.stringify([$i?.id ?? null, $i?.token ?? null]);
	const cancel = () => { generation++; controller?.abort(); controller = undefined; busy.value = false; clear(); };
	onActivated(() => { active = true; }); onDeactivated(() => { active = false; cancel(); }); onUnmounted(() => { active = false; cancel(); });
	watch(actor, cancel, { flush: 'sync' });

	async function run(action: (current: () => boolean, signal: AbortSignal) => Promise<void>): Promise<void> {
		if (!active || busy.value) return;
		const owner = ++generation; const ownerActor = actor(); const ownController = new AbortController(); controller = ownController; busy.value = true;
		const current = () => active && generation === owner && actor() === ownerActor && !ownController.signal.aborted;
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

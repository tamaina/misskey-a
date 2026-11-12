/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineAsyncComponent } from 'vue';
import { popup } from '@features/ui/frontend/os.js';
import MkDialog from '@features/ui/frontend/components/MkDialog.vue';
import type { MkDialogReturnType } from '@features/ui/frontend/components/MkDialog.vue';

/** A security operation owns its popup; leaving or changing actor destroys it. */
function owned<T>(signal: AbortSignal | undefined, open: (finish: (value: MkDialogReturnType<T>) => void) => { dispose: () => void }): Promise<MkDialogReturnType<T>> {
	if (signal?.aborted) return Promise.resolve({ canceled: true, result: undefined });
	return new Promise(resolve => {
		let settled = false;
		let dispose = () => {};
		const abort = () => finish({ canceled: true, result: undefined });
		const finish = (value: MkDialogReturnType<T>) => {
			if (settled) return;
			settled = true; signal?.removeEventListener('abort', abort);
			resolve(signal?.aborted ? { canceled: true, result: undefined } : value); dispose();
		};
		dispose = open(finish).dispose;
		if (settled) { dispose(); return; }
		signal?.addEventListener('abort', abort, { once: true });
		if (signal?.aborted) abort();
	});
}

export function ownedInputText(props: {
	type?: 'text' | 'email' | 'password' | 'url'; title?: string; text?: string; placeholder?: string | null;
	autocomplete?: string; default?: string | null; minLength?: number; maxLength?: number;
}, signal?: AbortSignal): Promise<MkDialogReturnType<string | null>> {
	return owned(signal, finish => popup(MkDialog, {
		title: props.title, text: props.text,
		input: { type: props.type, placeholder: props.placeholder, autocomplete: props.autocomplete, default: props.default ?? null, minLength: props.minLength, maxLength: props.maxLength },
	}, { done: value => finish(value as MkDialogReturnType<string | null>), closed: () => finish({ canceled: true, result: undefined }) }));
}
export function ownedAuthenticateDialog(props: { currentPassword?: string } = {}, signal?: AbortSignal): Promise<MkDialogReturnType<{ password: string; token: string | null }>> {
	return owned(signal, finish => popup(defineAsyncComponent(() => import('../components/MkPasswordDialog.vue')), props, {
		done: value => finish(value ? { canceled: false, result: value } : { canceled: true, result: undefined }),
		cancelled: () => finish({ canceled: true, result: undefined }), closed: () => finish({ canceled: true, result: undefined }),
	}));
}

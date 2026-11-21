/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { popup } from '@features/ui/frontend/os.js';
import type { MkDialogReturnType } from '@features/ui/frontend/components/MkDialog.vue';

export type SignoutChoice = MkDialogReturnType<'retry' | 'local' | null>;

export function signoutChoice(props: { legacy: boolean }): Promise<SignoutChoice> {
	return new Promise(resolve => {
		const { dispose } = popup(defineAsyncComponent(() => import('@features/auth/frontend/components/MkSignoutChoice.vue')), props, {
			done: (result: SignoutChoice) => resolve(result),
			closed: () => {
				resolve({ canceled: true, result: undefined });
				dispose();
			},
		});
	});
}

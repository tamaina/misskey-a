/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import MkModal from '../../frontend/components/MkModal.vue';

vi.mock('@features/ui/frontend/os.js', () => ({ claimZIndex: () => 1000 }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: { s: { menuStyle: 'popup', animation: false } } }));
vi.mock('@features/ui/frontend/utility/touch.js', () => ({ isTouchUsing: false }));
vi.mock('@features/ui/frontend/utility/device-kind.js', () => ({ deviceKind: 'desktop' }));

test.each(['abort', 'unmount'])('real modal releases page inert before forced %s detaches its root', async mode => {
	const page = window.document.createElement('button');
	const host = window.document.createElement('div');
	window.document.body.append(page, host);
	const app = createApp({ render: () => h(MkModal, { manualShowing: true, preferType: 'dialog' }, () => h('button', 'Modal action')) });
	app.directive('hotkey', {});
	app.mount(host);
	await nextTick();
	try {
		expect(page.inert).toBe(true);
		if (mode === 'abort') {
			const controller = new AbortController();
			controller.signal.addEventListener('abort', () => app.unmount(), { once: true });
			controller.abort();
		} else app.unmount();
		expect(host.childElementCount).toBe(0);
		expect(page.inert).toBe(false);
	} finally { app.unmount(); page.remove(); host.remove(); }
});

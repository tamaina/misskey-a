/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import './setup.js';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { createApp, nextTick } from 'vue';
import { test, expect, vi } from 'vitest';
import * as os from '@features/ui/frontend/os.js';
import ResidenceSettings from '../../frontend/ResidenceSettings.vue';

async function flush() { for (let i = 0; i < 10; i++) { await Promise.resolve(); await nextTick(); } }

test('residence starts empty and saves only an explicit country plus its configured required subdivision', async () => {
	const client = { getPeerReceiptSettings: vi.fn(async () => ({ revision: 0, acceptForeignPayments: false })), setPeerReceiptSettings: vi.fn(async input => ({ ...input, revision: input.revision + 1 })), getResidence: vi.fn(async () => ({ residence: null, isReady: false, requiredSubdivisions: ['JP'] })), setResidence: vi.fn(async input => ({ ...input.residence, revision: 1, declaredAt: 1000, kind: 'self_declared' as const })) };
	const app = createApp(ResidenceSettings, { client }), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	try {
		await flush(); expect(client.getResidence).toHaveBeenCalledExactlyOnceWith({}); expect(client.setResidence).not.toHaveBeenCalled(); const submit = () => element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		expect(element.textContent).toContain('自己申告'); expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		const choose = async (index: number, label: string) => { element.querySelectorAll('div[tabindex="0"]')[index].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0].find(item => typeof item === 'object' && item !== null && 'text' in item && item.text === label); if (!option || typeof option !== 'object' || !('action' in option) || typeof option.action !== 'function') throw new Error('Option unavailable'); option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush(); };
		await choose(0, 'JP / 日本'); expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		await choose(1, 'JP-13'); expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
		submit(); await flush(); expect(client.setResidence).toHaveBeenCalledExactlyOnceWith({ revision: 0, residence: { country: 'JP', subdivision: 'JP-13' } });
		await choose(0, 'US / アメリカ合衆国'); submit(); await flush(); expect(client.setResidence).toHaveBeenLastCalledWith({ revision: 1, residence: { country: 'US', subdivision: null } });
	} finally { app.unmount(); element.remove(); }
});

test('overseas receipt defaults OFF, persists explicit opt-in separately and retains revision on failed save', async () => {
	const client = {
		getResidence: vi.fn(async () => ({ residence: null, isReady: false, requiredSubdivisions: [] })), setResidence: vi.fn(),
		getPeerReceiptSettings: vi.fn(async () => ({ revision: 0, acceptForeignPayments: false })),
		setPeerReceiptSettings: vi.fn().mockRejectedValueOnce(new Error('Conflict')).mockResolvedValueOnce({ revision: 1, acceptForeignPayments: true }),
	};
	const app = createApp(ResidenceSettings, { client }), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	try {
		await flush(); const form = element.querySelectorAll('form')[1], checkbox = form.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
		expect(checkbox.checked).toBe(false); expect(element.textContent).toContain('サーバーが許可する国');
		checkbox.click(); await flush();
		const submit = () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		submit(); await flush(); expect(element.querySelector('[role="alert"]')).not.toBeNull();
		submit(); await flush(); expect(client.setPeerReceiptSettings).toHaveBeenNthCalledWith(1, { revision: 0, acceptForeignPayments: true });
		expect(client.setPeerReceiptSettings).toHaveBeenNthCalledWith(2, { revision: 0, acceptForeignPayments: true });
		expect(client.setResidence).not.toHaveBeenCalled(); expect(element.textContent).toContain('受取設定を保存しました');
	} finally { app.unmount(); element.remove(); }
});

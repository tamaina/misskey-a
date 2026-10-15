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
	const client = { getResidence: vi.fn(async () => ({ residence: null, isReady: false, requiredSubdivisions: ['JP'] })), setResidence: vi.fn(async input => ({ ...input.residence, revision: 1, declaredAt: 1000, kind: 'self_declared' as const })) };
	const app = createApp(ResidenceSettings, { client }), i18n = createInternationalization({ initialLocale: 'ja-JP' }); await i18n.ready; app.use(i18n);
	const element = window.document.createElement('div'); window.document.body.append(element); app.mount(element);
	try {
		await flush(); const submit = () => element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		expect(element.textContent).toContain('自己申告'); expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		const choose = async (index: number, label: string) => { element.querySelectorAll('div[tabindex="0"]')[index].dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); const call = vi.mocked(os.popupMenu).mock.calls.at(-1)!; const option = call[0].find(item => typeof item === 'object' && item !== null && 'text' in item && item.text === label); if (!option || typeof option !== 'object' || !('action' in option) || typeof option.action !== 'function') throw new Error('Option unavailable'); option.action(new PointerEvent('click')); call[2]?.onClosing?.(); await flush(); };
		await choose(0, 'JP'); expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
		await choose(1, 'JP-13'); expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
		submit(); await flush(); expect(client.setResidence).toHaveBeenCalledExactlyOnceWith({ revision: 0, residence: { country: 'JP', subdivision: 'JP-13' } });
		await choose(0, 'US'); submit(); await flush(); expect(client.setResidence).toHaveBeenLastCalledWith({ revision: 1, residence: { country: 'US', subdivision: null } });
	} finally { app.unmount(); element.remove(); }
});

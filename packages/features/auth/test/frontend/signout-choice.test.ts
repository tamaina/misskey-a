/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import SignoutChoice from '../../frontend/components/MkSignoutChoice.vue';
import { signoutChoice } from '../../frontend/signout-choice.js';

const mocks = vi.hoisted(() => ({ popup: vi.fn(), dispose: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ popup: mocks.popup }));
vi.mock('@features/ui/frontend/components/MkDialog.vue', () => ({ default: defineComponent({
	props: ['title', 'text', 'select'], emits: ['done', 'closed'],
	setup: (props, { emit }) => () => h('section', [
		h('h1', props.title), h('p', props.text),
		...props.select.items.map((item: { label: string; value: 'retry' | 'local' }) => h('button', { onClick: () => emit('done', { canceled: false, result: item.value }) }, item.label)),
		h('button', { onClick: () => emit('done', { canceled: false, result: null }) }, 'No selection'),
	]),
}) }));

const internationalization = createInternationalization({ initialLocale: 'ja-JP' });
let app: ReturnType<typeof createApp> | undefined;
let element: HTMLDivElement | undefined;

beforeAll(async () => {
	await internationalization.ready;
	await internationalization.loadLocale('ja-JP');
});

afterEach(() => {
	app?.unmount();
	element?.remove();
	app = undefined;
	element = undefined;
	vi.clearAllMocks();
});

function mount(legacy: boolean) {
	const done = vi.fn();
	element = window.document.createElement('div');
	window.document.body.append(element);
	app = createApp(SignoutChoice, { legacy, onDone: done });
	app.use(internationalization);
	app.mount(element);
	return { element, done };
}

describe('VVI-owned signout choice', () => {
	test('renders primary Japanese legacy warning and local-only label without legacy global labels', () => {
		const { element } = mount(true);
		expect(element.querySelector('h1')?.textContent).toBe('ログアウト');
		expect(element.querySelector('p')?.textContent).toContain('サーバー側の認証情報は引き続き有効');
		expect(Array.from(element.querySelectorAll('button'), button => button.textContent)).toEqual(['この端末だけからログアウト', 'No selection']);
	});

	test('renders network warning and retry/local choices from the actual SFC locale', () => {
		const { element } = mount(false);
		expect(element.querySelector('p')?.textContent).toContain('サーバー側での無効化は確認できません');
		expect(Array.from(element.querySelectorAll('button'), button => button.textContent)).toEqual(['再試行', 'この端末だけからログアウト', 'No selection']);
	});

	test('no selection cancels instead of authorizing local-only cleanup', () => {
		const { element, done } = mount(false);
		(element.querySelectorAll('button')[2] as HTMLButtonElement).click();
		expect(done).toHaveBeenCalledWith({ canceled: true, result: undefined });
	});

	test.each(['retry', 'local'])('helper keeps completed %s choice after a delayed closed event', async result => {
		mocks.popup.mockReturnValue({ dispose: mocks.dispose });
		const choice = signoutChoice({ legacy: false });
		const events = mocks.popup.mock.calls[0][2];
		events.done({ canceled: false, result });
		events.closed();
		expect(await choice).toEqual({ canceled: false, result });
		expect(mocks.dispose).toHaveBeenCalledOnce();
	});

	test('helper settles on closed with no prior choice and disposes the popup', async () => {
		mocks.popup.mockReturnValue({ dispose: mocks.dispose });
		const choice = signoutChoice({ legacy: true });
		mocks.popup.mock.calls[0][2].closed();
		expect(await choice).toEqual({ canceled: true, result: undefined });
		expect(mocks.dispose).toHaveBeenCalledOnce();
	});
});

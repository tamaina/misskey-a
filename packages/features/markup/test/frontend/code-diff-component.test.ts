/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import modlogSource from '../../../moderation/frontend/pages/admin/modlog.ModLog.vue?raw';
import { createApp, h, Suspense, ref, reactive, nextTick } from 'vue';
import { beforeEach, expect, test, vi } from 'vitest';
import { createHighlighter } from 'shiki';
import MkCodeDiff from '../../frontend/components/MkCodeDiff.vue';

const { copy, preferences } = vi.hoisted(() => ({ copy: vi.fn(), preferences: { s: { dataSaver: { code: false } } } }));
vi.mock('@features/ui/frontend/utility/copy-to-clipboard.js', () => ({ copyToClipboard: copy }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: preferences }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: { r: { darkMode: ref(false) } } }));
vi.mock('@features/markup/frontend/utility/code-highlighter.js', () => ({
	getHighlighter: () => createHighlighter({ themes: ['dark-plus', 'light-plus'], langs: ['javascript'] }),
	getTheme: (mode: string) => Promise.resolve(mode === 'light' ? 'light-plus' : 'dark-plus'),
}));

beforeEach(() => { preferences.s.dataSaver.code = false; copy.mockReset(); });

async function showDiff(input: Record<string, unknown>) {
	const props = reactive(input);
	const element = document.createElement('div');
	const app = createApp({ render: () => h(Suspense, null, { default: () => h(MkCodeDiff, props) }) });
	app.config.globalProperties.$locale = { sfc: { code: 'Code', clickToShow: 'Show' } };
	app.mount(element);
	if (input.forceShow || !preferences.s.dataSaver.code) await vi.waitFor(() => expect(element.querySelector('.shiki')).not.toBeNull());
	return { element, props, unmount: () => app.unmount() };
}

for (const type of ['updateUserNote', 'updateRemoteInstanceNote', 'updateAbuseReportNote', 'updateProxyAccountDescription']) {
	test(`keeps both sides of ${type} without a language`, async () => {
		const wrapper = await showDiff({ diffBase: `before_${type}`, code: `after_${type}`, forceShow: true });
		expect(wrapper.element.textContent).toContain(`before_${type}`);
		expect(wrapper.element.textContent).toContain(`after_${type}`);
		expect(Array.from(wrapper.element.querySelectorAll('.diff-sign'), node => node.textContent)).toEqual(['-', '+']);
		wrapper.unmount();
	});
}

test('copies the original target, including literal notation', async () => {
	const code = 'new // [!code ++]';
	const wrapper = await showDiff({ diffBase: 'old', code, forceShow: true });
	wrapper.element.querySelector<HTMLButtonElement>('button')!.click();
	await nextTick();
	expect(copy).toHaveBeenCalledWith(code);
	wrapper.unmount();
});

test('honors data saver unless forceShow is set', async () => {
	preferences.s.dataSaver.code = true;
	const hidden = await showDiff({ diffBase: 'old', code: 'new' });
	expect(!!hidden.element.querySelector('.shiki')).toBe(false);
	hidden.element.querySelector<HTMLButtonElement>('button:not(._button)')!.click();
	await vi.waitFor(() => expect(hidden.element.querySelector('.shiki')).not.toBeNull());
	expect(hidden.element.textContent).toContain('old');
	hidden.unmount();
	const forced = await showDiff({ diffBase: 'old', code: 'new', forceShow: true });
	expect(forced.element.textContent).toContain('old');
	forced.unmount();
});

test('updates the baseline, target and language and accepts maxHeight zero', async () => {
	const wrapper = await showDiff({ diffBase: 'old', code: 'new', lang: 'javascript', forceShow: true, maxHeight: 0 });
	expect(wrapper.element.querySelector<HTMLElement>('[style]')!.style.maxHeight).toBe('0px');
	Object.assign(wrapper.props, { diffBase: '<before>', code: '<after>', lang: undefined });
	await nextTick();
	expect(wrapper.element.textContent).toContain('<before>');
	expect(wrapper.element.textContent).toContain('<after>');
	expect(wrapper.element.innerHTML).not.toContain('<before>');
	wrapper.unmount();
});

test('all thirteen moderation diff viewers bypass data saver and retain wrappers', () => {
	const source = modlogSource;
	expect(source.match(/<MkCodeDiff forceShow /g)).toHaveLength(13);
	expect(source.match(/<div :class="\$style.diff">/g)).toHaveLength(13);
});

test('reacts to the selected dark or light theme', async () => {
	const { store } = await import('@features/preferences/frontend/store.js');
	store.r.darkMode.value = false;
	const wrapper = await showDiff({ diffBase: 'old', code: 'new', forceShow: true });
	const before = wrapper.element.innerHTML;
	store.r.darkMode.value = true;
	await nextTick();
	expect(wrapper.element.innerHTML).not.toBe(before);
	expect(wrapper.element.textContent).toContain('old');
	store.r.darkMode.value = false;
	wrapper.unmount();
});

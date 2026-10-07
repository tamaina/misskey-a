/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { cleanup, fireEvent, render } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { locales } from 'i18n';
import ThemeInstall from '@features/preferences/frontend/pages/settings/theme.install.vue';
import ThemeEditor from '@features/preferences/frontend/pages/theme-editor.vue';
import { interpolateLocaleParameters } from '@features/runtime/frontend/interpolate-locale-parameters.js';

const effects = vi.hoisted(() => ({
	alert: vi.fn(), install: vi.fn(), add: vi.fn(), error: vi.fn(), preview: vi.fn(), update: vi.fn(), push: vi.fn(), input: vi.fn(), commit: vi.fn(),
}));
vi.mock('@features/preferences/frontend/theme.js', () => ({
	installTheme: effects.install, addTheme: effects.add, handleThemeInstallError: effects.error,
	themeManager: { previewTheme: effects.preview, updateTheme: effects.update },
}));
vi.mock('@features/ui/frontend/os.js', () => ({ alert: effects.alert, inputText: effects.input, pageWindow: vi.fn() }));
vi.mock('@features/navigation/frontend/router.js', () => ({ useRouter: () => ({ push: effects.push }) }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/navigation/frontend/composables/use-leave-guard.js', () => ({ useLeaveGuard: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => ({ username: 'fixture' }) }));
vi.mock('@features/preferences/frontend/store.js', () => ({ store: { s: { darkMode: false } } }));
vi.mock('@features/preferences/frontend/preferences.js', () => ({ prefer: { commit: effects.commit } }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ host: 'fixture.invalid' }));
vi.mock('@features/runtime/frontend/utility/id.js', () => ({ genId: () => 'fixture-id' }));
vi.mock('@features/markup/frontend/components/MkCodeEditor.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit, slots }) => () => h('label', [slots.label?.(), h('textarea', { 'aria-label': 'theme code', value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value) })]) }) };
});
vi.mock('@features/ui/frontend/components/MkButton.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['disabled'], setup: (props, { slots }) => () => h('button', { disabled: props.disabled }, slots.default?.()) }) };
});
vi.mock('@features/ui/frontend/components/MkFolder.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_, { slots }) => () => h('section', [slots.label?.(), slots.default?.()]) }) };
});
vi.mock('@features/ui/frontend/components/MkTextarea.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue'], setup: (props, { emit }) => () => h('textarea', { 'aria-label': 'description', value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value) }) }) };
});

const Header = defineComponent({
	props: ['actions'],
	setup: (props, { slots }) => () => h('main', [
		...(props.actions as { text: string; handler: () => void }[]).map(action => h('button', { onClick: action.handler }, action.text)),
		slots.default?.(),
	]),
});

async function activate(language: string) {
	const runtime = createInternationalization({ initialLocale: language });
	await runtime.ready;
	await runtime.loadLocale(language);
	runtime.install(createApp({}));
	return runtime;
}

beforeEach(() => {
	vi.clearAllMocks();
	effects.install.mockReset().mockResolvedValue(undefined);
	effects.add.mockReset().mockResolvedValue(undefined);
	effects.input.mockReset();
});
afterEach(cleanup);

describe('next10 mounted theme locale boundaries', () => {
	test.each(['en-US', 'ja-JP'])('preserves repeated installation, input reset, and routing in %s', async language => {
		const runtime = await activate(language);
		const view = render(ThemeInstall, { global: { plugins: [runtime] } });
		const dictionary = locales[language];
		const install = view.getByRole('button', { name: dictionary.install });
		expect((install as HTMLButtonElement).disabled).toBe(true);
		for (const name of ['First $& {x}', 'Second']) {
			const code = JSON.stringify({ id: 'fixture', name, base: 'light', props: {} });
			await fireEvent.update(view.getByRole('textbox', { name: 'theme code' }), code);
			await fireEvent.click(install);
			await vi.waitFor(() => expect(effects.alert).toHaveBeenLastCalledWith({ type: 'success', text: interpolateLocaleParameters(dictionary._theme.installed, { name }) }));
			expect(effects.install).toHaveBeenLastCalledWith(code);
			expect((install as HTMLButtonElement).disabled).toBe(true);
			expect((view.getByRole('textbox', { name: 'theme code' }) as HTMLTextAreaElement).value).toBe('');
		}
		expect(effects.push.mock.calls).toEqual([['/settings/theme'], ['/settings/theme']]);
		expect(effects.install).toHaveBeenCalledTimes(2);
	});

	test('preserves invalid preview and rejected install without navigation or clearing input', async () => {
		const runtime = await activate('en-US');
		const view = render(ThemeInstall, { global: { plugins: [runtime] } });
		const field = view.getByRole('textbox', { name: 'theme code' });
		await fireEvent.update(field, '{invalid');
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
		await fireEvent.click(view.getByRole('button', { name: locales['en-US'].preview }));
		expect(effects.alert).toHaveBeenLastCalledWith({ type: 'error', text: locales['en-US']._theme.invalid });
		expect(effects.preview).not.toHaveBeenCalled();
		errorLog.mockRestore();
		const code = JSON.stringify({ id: 'fixture', name: 'Rejected', base: 'light', props: {} });
		await fireEvent.update(field, code);
		const rejected = new Error('fixture rejection');
		effects.install.mockRejectedValueOnce(rejected);
		await fireEvent.click(view.getByRole('button', { name: locales['en-US'].install }));
		await vi.waitFor(() => expect(effects.error).toHaveBeenCalledWith(rejected));
		expect(effects.push).not.toHaveBeenCalled();
		expect((field as HTMLTextAreaElement).value).toBe(code);
	});

	test('preserves save-as cancellation and later success without real settings effects', async () => {
		const runtime = await activate('en-US');
		const view = render(ThemeEditor, { global: { plugins: [runtime], components: { PageWithHeader: Header } } });
		const save = view.getByRole('button', { name: locales['en-US'].saveAs });
		effects.input.mockResolvedValueOnce({ canceled: true });
		await fireEvent.click(save);
		await vi.waitFor(() => expect(effects.input).toHaveBeenCalledTimes(1));
		expect(effects.add).not.toHaveBeenCalled();
		expect(effects.update).not.toHaveBeenCalled();
		expect(effects.commit).not.toHaveBeenCalled();
		effects.input.mockResolvedValueOnce({ canceled: false, result: 'Saved $& {x}' });
		await fireEvent.click(save);
		await vi.waitFor(() => expect(effects.alert).toHaveBeenCalledWith({ type: 'success', text: interpolateLocaleParameters(locales['en-US']._theme.installed, { name: 'Saved $& {x}' }) }));
		expect(effects.add).toHaveBeenCalledTimes(1);
		expect(effects.update).toHaveBeenCalledTimes(1);
		expect(effects.commit).toHaveBeenCalledWith('lightTheme', expect.objectContaining({ name: 'Saved $& {x}' }));
	});
});

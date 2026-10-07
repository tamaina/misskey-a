/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { runInNewContext } from 'node:vm';
import { createApp, defineComponent, h } from 'vue';
import type { App } from 'vue';
import { expect, test, vi } from 'vitest';
import ts from 'typescript';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import locales from 'i18n';
import previewSource from '../../.storybook/preview.ts?raw';
import { preferState } from '../setup.unit.js';
import { startComponentLocales } from '@features/boot/frontend/index.js';
import registerComponents from '@features/index/frontend/components.js';
import registerDirectives from '@features/index/frontend/directives.js';
import MkEmoji from '@features/emojis/frontend/components/global/MkEmoji.vue';
import MkResult from '@features/ui/frontend/components/global/MkResult.vue';
import { lang } from '@features/boot/frontend/shared/config.js';

test('actual Storybook preview setup readies real component locales and installs once per app', async () => {
	const setup = vi.fn<(callback: (app: App) => void) => void>();
	const create = vi.fn(createInternationalization);
	const collaborators: Record<string, unknown> = {
		'@storybook/core-events': { FORCE_RE_RENDER: 'render', FORCE_REMOUNT: 'remount' },
		'@storybook/preview-api': { addons: { getChannel: () => ({ emit: vi.fn() }) } },
		'@storybook/vue3': { setup },
		'virtual:vite-vue-internationalization': { createInternationalization: create },
		'@features/boot/frontend/index.js': { startComponentLocales },
		'chromatic/isChromatic': { default: () => false },
		'msw-storybook-addon': { initialize: vi.fn(), mswLoader: vi.fn() },
		'./fakes.js': { userDetailed: () => ({ id: 'storybook-fixture' }) },
		'./mocks.js': { commonHandlers: [], onUnhandledRequest: vi.fn() },
		'./themes.js': { default: { 'l-light': {} } },
		'../src/style.scss': {},
		'../../features/index/frontend/components.js': { default: registerComponents },
		'../../features/index/frontend/directives.js': { default: registerDirectives },
		'../../features/index/frontend/widgets.js': { default: vi.fn() },
		'../../features/preferences/frontend/theme.js': { themeManager: { updateTheme: vi.fn() } },
		'../../features/preferences/frontend/preferences.js': { prefer: { commit: vi.fn() } },
		'../../features/ui/frontend/os.js': { popups: [] },
		'@features/boot/frontend/shared/config.js': { lang },
	};
	// Execute the actual preview's setup and guard. Only external Storybook,
	// theme/widget and network collaborators are substituted; localization and
	// both representative Vue components use the real generated VVI runtime.
	const compiled = ts.transpileModule(previewSource, {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	expect(compiled.diagnostics).toEqual([]);
	runInNewContext(compiled.outputText, {
		exports: {},
		require(specifier: string) {
			if (!Object.hasOwn(collaborators, specifier)) throw new Error(`Unexpected preview dependency: ${specifier}`);
			return { __esModule: true, ...(collaborators[specifier] as Record<string, unknown>) };
		},
		window, localStorage, queueMicrotask, MutationObserver,
	});
	await vi.waitFor(() => expect(setup).toHaveBeenCalledOnce());
	expect(create).toHaveBeenCalledExactlyOnceWith({ initialLocale: lang });
	const configure = setup.mock.calls[0][0];
	preferState.emojiStyle = 'native';
	const app = createApp(defineComponent({
		setup: () => () => h('div', [h(MkEmoji, { emoji: '\u2764' }), h(MkResult, { type: 'empty' })]),
	}));
	const use = vi.spyOn(app, 'use');
	const element = document.createElement('div');
	const secondApp = createApp(MkResult, { type: 'notFound' });
	const secondUse = vi.spyOn(secondApp, 'use');
	const secondElement = document.createElement('div');
	try {
		configure(app);
		configure(app);
		expect(use).toHaveBeenCalledOnce();
		app.mount(element);
		expect(element.querySelector('span')?.textContent).toBe('\u2764\uFE0F');
		expect(element.querySelector('[style="opacity: 0.7;"]')?.textContent).toBe(locales[lang].nothing);
		configure(secondApp);
		configure(secondApp);
		expect(secondUse).toHaveBeenCalledOnce();
		expect(create).toHaveBeenCalledOnce();
		secondApp.mount(secondElement);
		expect(secondElement.querySelector('[style="opacity: 0.7;"]')?.textContent).toBe(locales[lang].notFound);
	} finally {
		app.unmount();
		secondApp.unmount();
		preferState.emojiStyle = '';
	}
});

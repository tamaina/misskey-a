/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FORCE_RE_RENDER, FORCE_REMOUNT } from '@storybook/core-events';
import { addons } from '@storybook/preview-api';
import { type Preview, setup } from '@storybook/vue3';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { startComponentLocales } from '@features/boot/frontend/index.js';
import isChromatic from 'chromatic/isChromatic';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { userDetailed } from './fakes.js';
import { commonHandlers, onUnhandledRequest } from './mocks.js';
import themes from './themes.js';
import '../src/style.scss';

const appInitialized = Symbol();

let lastStory: string | null = null;
let moduleInitialized = false;
let unobserve = () => {};
let misskeyOS = null;

function loadTheme(themeMaganer: typeof import('../../features/preferences/frontend/theme')['themeManager']) {
	unobserve();
	const theme = themes[window.document.documentElement.dataset.misskeyTheme];
	if (theme) {
		themeMaganer.updateTheme(themes[window.document.documentElement.dataset.misskeyTheme]);
	} else {
		themeMaganer.updateTheme(themes['l-light']);
	}
	const observer = new MutationObserver((entries) => {
		for (const entry of entries) {
			if (entry.attributeName === 'data-misskey-theme') {
				const target = entry.target as HTMLElement;
				const theme = themes[target.dataset.misskeyTheme];
				if (theme) {
					themeMaganer.updateTheme(themes[target.dataset.misskeyTheme]);
				} else {
					target.removeAttribute('style');
				}
			}
		}
	});
	observer.observe(window.document.documentElement, {
		attributes: true,
		attributeFilter: ['data-misskey-theme'],
	});
	unobserve = () => observer.disconnect();
}

function initLocalStorage() {
	localStorage.clear();
	localStorage.setItem('account', JSON.stringify({
		...userDetailed(),
		policies: {},
	}));
}

initialize({
	onUnhandledRequest,
});
initLocalStorage();
queueMicrotask(() => {
	Promise.all([
		import('../../features/index/frontend/components.js'),
		import('../../features/index/frontend/directives.js'),
		import('../../features/index/frontend/widgets.js'),
		import('../../features/preferences/frontend/theme.js'),
		import('../../features/preferences/frontend/preferences.js'),
		import('../../features/ui/frontend/os.js'),
	]).then(async ([{ default: components }, { default: directives }, { default: widgets }, { themeManager }, { prefer }, os]) => {
		const { lang } = await import('../../frontend-shared/js/config.js');
		await startComponentLocales(lang, createInternationalization, (internationalization) => {
			setup((app) => {
				moduleInitialized = true;
				if (app[appInitialized]) {
					return;
				}
				app[appInitialized] = true;
				app.use(internationalization);
				loadTheme(themeManager);
				components(app);
				directives(app);
				widgets(app);
				misskeyOS = os;
				if (isChromatic()) {
					prefer.commit('animation', false);
				}
			});
		});
	});
});

const preview = {
	decorators: [
		(Story, context) => {
			if (lastStory === context.id) {
				lastStory = null;
			} else {
				lastStory = context.id;
				const channel = addons.getChannel();
				const resetIndexedDBPromise = globalThis.indexedDB?.databases
					? indexedDB.databases().then((r) => {
							for (let i = 0; i < r.length; i++) {
								indexedDB.deleteDatabase(r[i].name!);
							}
						}).catch(() => {})
					: Promise.resolve();
				const resetDefaultStorePromise = import('../../features/preferences/frontend/store').then(({ store }) => {
					// @ts-expect-error -- Storybook deliberately invokes the private initializer to reset story state.
					store.init();
				}).catch(() => {});
				Promise.all([resetIndexedDBPromise, resetDefaultStorePromise]).then(() => {
					initLocalStorage();
					channel.emit(FORCE_RE_RENDER, { storyId: context.id });
				});
			}
			const story = Story();
			if (!moduleInitialized) {
				const channel = addons.getChannel();
				(globalThis.requestIdleCallback || setTimeout)(() => {
					channel.emit(FORCE_REMOUNT, { storyId: context.id });
				});
			}
			return story;
		},
		(Story, context) => {
			return {
				setup() {
					return {
						context,
						popups: misskeyOS.popups,
					};
				},
				template:
					'<component :is="popup.component" v-for="popup in popups" :key="popup.id" v-bind="popup.props" v-on="popup.events"/>' +
					'<story />',
			};
		},
	],
	loaders: [mswLoader],
	parameters: {
		controls: {
			exclude: /^__/,
		},
		msw: {
			handlers: commonHandlers,
		},
	},
} satisfies Preview;

export default preview;

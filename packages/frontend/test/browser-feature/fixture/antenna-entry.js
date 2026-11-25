/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { compile } from '@features/preferences/frontend/shared/theme.js';
import lightTheme from '@features/preferences/frontend/themes/_light.json5';
import AntennaFixture from './AntennaFixture.vue';
import '../../../src/style.scss';
import 'icons-subsetter/built/tabler-icons-frontend.css';
for (const [key, value] of Object.entries(compile(lightTheme))) document.documentElement.style.setProperty(`--MI_THEME-${key}`, value);
const app = createApp(AntennaFixture);
app.component('MkSystemIcon', { render: () => h('span') });
app.component('MkA', { render: () => h('a') });
for (const name of ['hotkey', 'tooltip', 'ripple', 'adaptive-border']) app.directive(name, {});
const locale = createInternationalization({ initialLocale: 'ja-JP' });
await locale.ready;
await locale.loadLocale('ja-JP');
app.use(locale);
app.mount('#app');

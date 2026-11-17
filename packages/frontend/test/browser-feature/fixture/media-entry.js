/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import MediaFixture from './MediaFixture.vue';
import '../../../src/style.scss';
import 'icons-subsetter/built/tabler-icons-frontend.css';
const app = createApp(MediaFixture);
app.component('MkSystemIcon', { render: () => h('span') });
for (const name of ['hotkey', 'tooltip', 'ripple', 'adaptive-border']) app.directive(name, {});
const locale = createInternationalization({ initialLocale: 'en-US' });
await locale.ready;
await locale.loadLocale('en-US');
app.use(locale);
app.mount('#app');

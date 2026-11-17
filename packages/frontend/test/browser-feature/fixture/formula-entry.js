/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, defineComponent, h, Suspense } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Branding from '@features/instance/frontend/pages/admin/branding.vue';
import Mfm from '@features/markup/frontend/components/global/MkMfm.ts';
import EmbedMfm from '@features/markup/frontend/embed/components/EmMfm.ts';
import FormStub from './FormulaFormStub.vue';

const complex = new URL(window.location.href).searchParams.has('complex');
const text = complex ? `\\(${'x'.repeat(1001)}\\)` : '\\(a^2+b^2=c^2\\)\n\\[\n\\sum_{i=1}^{n}i\n\\]\n\\(\\href{https://untrusted.invalid}{unsafe link}\\)\n\\(\\bad{<img src=x>}\\)';
const runtime = createInternationalization({ initialLocale: 'en-US' });
await runtime.ready; await runtime.loadLocale('en-US');
const app = createApp(defineComponent({ render: () => h('main', [
	h(Suspense, {}, { default: () => h('div', { id: 'settings' }, [h(Branding)]), fallback: () => h('span', 'Loading settings') }),
	h('h2', 'Main renderer'), h('div', { id: 'normal' }, [h(Mfm, { text })]),
	h('h2', 'Embed renderer'), h('div', { id: 'embed' }, [h(EmbedMfm, { text })]),
]) }));
app.use(runtime);
for (const name of ['PageWithHeader', 'SearchMarker', 'SearchLabel']) app.component(name, FormStub);
app.directive('tooltip', {}); app.directive('adaptive-border', {});
app.mount('#app');

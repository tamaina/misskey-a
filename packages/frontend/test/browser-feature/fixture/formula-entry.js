/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, defineComponent, h, Suspense } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Branding from '@features/instance/frontend/pages/admin/branding.vue';
import Mfm from '@features/markup/frontend/components/global/MkMfm.ts';
import EmbedMfm from '@features/markup/frontend/embed/components/EmMfm.ts';
import MkNyaizePreference from '@features/preferences/frontend/components/MkNyaizePreference.vue';
import MkMfmSearchPreference from '@features/preferences/frontend/components/MkMfmSearchPreference.vue';
import FormStub from './FormulaFormStub.vue';

const mixed = new URL(window.location.href).searchParams.has('mixed');
const complex = new URL(window.location.href).searchParams.has('complex');
const mathText = complex ? `\\(${'x'.repeat(1001)}\\)` : '\\(a^2+b^2=c^2\\)\n\\[\n\\sum_{i=1}^{n}i\n\\]\n\\(\\href{https://untrusted.invalid}{unsafe link}\\)\n\\(\\bad{<img src=x>}\\)';
const text = mixed ? `なな\n${mathText}\n\n日本語 &other=1 検索` : mathText;
const props = { text, author: { isCat: true }, nyaize: 'respect' };
const runtime = createInternationalization({ initialLocale: 'en-US' });
await runtime.ready; await runtime.loadLocale('en-US');
const app = createApp(defineComponent({ render: () => h('main', [
	mixed ? h('section', { id: 'viewer-settings' }, [h('div', { id: 'cat-setting' }, [h(MkNyaizePreference, { label: 'Disable cat speech' })]), h('div', { id: 'search-setting' }, [h(MkMfmSearchPreference, { label: 'MFM search engine' })])]) : null,
	h(Suspense, {}, { default: () => h('div', { id: 'settings' }, [h(Branding)]), fallback: () => h('span', 'Loading settings') }),
	h('h2', 'Main renderer'), h('div', { id: 'normal' }, [h(Mfm, props)]),
	h('h2', 'Embed renderer'), h('div', { id: 'embed' }, [h(EmbedMfm, props)]),
]) }));
app.use(runtime);
for (const name of ['PageWithHeader', 'SearchMarker', 'SearchLabel']) app.component(name, FormStub);
app.directive('tooltip', {}); app.directive('adaptive-border', {});
app.mount('#app');

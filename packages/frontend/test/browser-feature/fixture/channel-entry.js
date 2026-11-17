/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
// Fixture-only registrations keep the synthetic application shell together.
/* eslint-disable vue/one-component-per-file */
import { createApp, defineComponent, h } from 'vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Channels from '@features/channels/frontend/pages/channels.vue';
import I18n from '@features/ui/frontend/components/global/I18n.vue';
import MkResult from '@features/ui/frontend/components/global/MkResult.vue';
import MkError from '@features/ui/frontend/components/global/MkError.vue';
import MkLoading from '@features/ui/frontend/components/global/MkLoading.vue';
import Link from './ChannelLink.vue';
import '../../../src/style.scss';

const app = createApp(Channels, { query: 'needle' });
app.component('PageWithHeader', defineComponent({
	props: { tab: { type: String, required: true }, tabs: { type: Array, required: true } }, emits: ['update:tab'],
	setup: (props, { emit, slots }) => () => h('main', { class: 'fixture-page' }, [
		h('h1', 'Channels'),
		h('nav', { 'aria-label': 'Channel sections' }, props.tabs.map(tab => h('button', { 'aria-pressed': props.tab === tab.key, onClick: () => emit('update:tab', tab.key) }, tab.title))),
		slots.default?.(),
	]),
}));
for (const [name, component] of Object.entries({ I18n, MkA: Link, MkResult, MkError, MkLoading })) app.component(name, component);
app.component('MkSystemIcon', { render: () => h('span', { 'aria-hidden': 'true' }, '○') });
app.component('MkTime', { render: () => h('time') });
app.directive('appear', {});
app.directive('adaptive-border', {});
const locale = createInternationalization({ initialLocale: 'en-US' });
await locale.ready; await locale.loadLocale('en-US');
app.use(locale); app.mount('#app');

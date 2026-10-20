/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApp, defineComponent, h, nextTick } from 'vue';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import Channels from '../../frontend/pages/channels.vue';
import type { IPaginator } from '@features/ui/frontend/utility/paginator.js';
import type { PropType } from 'vue';

const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: mocks.api }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'viewer', policies: { canCreateChannel: true } } }));
vi.mock('@features/navigation/frontend/router.js', () => ({ useRouter: () => ({}) }));
vi.mock('@features/navigation/frontend/page.js', () => ({ definePage: vi.fn() }));
vi.mock('@features/channels/frontend/components/MkChannelPreview.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['channel'], setup: props => () => h('span', { class: 'channel' }, props.channel.name) }) };
});
vi.mock('@features/channels/frontend/components/MkChannelList.vue', async () => {
	const { defineComponent, h } = await import('vue');
	const { default: Pagination } = await import('@features/ui/frontend/components/MkPagination.vue');
	return { default: defineComponent({
		props: ['paginator'],
		setup: props => () => h(Pagination, { paginator: props.paginator }, {
			default: ({ items }: { items: { id: string; name: string }[] }) => items.map(item => h('span', { class: 'channel', key: item.id }, item.name)),
		}),
	}) };
});
vi.mock('@features/ui/frontend/components/MkPagination.vue', async () => {
	const { defineComponent, h, onMounted } = await import('vue');
	return { default: defineComponent({
		props: { paginator: { type: Object as PropType<IPaginator>, required: true } },
		setup(props, { slots }) {
			onMounted(() => { void props.paginator.init(); });
			return () => h('section', { 'data-error': String(props.paginator.error.value) }, [
				slots.default?.({ items: props.paginator.items.value }),
				h('button', { class: 'older', onClick: () => props.paginator.fetchOlder() }, 'older'),
			]);
		},
	}) };
});
vi.mock('@features/ui/frontend/components/MkInput.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ props: ['modelValue'], emits: ['update:modelValue', 'enter'], setup: (props, { emit }) => () => h('input', {
		value: props.modelValue, onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
		onKeydown: (event: KeyboardEvent) => { if (event.key === 'Enter') emit('enter'); },
	}) }) };
});
vi.mock('@features/ui/frontend/components/MkButton.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_props, { slots }) => () => h('button', { class: 'action' }, slots.default?.()) }) };
});
vi.mock('@features/ui/frontend/components/MkRadios.vue', () => ({ default: { render: () => null } }));
vi.mock('@features/ui/frontend/components/MkFoldableSection.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_props, { slots }) => () => h('div', slots.default?.()) }) };
});

const internationalization = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('en-US'); });
type Item = { id: string; name: string; createdAt: string };
const requests: { endpoint: string; params: Record<string, unknown>; resolve: (items: Item[]) => void; reject: (error: Error) => void }[] = [];
const unmounts: (() => void)[] = [];
beforeEach(() => {
	requests.length = 0;
	mocks.api.mockReset().mockImplementation((endpoint, params) => new Promise<Item[]>((resolve, reject) => requests.push({ endpoint, params, resolve, reject })));
});
afterEach(() => { for (const unmount of unmounts.splice(0)) unmount(); });

function mount(): HTMLDivElement {
	const element = window.document.createElement('div');
	const app = createApp({ render: () => h(Channels, { query: 'needle' }) });
	app.component('PageWithHeader', defineComponent({
		props: ['tab', 'tabs'], emits: ['update:tab'],
		setup: (props, { emit, slots }) => () => h('main', [
			...props.tabs.map((tab: { key: string }) => h('button', { 'data-tab': tab.key, onClick: () => emit('update:tab', tab.key) }, tab.key)),
			slots.default?.(),
		]),
	}));
	app.use(internationalization); app.mount(element); unmounts.push(() => app.unmount());
	return element;
}

async function flush(): Promise<void> { for (let i = 0; i < 4; i++) { await Promise.resolve(); await nextTick(); } }

async function click(element: HTMLElement, text: string): Promise<void> {
	const button = [...element.querySelectorAll('button')].find(button => button.textContent?.trim() === text);
	expect(button, `button ${text}`).toBeDefined(); button!.click(); await flush();
}

const item = (id: string): Item => ({ id, name: id, createdAt: '2026-01-01T00:00:00.000Z' });
const names = (element: HTMLElement) => [...element.querySelectorAll('.channel')].map(channel => channel.textContent);

test('trending starts local; a late local response cannot replace remote items', async () => {
	const element = mount(); await flush();
	expect(requests[0]).toMatchObject({ endpoint: 'channels/featured', params: { origin: 'local' } });
	expect([...element.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Local')?.disabled).toBe(true);
	await click(element, 'Remote');
	expect(requests[1]).toMatchObject({ endpoint: 'channels/featured', params: { origin: 'remote' } });
	requests[1].resolve([item('remote')]); await flush();
	requests[0].resolve([item('old-local')]); await flush();
	expect(names(element)).toEqual(['remote']);
});

test('a detached request rejection cannot set the active origin error state', async () => {
	const element = mount(); await flush(); await click(element, 'Remote');
	requests[1].resolve([item('remote')]); await flush();
	requests[0].reject(new Error('old local failure')); await flush();
	expect(element.querySelector('[data-error]')?.getAttribute('data-error')).toBe('false');
	expect(names(element)).toEqual(['remote']);
});

test('search switches origin with its query, resets cursors, and discards an older page from the previous origin', async () => {
	const element = mount(); await flush(); requests[0].resolve([]); await flush();
	await click(element, 'search'); await click(element, 'Search');
	expect(requests[1]).toMatchObject({ endpoint: 'channels/search', params: { query: 'needle', type: 'nameAndDescription', origin: 'local' } });
	requests[1].resolve([item('local-2')]); await flush();
	await click(element, 'older');
	expect(requests[2].params).toMatchObject({ origin: 'local', untilId: 'local-2' });
	await click(element, 'Remote');
	expect(requests[3].params).toMatchObject({ origin: 'remote', query: 'needle' });
	expect(requests[3].params).not.toHaveProperty('untilId');
	requests[3].resolve([item('remote-2')]); await flush();
	requests[2].resolve([item('old-local-page')]); await flush();
	expect(names(element)).toEqual(['remote-2']);
	await click(element, 'older');
	expect(requests[4].params).toMatchObject({ origin: 'remote', untilId: 'remote-2' });
});

test.each([['favorites', 'channels/my-favorites'], ['following', 'channels/followed'], ['owned', 'channels/owned']])('%s retains its personal paginator without an origin tab or API filter', async (tab, endpoint) => {
	const element = mount(); await flush(); requests[0].resolve([]); await flush();
	await click(element, 'Remote'); requests[1].resolve([]); await flush();
	await click(element, tab);
	expect(requests[2].endpoint).toBe(endpoint);
	expect(requests[2].params).not.toHaveProperty('origin');
	expect([...element.querySelectorAll('button')].some(button => ['Local', 'Remote'].includes(button.textContent?.trim() ?? ''))).toBe(false);
});

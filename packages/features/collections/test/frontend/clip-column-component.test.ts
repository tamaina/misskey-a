/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApp, h, nextTick, reactive } from 'vue';
import type { entities } from 'misskey-js';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import ClipColumn from '../../frontend/ui/deck/clip-column.vue';
import type { Column } from '@features/preferences/frontend/deck.js';

const mocks = vi.hoisted(() => ({ api: vi.fn(), update: vi.fn(), reload: vi.fn(), channel: vi.fn() }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: mocks.api }));
vi.mock('@features/preferences/frontend/deck.js', () => ({ updateColumn: mocks.update }));
vi.mock('@features/runtime/frontend/cache.js', () => ({ clipsCache: { fetch: vi.fn() }, favoritedClipsCache: { fetch: vi.fn() } }));
vi.mock('@features/ui/frontend/os.js', () => ({ select: vi.fn(), pageWindow: vi.fn() }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: { id: 'me' } }));
vi.mock('@features/api/frontend/stream.js', () => ({ useStream: () => ({ useChannel: mocks.channel }) }));
vi.mock('@features/ui/frontend/utility/paginator.js', () => ({ Paginator: class { reload = mocks.reload; } }));
vi.mock('@features/navigation/frontend/ui/deck/column.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: (_props, { slots }) => () => h('section', [slots.header?.(), slots.default?.()]) }) };
});
vi.mock('@features/timelines/frontend/components/MkNotesTimeline.vue', async () => {
	const { defineComponent, h, inject } = await import('vue');
	return { default: defineComponent({ setup() {
		const clip = inject<{ value: entities.Clip | null }>('currentClip')!;
		return () => h('span', { class: 'current-clip' }, clip.value?.name ?? '');
	} }) };
});
vi.mock('@features/ui/frontend/components/global/MkResult.vue', async () => {
	const { defineComponent, h } = await import('vue');
	return { default: defineComponent({ setup: () => () => h('span', 'not found') }) };
});

const internationalization = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => { await internationalization.ready; await internationalization.loadLocale('en-US'); });

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: Error) => void } {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	return { promise: new Promise<T>((yes, no) => { resolve = yes; reject = no; }), resolve, reject };
}

const requests = new Map<string, ReturnType<typeof deferred<entities.Clip>>>();
const connections: { handlers: Map<string, () => void>; dispose: ReturnType<typeof vi.fn> }[] = [];
const fixtures: { unmount: () => void }[] = [];
beforeEach(() => {
	vi.useFakeTimers();
	mocks.api.mockReset(); mocks.update.mockReset(); mocks.reload.mockReset(); mocks.channel.mockReset();
	requests.clear(); connections.length = 0;
	mocks.api.mockImplementation((_endpoint, { clipId }: { clipId: string }) => {
		const request = deferred<entities.Clip>(); requests.set(clipId, request); return request.promise;
	});
	mocks.channel.mockImplementation(() => {
		const handlers = new Map<string, () => void>();
		const connection = { handlers, on: (event: string, handler: () => void) => handlers.set(event, handler), dispose: vi.fn(() => handlers.clear()) };
		connections.push(connection); return connection;
	});
});
afterEach(() => { for (const fixture of fixtures.splice(0)) fixture.unmount(); vi.useRealTimers(); vi.restoreAllMocks(); });

function mountColumn(): { column: Column; element: HTMLDivElement; unmount: () => void } {
	const column = reactive<Column>({ id: 'column', type: 'clip', name: null, width: 350, clipId: 'a' });
	const element = window.document.createElement('div');
	const app = createApp({ render: () => h(ClipColumn, { column, isStacked: false }) });
	app.use(internationalization); app.mount(element);
	const fixture = { column, element, unmount: () => app.unmount() }; fixtures.push(fixture); return fixture;
}

function resolveClip(id: string, userId = 'viewer'): void {
	requests.get(id)!.resolve({ id, name: `clip ${id}`, userId } as entities.Clip);
}

async function flush(): Promise<void> { await Promise.resolve(); await nextTick(); }

test('ignores an older successful request after switching clips', async () => {
	const fixture = mountColumn(); fixture.column.clipId = 'b'; await nextTick();
	resolveClip('b'); await flush(); resolveClip('a'); await flush();
	expect(fixture.element.querySelector('.current-clip')?.textContent).toBe('clip b');
	expect(mocks.update).toHaveBeenCalledTimes(1);
	expect(mocks.update).toHaveBeenCalledWith('column', { timelineNameCache: 'clip b' });
	expect(connections[0].dispose).toHaveBeenCalledOnce();
});

test('ignores an older rejection after a new clip has loaded', async () => {
	const fixture = mountColumn(); fixture.column.clipId = 'b'; await nextTick();
	resolveClip('b'); await flush(); requests.get('a')!.reject(new Error('old request')); await flush();
	expect(fixture.element.textContent).not.toContain('not found');
	expect(fixture.element.querySelector('.current-clip')?.textContent).toBe('clip b');
});

test('a deleted notification cannot be undone by an outstanding show request', async () => {
	const fixture = mountColumn(); connections[0].handlers.get('deleted')!(); await nextTick();
	resolveClip('a'); await flush();
	expect(fixture.element.textContent).toContain('not found');
	expect(mocks.update).not.toHaveBeenCalled();
	expect(connections[0].dispose).toHaveBeenCalledOnce();
});

test('coalesces viewer updates and cancels their pending reload on clip changes', async () => {
	vi.spyOn(Math, 'random').mockReturnValue(0.5);
	const fixture = mountColumn(); resolveClip('a'); await flush();
	connections[0].handlers.get('updated')!(); connections[0].handlers.get('updated')!();
	vi.advanceTimersByTime(2499); expect(mocks.reload).not.toHaveBeenCalled();
	vi.advanceTimersByTime(1); expect(mocks.reload).toHaveBeenCalledOnce();
	connections[0].handlers.get('updated')!(); fixture.column.clipId = 'b'; await nextTick();
	vi.advanceTimersByTime(5000); expect(mocks.reload).toHaveBeenCalledOnce();
});

test('owners reload immediately and unmount prevents later cache writes', async () => {
	const fixture = mountColumn(); resolveClip('a', 'me'); await flush();
	connections[0].handlers.get('updated')!(); expect(mocks.reload).toHaveBeenCalledOnce();
	fixture.column.clipId = 'b'; await nextTick(); fixture.unmount(); fixtures.splice(fixtures.indexOf(fixture), 1);
	mocks.update.mockClear(); resolveClip('b'); await flush();
	expect(mocks.update).not.toHaveBeenCalled(); expect(connections[1].dispose).toHaveBeenCalledOnce();
});

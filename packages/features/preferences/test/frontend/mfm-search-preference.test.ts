/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineComponent, h } from 'vue';
import { beforeAll, beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import MkGoogle from '@features/integrations/frontend/components/MkGoogle.vue';
import * as os from '@features/ui/frontend/os.js';
import { PreferencesManager } from '../../frontend/state/manager.js';
import MkMfmSearchPreference from '../../frontend/components/MkMfmSearchPreference.vue';
import { prefer } from '../../frontend/preferences.js';
import type { PreferencesProfile, StorageProvider } from '../../frontend/state/manager.js';
const fixture = vi.hoisted(() => ({ profile: null as PreferencesProfile | null }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ host: 'synthetic.invalid', lang: 'en-US', version: 'test', prefersReducedMotion: false }));
vi.mock('@features/auth/frontend/i.js', () => ({ $i: null, iAmModerator: false, iAmAdmin: false }));
vi.mock('@features/ui/frontend/os.js', () => ({ popupMenu: vi.fn(), contextMenu: vi.fn() }));
vi.mock('@features/preferences/frontend/preferences.js', async () => {
	const { PreferencesManager: Manager } = await import('../../frontend/state/manager.js');
	const io: StorageProvider = { load: () => fixture.profile, save: ({ profile }) => { fixture.profile = JSON.parse(JSON.stringify(profile)); }, cloudGetBulk: async () => ({}), cloudGet: async () => null, cloudSet: async () => {} };
	return { prefer: new Manager(io, null) };
});
const locale = createInternationalization({ initialLocale: 'en-US' });
const global = { plugins: [locale], directives: { tooltip: {}, adaptiveBorder: {} }, stubs: { SearchMarker: { template: '<div><slot /></div>' }, SearchLabel: { template: '<span><slot /></span>' } } };
beforeAll(async () => { await locale.ready; await locale.loadLocale('en-US'); });
beforeEach(() => { prefer.commit('mfmSearchEngine', 'google'); prefer.commit('mfmSearchEngineCustomUrl', ''); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('custom setting saves, restores, updates the real search button and safely opens the edited query', async () => {
	const openWindow = vi.spyOn(window, 'open').mockReturnValue(null);
	render(defineComponent({ render: () => h('div', [h('section', { 'data-testid': 'mfm-search-preference' }, [h(MkMfmSearchPreference, { label: 'MFM search engine' })]), h(MkGoogle, { q: 'original query' })]) }), { global });
	await screen.findByRole('button', { name: 'Search (Google)' });
	await fireEvent.mouseDown(within(screen.getByTestId('mfm-search-preference')).getByText('Google', { exact: true }));
	const item = vi.mocked(os.popupMenu).mock.calls[0][0].find(candidate => candidate != null && typeof candidate === 'object' && 'text' in candidate && candidate.text === 'Custom');
	if (item == null || typeof item !== 'object' || !('action' in item)) throw new Error('Custom option missing');
	item.action(new PointerEvent('click'));
	const field = await screen.findByPlaceholderText('https://example.com/search?q={query}');
	await fireEvent.update(field, 'https://example.com/?q={query}');
	expect(prefer.s.mfmSearchEngineCustomUrl).toBe('');
	await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
	await screen.findByRole('button', { name: 'Search (example.com)' });
	await fireEvent.update(screen.getByRole('searchbox'), '日本語 &other=1');
	await fireEvent.click(screen.getByRole('button', { name: 'Search (example.com)' }));
	expect(openWindow).toHaveBeenCalledWith('https://example.com/?q=%E6%97%A5%E6%9C%AC%E8%AA%9E%20%26other%3D1', '_blank', 'noopener');
	const io: StorageProvider = { load: () => fixture.profile, save: () => {}, cloudGetBulk: async () => ({}), cloudGet: async () => null, cloudSet: async () => {} };
	const restored = new PreferencesManager(io, null); await restored.cloudReady;
	expect(restored.s.mfmSearchEngine).toBe('custom');
	expect(restored.s.mfmSearchEngineCustomUrl).toBe('https://example.com/?q={query}');
});

test('invalid imported custom URL falls back to Google and q prop changes retain existing behavior', async () => {
	const openWindow = vi.spyOn(window, 'open').mockReturnValue(null);
	prefer.commit('mfmSearchEngine', 'custom'); prefer.commit('mfmSearchEngineCustomUrl', 'javascript:alert({query})');
	const view = render(MkGoogle, { props: { q: 'old' }, global });
	await view.rerender({ q: 'new & data' });
	expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('new & data');
	await fireEvent.click(await screen.findByRole('button', { name: 'Search (Google)' }));
	expect(openWindow).toHaveBeenCalledWith('https://www.google.com/search?q=new%20%26%20data', '_blank', 'noopener');
});

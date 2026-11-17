/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineComponent, h } from 'vue';
import type { MfmBaseProps } from '@features/markup/frontend/shared/mfm-renderer.js';
import { createMfmRenderer } from '@features/markup/frontend/shared/mfm-renderer.js';
import { beforeAll, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import { PreferencesManager } from '../../frontend/state/manager.js';
import type { PreferencesProfile, StorageProvider } from '../../frontend/state/manager.js';
import MkNyaizePreference from '../../frontend/components/MkNyaizePreference.vue';
import { prefer } from '../../frontend/preferences.js';

const fixture = vi.hoisted(() => ({ profile: null as PreferencesProfile | null }));
vi.mock('@features/boot/frontend/shared/config.js', () => ({ host: 'synthetic.invalid', lang: 'en-US', version: 'test', prefersReducedMotion: false }));
vi.mock('@features/ui/frontend/os.js', () => ({ popupMenu: vi.fn(), contextMenu: vi.fn() }));
vi.mock('@features/preferences/frontend/preferences.js', async () => {
	const { PreferencesManager } = await import('../../frontend/state/manager.js');
	const io: StorageProvider = { load: () => fixture.profile, save: ({ profile }) => { fixture.profile = JSON.parse(JSON.stringify(profile)); }, cloudGetBulk: async () => ({}), cloudGet: async () => null, cloudSet: async () => {} };
	return { prefer: new PreferencesManager(io, null) };
});
const locale = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => { await locale.ready; await locale.loadLocale('en-US'); });
afterEach(cleanup);

test('switch defaults off and persists through a new preference manager', async () => {
	expect(prefer.s.disableNoteNyaize).toBe(false);
	const Placeholder = defineComponent({ render: () => h('span') });
	const renderer = createMfmRenderer({ components: () => ({ Url: Placeholder, Link: Placeholder, Mention: Placeholder, A: Placeholder, Time: Placeholder, Emoji: Placeholder, CustomEmoji: Placeholder }), getOptions: () => ({ advancedMfm: false, animatedMfm: false, disableNyaize: prefer.r.disableNoteNyaize.value }) });
	const Preview = defineComponent({ render: () => h('div', { 'data-testid': 'preview' }, [renderer({ text: 'なな', author: { isCat: true } as MfmBaseProps['author'], nyaize: 'respect' }, { emit: vi.fn() })]) });
	render(defineComponent({ render: () => h('div', [h(MkNyaizePreference), h(Preview)]) }), { global: { plugins: [locale], directives: { tooltip: {} }, stubs: { SearchMarker: { template: '<div><slot /></div>' }, SearchLabel: { template: '<span><slot /></span>' } } } });
	await screen.findByText('Disable cat speech');
	expect(screen.getByTestId('preview').textContent).toBe('にゃにゃ');
	await fireEvent.click(screen.getByTestId('switch-toggle'));
	expect(prefer.s.disableNoteNyaize).toBe(true);
	expect(screen.getByTestId('preview').textContent).toBe('なな');
	const io: StorageProvider = { load: () => fixture.profile, save: () => {}, cloudGetBulk: async () => ({}), cloudGet: async () => null, cloudSet: async () => {} };
	const restored = new PreferencesManager(io, null);
	await restored.cloudReady;
	expect(restored.s.disableNoteNyaize).toBe(true);
	await fireEvent.click(screen.getByTestId('switch-toggle'));
	expect(prefer.s.disableNoteNyaize).toBe(false);
	expect(screen.getByTestId('preview').textContent).toBe('にゃにゃ');
});

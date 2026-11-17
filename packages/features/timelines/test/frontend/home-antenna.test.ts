/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createInternationalization } from 'virtual:vite-vue-internationalization';
import MkAntennaEditor from '@features/timelines/frontend/components/MkAntennaEditor.vue';
import * as os from '@features/ui/frontend/os.js';

vi.mock('@features/ui/frontend/os.js', () => ({ popupMenu: vi.fn(), apiWithDialog: vi.fn(async (_endpoint: string, input: unknown) => input) }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn(async () => []) }));
const locale = createInternationalization({ initialLocale: 'en-US' });
beforeAll(async () => { await locale.ready; await locale.loadLocale('en-US'); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const global = { plugins: [locale], directives: { 'adaptive-border': {}, tooltip: {} } };

test('selects followed users with the real editor/select and saves the home source', async () => {
	render(MkAntennaEditor, { global });
	await fireEvent.mouseDown(await screen.findByText('All notes'));
	const menu = vi.mocked(os.popupMenu).mock.calls[0][0];
	const option = menu.find(item => item != null && typeof item === 'object' && 'text' in item && item.text === 'Notes from followed users');
	if (option == null || typeof option !== 'object' || !('action' in option)) throw new Error('Home source option missing');
	option.action(new PointerEvent('click'));
	await screen.findByText('Notes from followed users');
	await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
	await waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledWith('antennas/create', expect.objectContaining({ src: 'home' })));
});

test('an existing or imported home antenna retains its source on re-edit', async () => {
	render(MkAntennaEditor, { props: { antenna: { id: 'antenna', src: 'home', name: 'Following', keywords: [['needle']] } }, global });
	await screen.findByText('Notes from followed users');
	await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
	await waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledWith('antennas/update', expect.objectContaining({ antennaId: 'antenna', src: 'home', keywords: [['needle']] })));
});

test('new antennas still default to all notes', async () => {
	render(MkAntennaEditor, { global });
	await screen.findByText('All notes');
	await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
	await waitFor(() => expect(os.apiWithDialog).toHaveBeenCalledWith('antennas/create', expect.objectContaining({ src: 'all' })));
});

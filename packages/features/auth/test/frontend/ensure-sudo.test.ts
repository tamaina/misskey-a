/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';

const fixture = vi.hoisted(() => ({
	account: { id: 'synthetic-owner', token: 'bs_synthetic' },
	dispose: vi.fn(),
	events: null as null | { done: (value: boolean) => void; closed: () => void },
}));

vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => fixture.account }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({
	popup: vi.fn((_component, _props, events) => {
		fixture.events = events;
		return { dispose: fixture.dispose };
	}),
}));

import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { popup } from '@features/ui/frontend/os.js';

beforeEach(() => {
	vi.clearAllMocks();
	fixture.account = { id: 'synthetic-owner', token: 'bs_synthetic' };
	fixture.events = null;
	vi.mocked(misskeyApi).mockResolvedValue({ active: false, expiresAt: null });
});

test('an already departed owner does not open a sudo dialog', async () => {
	expect(await ensureSudo(() => false)).toBe(false);
	expect(misskeyApi).not.toHaveBeenCalled();
	expect(popup).not.toHaveBeenCalled();
});

test('an active grant does not open a sudo dialog', async () => {
	vi.mocked(misskeyApi).mockResolvedValue({ active: true, expiresAt: new Date().toISOString() });
	expect(await ensureSudo()).toBe(true);
	expect(popup).not.toHaveBeenCalled();
});

test('closing the sudo dialog settles as canceled and disposes the popup', async () => {
	const pending = ensureSudo();
	await vi.waitFor(() => expect(fixture.events).not.toBeNull());
	fixture.events!.closed();
	expect(await pending).toBe(false);
	expect(fixture.dispose).toHaveBeenCalledOnce();
});

test('abort while the sudo dialog is open settles and ignores a late success', async () => {
	const controller = new AbortController();
	const pending = ensureSudo(() => true, controller.signal);
	await vi.waitFor(() => expect(fixture.events).not.toBeNull());
	controller.abort();
	expect(await pending).toBe(false);
	expect(fixture.dispose).toHaveBeenCalledOnce();
	fixture.events!.done(true);
	expect(fixture.dispose).toHaveBeenCalledOnce();
});

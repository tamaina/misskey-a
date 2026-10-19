/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { beforeEach, expect, test, vi } from 'vitest';
import { ensureSudo } from '../../frontend/utility/ensure-sudo.js';
import { misskeyApi } from '@features/api/frontend/utility/misskey-api.js';
import { popup } from '@features/ui/frontend/os.js';

const fixture = vi.hoisted(() => ({
	actor: { id: 'synthetic-owner', token: 'bs_synthetic' }, dispose: vi.fn(),
	props: null as { isCurrent: () => boolean } | null,
	events: null as { done: (confirmed: boolean) => void; closed: () => void } | null,
}));
vi.mock('@features/auth/frontend/i.js', () => ({ ensureSignin: () => fixture.actor }));
vi.mock('@features/api/frontend/utility/misskey-api.js', () => ({ misskeyApi: vi.fn() }));
vi.mock('@features/ui/frontend/os.js', () => ({ popup: vi.fn((_component: unknown, props: NonNullable<typeof fixture.props>, events: NonNullable<typeof fixture.events>) => {
	fixture.props = props; fixture.events = events; return { dispose: fixture.dispose };
}) }));
beforeEach(() => {
	vi.clearAllMocks(); fixture.actor = { id: 'synthetic-owner', token: 'bs_synthetic' }; fixture.props = null; fixture.events = null;
	vi.mocked(misskeyApi).mockResolvedValue({ active: false, expiresAt: null });
});

test('every operation asks the server; a previous elevation is never cached by the client', async () => {
	vi.mocked(misskeyApi).mockResolvedValue({ active: true, expiresAt: 'synthetic-deadline' });
	expect(await ensureSudo()).toBe(true); expect(await ensureSudo()).toBe(true);
	expect(misskeyApi).toHaveBeenCalledTimes(2); expect(popup).not.toHaveBeenCalled();
});

test('a closed or cancelled confirmation cannot authorize an operation', async () => {
	const pending = ensureSudo(); await vi.waitFor(() => expect(fixture.events).not.toBeNull());
	fixture.events!.closed(); expect(await pending).toBe(false); expect(fixture.dispose).toHaveBeenCalledOnce();
});

test('caller deactivation aborts and disposes the popup before a late success', async () => {
	const controller = new AbortController(); const pending = ensureSudo(() => true, controller.signal);
	await vi.waitFor(() => expect(fixture.events).not.toBeNull());
	controller.abort(); expect(await pending).toBe(false); expect(fixture.dispose).toHaveBeenCalledOnce();
	expect(fixture.props!.isCurrent()).toBe(false);
	fixture.events!.done(true); expect(await pending).toBe(false);
});

test('an actor switch during confirmation cannot elevate the replacement actor', async () => {
	const pending = ensureSudo(); await vi.waitFor(() => expect(fixture.events).not.toBeNull());
	fixture.actor = { id: 'another-owner', token: 'bs_other' };
	expect(fixture.props!.isCurrent()).toBe(false); fixture.events!.done(true);
	expect(await pending).toBe(false);
});

test('a stale actor or cancelled caller discards a delayed server status without opening a popup', async () => {
	let finish!: (value: { active: boolean; expiresAt: null }) => void;
	vi.mocked(misskeyApi).mockReturnValue(new Promise(resolve => { finish = resolve; }));
	const pending = ensureSudo(); fixture.actor = { id: 'another-owner', token: 'bs_other' };
	finish({ active: true, expiresAt: null }); expect(await pending).toBe(false); expect(popup).not.toHaveBeenCalled();
});

test('an already aborted operation sends no status or credential request', async () => {
	const controller = new AbortController(); controller.abort();
	expect(await ensureSudo(() => true, controller.signal)).toBe(false);
	expect(misskeyApi).not.toHaveBeenCalled(); expect(popup).not.toHaveBeenCalled();
});

test('the legacy credential path never creates elevation by reusing the old token', async () => {
	fixture.actor.token = 'legacy-native'; const pending = ensureSudo();
	expect(misskeyApi).not.toHaveBeenCalled(); fixture.events!.closed(); expect(await pending).toBe(false);
});

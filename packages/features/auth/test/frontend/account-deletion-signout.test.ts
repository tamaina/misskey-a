/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Execute the actual SFC's deletion action with synthetic dialogs/API effects only.
const source = readFileSync(resolve(process.cwd(), '../features/preferences/frontend/pages/settings/other.vue'), 'utf8');
const start = source.indexOf('async function deleteAccount() {');
const end = source.indexOf('\nfunction resetAllTips()', start);
if (start < 0 || end < 0) throw new Error('Missing account deletion action');
const action = source.slice(start, end);
const dialogs = { confirm: vi.fn(), authenticateDialog: vi.fn(), apiWithDialog: vi.fn(), alert: vi.fn() };
const signout = vi.fn();
const ensureSudo = vi.fn();
const actor = { id: 'synthetic-owner', token: 'bs_synthetic' };
const deletionState = { deletingAccount: { value: false }, deletionActive: true, deletionGeneration: 0, deletionAbort: null as AbortController | null };
const deleteAccount: () => Promise<void> = runInNewContext(`${action}\ndeleteAccount`, {
	os: dialogs, signout, ensureSudo, $i: actor, AbortController, ...deletionState, $locale: { value: { sfc: { deleteAccountConfirm: 'Synthetic confirmation', started: 'Synthetic started' } } },
});

beforeEach(() => {
	vi.clearAllMocks();
	dialogs.confirm.mockReset().mockResolvedValue({ canceled: false });
	dialogs.authenticateDialog.mockReset().mockResolvedValue({ canceled: false, result: { password: 'synthetic-password', token: '123456' } });
	dialogs.apiWithDialog.mockReset().mockResolvedValue(undefined);
	dialogs.alert.mockReset().mockResolvedValue(undefined);
	signout.mockReset().mockResolvedValue(undefined);
	ensureSudo.mockReset().mockResolvedValue(true);
	actor.id = 'synthetic-owner'; actor.token = 'bs_synthetic';
});

describe('accepted account deletion cleanup contract', () => {
	test('waits for server acceptance and notice before cleanup, then awaits cleanup', async () => {
		let accepted!: () => void;
		dialogs.apiWithDialog.mockReturnValue(new Promise<void>(resolve => { accepted = resolve; }));
		let cleaned!: () => void;
		signout.mockReturnValue(new Promise<void>(resolve => { cleaned = resolve; }));
		let settled = false;
		const deletion = deleteAccount().then(() => { settled = true; });
		await vi.waitFor(() => expect(dialogs.apiWithDialog).toHaveBeenCalledWith('i/security/account/delete', { acknowledged: true }));
		expect(signout).not.toHaveBeenCalled();
		accepted();
		await vi.waitFor(() => expect(signout).toHaveBeenCalledWith('account-deletion-accepted'));
		expect(dialogs.apiWithDialog.mock.invocationCallOrder[0]).toBeLessThan(dialogs.alert.mock.invocationCallOrder[0]);
		expect(dialogs.alert.mock.invocationCallOrder[0]).toBeLessThan(signout.mock.invocationCallOrder[0]);
		expect(settled).toBe(false);
		cleaned();
		await deletion;
		expect(settled).toBe(true);
	});

	test('failed server deletion never invokes cleanup or success notice', async () => {
		dialogs.apiWithDialog.mockRejectedValue(new Error('synthetic deletion failure'));
		await expect(deleteAccount()).rejects.toThrow('synthetic deletion failure');
		expect(signout).not.toHaveBeenCalled();
		expect(dialogs.alert).not.toHaveBeenCalled();
	});

	test.each(['confirm', 'sudo'] as const)('cancelled %s never submits deletion or cleans credentials', async dialog => {
		if (dialog === 'sudo') ensureSudo.mockResolvedValue(false);
		else dialogs.confirm.mockResolvedValue({ canceled: true });
		await deleteAccount();
		expect(dialogs.apiWithDialog).not.toHaveBeenCalled();
		expect(signout).not.toHaveBeenCalled();
	});

	test('an actor switch after server acceptance cannot sign out the replacement actor', async () => {
		let accepted!: () => void;
		dialogs.apiWithDialog.mockReturnValue(new Promise<void>(resolve => { accepted = resolve; }));
		const pending = deleteAccount();
		await vi.waitFor(() => expect(dialogs.apiWithDialog).toHaveBeenCalledOnce());
		actor.id = 'replacement-owner'; actor.token = 'bs_replacement'; accepted();
		await pending;
		expect(signout).not.toHaveBeenCalled(); expect(dialogs.alert).not.toHaveBeenCalled();
	});
});

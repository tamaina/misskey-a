/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { call } from '@orpc/server';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { testContext } from '@features/auth/test/backend/native-context.js';
import { createFukushuRouter } from '../../backend/api.implementation.js';
import { fukushuContract } from '../../backend/material.contract.js';
import { MaterialError } from '../../backend/store.js';
import { material } from './fixture.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { FukushuReminderStore } from '../../backend/reminder-store.js';
import type { FukushuStore } from '../../backend/store.js';
import type { FukushuDriveImporter } from '../../backend/drive-import.js';

function fixture() {
	const store = mockDeep<FukushuStore>();
	const importer = mockDeep<FukushuDriveImporter>();
	const user = mockDeep<MiLocalUser>({ id: 'alice', isSuspended: false, movedToUri: null });
	importer.import.mockResolvedValue(material());
	store.list.mockResolvedValue([material().deck]);
	store.show.mockResolvedValue({ ...material(), revision: 1, archivedAt: null });
	store.update.mockResolvedValue({ revision: 2, archivedAt: null });
	store.archive.mockResolvedValue({ revision: 2, archivedAt: '2026-11-17T00:00:00.000Z' });
	store.updateCardExplanation.mockResolvedValue({ revision: 2, archivedAt: null, version: 2 });
	store.listCardVersions.mockResolvedValue({ currentVersion: 1, versions: [{ version: 1, recordedAt: null, kind: 'baseline' }] });
	store.showCardVersion.mockResolvedValue({ version: 1, recordedAt: null, kind: 'baseline', question: material().questions[0] });
	return { store, importer, user, api: createFukushuRouter(store, importer) };
}

describe('Fukushu import and list authorization', () => {
	test.each([{ permission: [] }, { permission: ['read:drive'] }, { permission: ['write:account'] }, { permission: ['read:account'] }])('requires both import scopes ($permission)', async ({ permission }) => {
		const f = fixture();
		await expect(call(f.api.import, { fileId: 'file1' }, { context: testContext(f.user, { permission }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.importer.import).not.toHaveBeenCalled();
	});
	test('requires login before reading a file', async () => {
		const f = fixture();
		await expect(call(f.api.import, { fileId: 'file1' }, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		expect(f.importer.import).not.toHaveBeenCalled();
	});
	test('allows both scopes or the owner session, never a caller-supplied owner', async () => {
		const f = fixture();
		for (const token of [null, { permission: ['read:drive', 'write:account'] }]) {
			expect(await call(f.api.import, { fileId: 'file1', ownerId: 'bob' } as never, { context: testContext(f.user, token) })).toEqual(material());
		}
		expect(f.importer.import).toHaveBeenCalledTimes(2);
		expect(f.importer.import).toHaveBeenCalledWith('alice', 'file1');
	});
	test('maps unavailable files and duplicate imports to documented errors', async () => {
		const f = fixture();
		for (const code of ['NO_SUCH_FILE', 'MATERIAL_EXISTS', 'IMPORT_FAILED'] as const) {
			f.importer.import.mockRejectedValueOnce(new MaterialError(code));
			await expect(call(f.api.import, { fileId: 'file1' }, { context: testContext(f.user) })).rejects.toMatchObject({ code });
		}
	});
	test('list requires read:account and only selects the authenticated owner', async () => {
		const f = fixture();
		await expect(call(f.api.list, {}, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.list, {}, { context: testContext(f.user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.store.list).not.toHaveBeenCalled();
		expect(await call(f.api.list, { ownerId: 'bob' } as never, { context: testContext(f.user, { permission: ['read:account'] }) })).toEqual([material().deck]);
		expect(f.store.list).toHaveBeenCalledWith('alice', { archived: false });
	});
});

test('preserves each literal request name for native SDK response inference', () => {
	expectTypeOf(fukushuContract.list['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/list'>();
	expectTypeOf(fukushuContract.import['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/import'>();
	expectTypeOf(fukushuContract.show['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/show'>();
	expectTypeOf(fukushuContract.update['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/update'>();
	expectTypeOf(fukushuContract.archive['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/archive'>();
	expectTypeOf(fukushuContract.create['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/create'>();
	expectTypeOf(fukushuContract.updateCardExplanation['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/update-card-explanation'>();
	expectTypeOf(fukushuContract.listCardVersions['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/card-versions'>();
	expectTypeOf(fukushuContract.showCardVersion['~orpc'].meta.requestName).toEqualTypeOf<'fukushu/materials/card-version'>();
});

describe('Fukushu metadata and archive authorization', () => {
	test('requires write:account and derives the owner from the principal', async () => {
		const f = fixture();
		const update = { id: 'deck-original', expectedRevision: 1, name: 'renamed', description: 'description' };
		const archive = { id: 'deck-original', expectedRevision: 1, archived: true };
		await expect(call(f.api.update, update, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.archive, archive, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.update, update, { context: testContext(f.user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		await expect(call(f.api.archive, archive, { context: testContext(f.user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.store.update).not.toHaveBeenCalled();
		expect(f.store.archive).not.toHaveBeenCalled();
		await call(f.api.update, { ...update, ownerId: 'bob' } as never, { context: testContext(f.user, { permission: ['write:account'] }) });
		await call(f.api.archive, { ...archive, ownerId: 'bob' } as never, { context: testContext(f.user) });
		expect(f.store.update).toHaveBeenCalledWith('alice', update.id, 1, 'renamed', 'description');
		expect(f.store.archive).toHaveBeenCalledWith('alice', archive.id, 1, true);
	});
	test('exposes concurrency state separately and selects the archived owner list explicitly', async () => {
		const f = fixture();
		expect(await call(f.api.show, { id: 'deck-original' }, { context: testContext(f.user) })).toEqual({ ...material(), revision: 1, archivedAt: null });
		await call(f.api.list, { archived: true }, { context: testContext(f.user) });
		expect(f.store.list).toHaveBeenCalledWith('alice', { archived: true });
	});
	test('maps stale revisions and missing materials without exposing storage details', async () => {
		const f = fixture();
		for (const code of ['MATERIAL_CONFLICT', 'NO_SUCH_MATERIAL', 'INVALID_MATERIAL'] as const) {
			f.store.update.mockRejectedValueOnce(new MaterialError(code));
			await expect(call(f.api.update, { id: 'deck-original', expectedRevision: 1, name: 'name' }, { context: testContext(f.user) })).rejects.toMatchObject({ code });
		}
	});
	test.each([0, -1, 1.5, 2_147_483_648])('rejects an invalid expected revision %s before storage', async expectedRevision => {
		const f = fixture();
		await expect(call(f.api.archive, { id: 'deck-original', expectedRevision, archived: false }, { context: testContext(f.user) })).rejects.toThrow();
		expect(f.store.archive).not.toHaveBeenCalled();
	});
});

describe('Fukushu explanation-only versions authorization and input boundary', () => {
	const ids = { id: material().deck.id, questionId: material().questions[0].id };
	const update = { ...ids, expectedRevision: 1, explanation: 'Additional context' };

	test('authenticates before storage and separates account read/write scopes', async () => {
		const f = fixture();
		await expect(call(f.api.updateCardExplanation, update, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.listCardVersions, ids, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.showCardVersion, { ...ids, version: 1 }, { context: testContext(null) })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
		await expect(call(f.api.updateCardExplanation, update, { context: testContext(f.user, { permission: ['read:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		await expect(call(f.api.listCardVersions, ids, { context: testContext(f.user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		await expect(call(f.api.showCardVersion, { ...ids, version: 1 }, { context: testContext(f.user, { permission: ['write:account'] }) })).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
		expect(f.store.updateCardExplanation).not.toHaveBeenCalled();
		expect(f.store.listCardVersions).not.toHaveBeenCalled();
		expect(f.store.showCardVersion).not.toHaveBeenCalled();
	});

	test('routes only explanation and authenticated owner; unsupported mutations cannot reach storage', async () => {
		const f = fixture();
		const input = { ...update, ownerId: 'bob', prompt: 'Changed question', answer: 'Changed answer', sourceKey: 'changed', typeAnswer: true, acceptedAnswer: 'changed' };
		for (const token of [null, { permission: ['write:account'] }]) {
			expect(await call(f.api.updateCardExplanation, input, { context: testContext(f.user, token) })).toEqual({ revision: 2, archivedAt: null, version: 2 });
		}
		expect(f.store.updateCardExplanation).toHaveBeenCalledTimes(2);
		expect(f.store.updateCardExplanation).toHaveBeenLastCalledWith('alice', ids.id, ids.questionId, 1, 'Additional context');
		await call(f.api.updateCardExplanation, { ...update, explanation: null }, { context: testContext(f.user) });
		expect(f.store.updateCardExplanation).toHaveBeenLastCalledWith('alice', ids.id, ids.questionId, 1, null);
	});

	test('returns owner-only baseline records and applies pagination defaults', async () => {
		const f = fixture();
		const context = testContext(f.user, { permission: ['read:account'] });
		expect(await call(f.api.listCardVersions, { ...ids, ownerId: 'bob' } as never, { context })).toEqual({ currentVersion: 1, versions: [{ version: 1, recordedAt: null, kind: 'baseline' }] });
		expect(f.store.listCardVersions).toHaveBeenLastCalledWith('alice', ids.id, ids.questionId, { before: undefined, limit: 20 });
		await call(f.api.listCardVersions, { ...ids, before: 3, limit: 1 }, { context });
		expect(f.store.listCardVersions).toHaveBeenLastCalledWith('alice', ids.id, ids.questionId, { before: 3, limit: 1 });
		expect(await call(f.api.showCardVersion, { ...ids, version: 1, ownerId: 'bob' } as never, { context })).toEqual({ version: 1, recordedAt: null, kind: 'baseline', question: material().questions[0] });
		expect(f.store.showCardVersion).toHaveBeenLastCalledWith('alice', ids.id, ids.questionId, 1);
	});

	test.each([
		{ label: 'missing', explanation: undefined },
		{ label: 'number', explanation: 42 },
		{ label: 'object', explanation: { format: 'plain', value: 'text' } },
		{ label: 'too long', explanation: 'x'.repeat(16_385) },
		{ label: 'NUL', explanation: 'before\0after' },
		{ label: 'unpaired high surrogate', explanation: '\uD800' },
		{ label: 'unpaired low surrogate', explanation: '\uDC00' },
	])('rejects $label explanation before calling storage', async ({ explanation }) => {
		const f = fixture();
		await expect(call(f.api.updateCardExplanation, { ...update, explanation } as never, { context: testContext(f.user) })).rejects.toThrow();
		expect(f.store.updateCardExplanation).not.toHaveBeenCalled();
	});

	test('accepts empty, maximum-length and Unicode plain explanations without changing their text', async () => {
		const f = fixture();
		for (const explanation of ['', 'x'.repeat(16_384), '日本語\n😀 <b>plain text</b>']) {
			await call(f.api.updateCardExplanation, { ...update, explanation }, { context: testContext(f.user) });
			expect(f.store.updateCardExplanation).toHaveBeenLastCalledWith('alice', ids.id, ids.questionId, 1, explanation);
		}
	});

	test.each([0, -1, 1.5, 2_147_483_648])('rejects invalid revision, cursor and version %s before storage', async invalid => {
		const f = fixture();
		const context = testContext(f.user);
		await expect(call(f.api.updateCardExplanation, { ...update, expectedRevision: invalid }, { context })).rejects.toThrow();
		await expect(call(f.api.listCardVersions, { ...ids, before: invalid }, { context })).rejects.toThrow();
		await expect(call(f.api.showCardVersion, { ...ids, version: invalid }, { context })).rejects.toThrow();
		expect(f.store.updateCardExplanation).not.toHaveBeenCalled();
		expect(f.store.listCardVersions).not.toHaveBeenCalled();
		expect(f.store.showCardVersion).not.toHaveBeenCalled();
	});

	test.each([0, -1, 1.5, 21])('rejects page size %s before storage', async limit => {
		const f = fixture();
		await expect(call(f.api.listCardVersions, { ...ids, limit }, { context: testContext(f.user) })).rejects.toThrow();
		expect(f.store.listCardVersions).not.toHaveBeenCalled();
	});

	test.each(['id', 'questionId'] as const)('rejects invalid %s identities before storage', async key => {
		const f = fixture();
		for (const value of ['', 'x'.repeat(257), '\0', '\uD800']) {
			const invalid = { ...ids, [key]: value };
			await expect(call(f.api.updateCardExplanation, { ...update, ...invalid }, { context: testContext(f.user) })).rejects.toThrow();
			await expect(call(f.api.listCardVersions, invalid, { context: testContext(f.user) })).rejects.toThrow();
			await expect(call(f.api.showCardVersion, { ...invalid, version: 1 }, { context: testContext(f.user) })).rejects.toThrow();
		}
		expect(f.store.updateCardExplanation).not.toHaveBeenCalled();
		expect(f.store.listCardVersions).not.toHaveBeenCalled();
		expect(f.store.showCardVersion).not.toHaveBeenCalled();
	});

	test('maps stale, capacity and ownership failures without replacing them with generic errors', async () => {
		const f = fixture();
		for (const [code, status] of [['MATERIAL_CONFLICT', 409], ['CARD_HISTORY_LIMIT', 400], ['NO_SUCH_MATERIAL', 404], ['INVALID_MATERIAL', 400]] as const) {
			f.store.updateCardExplanation.mockRejectedValueOnce(new MaterialError(code));
			await expect(call(f.api.updateCardExplanation, update, { context: testContext(f.user) })).rejects.toMatchObject({ code, status });
		}
		f.store.listCardVersions.mockRejectedValueOnce(new MaterialError('NO_SUCH_MATERIAL'));
		f.store.showCardVersion.mockRejectedValueOnce(new MaterialError('NO_SUCH_MATERIAL'));
		await expect(call(f.api.listCardVersions, ids, { context: testContext(f.user) })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL' });
		await expect(call(f.api.showCardVersion, { ...ids, version: 1 }, { context: testContext(f.user) })).rejects.toMatchObject({ code: 'NO_SUCH_MATERIAL' });
	});

	test('keeps the established read/write permissions and endpoint rate budgets', () => {
		expect(fukushuContract.updateCardExplanation['~orpc'].meta).toMatchObject({ requireCredential: true, kind: 'write:account', limit: { duration: 60_000, max: 5 } });
		for (const contract of [fukushuContract.listCardVersions, fukushuContract.showCardVersion]) {
			expect(contract['~orpc'].meta).toMatchObject({ requireCredential: true, kind: 'read:account', limit: { duration: 60_000, max: 60 } });
		}
	});
});

test('only the owner session can read or change a reminder, including disabling it', async () => {
	const f = fixture();
	const reminders = mockDeep<FukushuReminderStore>();
	const api = createFukushuRouter(f.store, undefined, undefined, undefined, undefined, reminders);
	const schedule = { localTime: '08:15', zone: 'Europe/London' };
	for (const context of [testContext(null), testContext(f.user, { permission: ['read:account', 'write:account'] })]) {
		await expect(call(api.reminderShow, {}, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
		await expect(call(api.reminderUpdate, { schedule }, { context })).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
	}
	expect(reminders.configure).not.toHaveBeenCalled();
	expect(reminders.settings).not.toHaveBeenCalled();
	const context = testContext(f.user);
	reminders.settings.mockResolvedValue(schedule);
	expect(await call(api.reminderShow, { ownerId: 'bob' } as never, { context })).toEqual({ schedule });
	expect(reminders.settings).toHaveBeenCalledWith('alice');
	await call(api.reminderUpdate, { schedule, ownerId: 'bob' } as never, { context });
	await call(api.reminderUpdate, { schedule: null }, { context });
	expect(reminders.configure.mock.calls).toEqual([['alice', schedule], ['alice', null]]);
});

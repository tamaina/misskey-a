/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test, vi } from 'vitest';
import { mock, mockDeep } from 'vitest-mock-extended';
import * as v from 'valibot';
import { createProcedureClient } from '@orpc/server';
import { NoteCreateService } from '../../backend/services/NoteCreateService.js';
import { RoleService, DEFAULT_POLICIES } from '@features/roles/backend/services/RoleService.js';
import type { RolePolicies } from '@features/roles/backend/services/RoleService.js';
import { MiRole } from '@features/roles/backend/models/Role.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiNote } from '../../backend/models/Note.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
import { packedRolePoliciesSchema as notificationRolePoliciesSchema } from '@features/notifications/backend/notification-related.schema.js';
import { rolePoliciesSchema as metaRolePoliciesSchema } from '@features/instance/backend/endpoints/meta.schema.js';
import { packedRolePoliciesSchema } from '@features/users/backend/user-related.schema.js';
import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
import type { MeDetailedWireInput } from '@features/users/backend/user.schema.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { createNotesCreateProcedure } from '../../backend/endpoints/notes/create.js';
import { notesCreateContract, notesCreateErrors } from '../../backend/endpoints/notes/create.contract.js';

function setFixture(target: object, values: Record<string, unknown>) {
	Object.defineProperties(target, Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value, configurable: true, writable: true }])));
}

const user = { id: 'author1', username: 'author', host: null, isBot: false, isCat: false };
const insertBoundary = new Error('insert boundary');
type Draft = Parameters<NoteCreateService['create']>[1];

function fixture(policies: Partial<RolePolicies> = {}) {
	// Exercise the actual creation method, stopping before database/queue/federation side effects.
	const service = Object.create(NoteCreateService.prototype) as NoteCreateService;
	const getUserPolicies = vi.fn().mockResolvedValue({ ...DEFAULT_POLICIES, ...policies });
	const insertNote = vi.fn().mockRejectedValue(insertBoundary);
	setFixture(service, {
		roleService: { getUserPolicies }, meta: { sensitiveWords: [], prohibitedWords: [], silencedHosts: [], mediaSilencedHosts: [] },
		utilityService: { concatNoteContentsForKeyWordCheck: () => 'hello', isKeyWordIncluded: () => false, isSilencedHost: () => false, isMediaSilencedHost: () => false },
		userEntityService: { isRemoteUser: (u: { host: string | null }) => u.host != null },
		userBlockingService: { checkBlocked: async () => false },
		usersRepository: { findOneByOrFail: async ({ id }: { id: string }) => ({ id, host: null, username: 'local', uri: null }) }, insertNote,
	});
	const draft = (data: Draft = {}): Draft => ({ text: 'hello', apMentions: [], apHashtags: [], apEmojis: [], ...data });
	return { service, getUserPolicies, insertNote, draft };
}

const target = mockDeep<MiNote>({ id: 'target1', userId: user.id, userHost: null, visibility: 'public', localOnly: false, channelId: null });
test.each([['note', {}], ['reply', { reply: target }], ['quote', { renote: target }], ['renote', { renote: target, text: null }]] satisfies [string, Draft][])(
	'canNote=false rejects %s before insertion', async (_kind, data) => {
		const f = fixture({ canNote: false });
		await expect(f.service.create(user, f.draft(data))).rejects.toMatchObject({ id: 'ebd9b2a9-4d95-4b01-8824-e701629b65e7' });
		expect(f.insertNote).not.toHaveBeenCalled(); expect(f.getUserPolicies).toHaveBeenCalledWith(user.id, true);
	});
test.each([
	['renoteOnly', null, null], ['renoteOnly', 'quote', '3a97010b-c338-4cdf-a567-24c54b67726e'],
	['disallow', null, 'd35d80dc-02ba-4c9b-b9b8-905d306dcb67'], ['disallow', 'quote', '3a97010b-c338-4cdf-a567-24c54b67726e'], ['allow', 'quote', null],
] as const)('renotePolicy=%s handles text=%s', async (renotePolicy, text, errorId) => {
	const f = fixture({ renotePolicy }); const result = f.service.create(user, f.draft({ renote: target, text }));
	if (errorId) await expect(result).rejects.toMatchObject({ id: errorId }); else await expect(result).rejects.toBe(insertBoundary);
});
test.each([0, 1, 16])('attachment limit %i accepts boundary and rejects next attachment', async limit => {
	const f = fixture({ noteFilesLimit: limit }); const files = Array.from({ length: limit }, () => mockDeep<MiDriveFile>());
	await expect(f.service.create(user, f.draft({ files }))).rejects.toBe(insertBoundary);
	await expect(f.service.create(user, f.draft({ files: [...files, mockDeep<MiDriveFile>()] }))).rejects.toMatchObject({ id: '80dc1304-d910-4daa-b26f-4220b6c944ff' });
});
test('specified notes reject disallowed visibility and remote recipients', async () => {
	const denied = fixture({ canCreateSpecifiedNote: false });
	await expect(denied.service.create(user, denied.draft({ visibility: 'specified', visibleUsers: [] }))).rejects.toMatchObject({ id: '80d26afb-d466-4d86-9c01-11b9cad9da24' });
	const local = fixture({ canFederateNote: false });
	await expect(local.service.create(user, local.draft({ visibility: 'specified', visibleUsers: [{ id: 'remote1', host: 'remote.test', username: 'remote', uri: null }] }))).rejects.toMatchObject({ id: '5bbfae8d-097c-4c58-93f4-bc242d600529' });
});
test.each([false, true])('ordinary renotes honor federation policy %s', async canFederateNote => {
	const f = fixture({ canFederateNote }); const data = f.draft({ text: null, renote: target, localOnly: false });
	await expect(f.service.create(user, data)).rejects.toBe(insertBoundary); expect(data.localOnly).toBe(!canFederateNote);
});
test('local specified recipients plus remote mention stay local when federation is denied', async () => {
	const f = fixture({ canFederateNote: false });
	const data = f.draft({ visibility: 'specified', visibleUsers: [{ ...user, uri: null }], apMentions: [{ id: 'remote1', host: 'remote.test', username: 'remote', uri: null }] });
	await expect(f.service.create(user, data)).rejects.toBe(insertBoundary); expect(data.localOnly).toBe(true);
});
test('creation re-evaluates policies after a scheduled draft was saved', async () => {
	const f = fixture(); await expect(f.service.create(user, f.draft())).rejects.toBe(insertBoundary);
	f.getUserPolicies.mockResolvedValueOnce({ ...DEFAULT_POLICIES, canNote: false });
	await expect(f.service.create(user, f.draft({ createdAt: new Date() }))).rejects.toMatchObject({ id: 'ebd9b2a9-4d95-4b01-8824-e701629b65e7' });
	expect(f.getUserPolicies.mock.calls).toEqual([[user.id, true], [user.id, true]]);
});
test('role priority, assign/remove and attachment clamp use the real aggregator', async () => {
	const roles: MiRole[] = []; const service = Object.create(RoleService.prototype) as RoleService;
	setFixture(service, { meta: { policies: {} }, config: { maxFileSize: 32 * 1024 * 1024 }, getUserRoles: vi.fn(async () => roles) });
	expect((await service.getUserPolicies(user.id, true)).canNote).toBe(true);
	roles.push(Object.assign(new MiRole(), { policies: { canNote: { priority: 1, useDefault: false, value: false }, renotePolicy: { priority: 1, useDefault: false, value: 'disallow' }, noteFilesLimit: { priority: 1, useDefault: false, value: -10 } } }));
	expect(await service.getUserPolicies(user.id, true)).toMatchObject({ canNote: false, renotePolicy: 'disallow', noteFilesLimit: 0 });
	roles.push(Object.assign(new MiRole(), { policies: { canNote: { priority: 2, useDefault: false, value: true }, renotePolicy: { priority: 1, useDefault: false, value: 'renoteOnly' }, noteFilesLimit: { priority: 1, useDefault: false, value: 99 } } }));
	expect(await service.getUserPolicies(user.id, true)).toMatchObject({ canNote: true, renotePolicy: 'renoteOnly', noteFilesLimit: 16 });
	roles.splice(0); expect(await service.getUserPolicies(user.id, true)).toMatchObject({ canNote: true, renotePolicy: 'allow', noteFilesLimit: 16 });
});
test('all five fields survive /i projection and strict output schema', () => {
	const me = mock<MeDetailedWireInput>();
	Object.assign(me, { policies: { ...DEFAULT_POLICIES, canNote: false, renotePolicy: 'renoteOnly', canCreateSpecifiedNote: false, canFederateNote: false, noteFilesLimit: 0 }, emojis: {}, achievements: [], pinnedPage: null, badgeRoles: [], roles: [], fields: [], verifiedLinks: [], avatarDecorations: [], pinnedNoteIds: [], pinnedNotes: [], alsoKnownAs: [], unreadAnnouncements: [], mutedWords: [], hardMutedWords: [], mutedInstances: [], mutingNotificationTypes: [], notificationRecieveConfig: {}, emailNotificationTypes: [], securityKeysList: [] });
	const policies = toPackedUserDetailed(me).policies;
	expect(policies).toMatchObject({ canNote: false, renotePolicy: 'renoteOnly', canCreateSpecifiedNote: false, canFederateNote: false, noteFilesLimit: 0 }); for (const schema of [packedRolePoliciesSchema, notificationRolePoliciesSchema, metaRolePoliciesSchema]) expect(v.safeParse(schema, policies).success).toBe(true);
	for (const noteFilesLimit of [-1, 17, 0.5]) expect(v.safeParse(packedRolePoliciesSchema, { ...policies, noteFilesLimit }).success).toBe(false);
});
const errors = [
	['ebd9b2a9-4d95-4b01-8824-e701629b65e7', notesCreateErrors.cannotCreateNote], ['80dc1304-d910-4daa-b26f-4220b6c944ff', notesCreateErrors.tooManyFilesAttachedToNote],
	['d35d80dc-02ba-4c9b-b9b8-905d306dcb67', notesCreateErrors.renoteForbidden], ['3a97010b-c338-4cdf-a567-24c54b67726e', notesCreateErrors.quoteForbidden],
	['80d26afb-d466-4d86-9c01-11b9cad9da24', notesCreateErrors.directNoteCreationForbidden], ['5bbfae8d-097c-4c58-93f4-bc242d600529', notesCreateErrors.remoteDirectNoteCreationForbidden],
] as const;

function context(actor: MiLocalUser | null): ApiContext<MiLocalUser> {
	return { credential: actor ? 'synthetic' : null, ip: '127.0.0.1', headers: {}, services: { authenticate: async () => [actor, null], limitActor: () => null, rateLimitFactor: async () => 1, limit: async () => null } };
}

test.each(errors)('service error %s maps to public contract error', async (id, error) => {
	const deps = mockDeep<Parameters<typeof createNotesCreateProcedure>[0]>(); deps.noteCreateService.fetchAndCreate.mockRejectedValue(new IdentifiableError(id, 'synthetic'));
	const client = createProcedureClient(createNotesCreateProcedure(deps), { context: context(mockDeep<MiLocalUser>({ id: user.id, isSuspended: false, movedToUri: null })) });
	await expect(client({ text: 'hello' })).rejects.toMatchObject({ code: error.code, data: { id: error.id } }); expect(notesCreateContract['~orpc'].errorMap).toHaveProperty(error.code);
});
test('suspended principal rejects before creating notes', async () => {
	const deps = mockDeep<Parameters<typeof createNotesCreateProcedure>[0]>();
	const client = createProcedureClient(createNotesCreateProcedure(deps), { context: context(mockDeep<MiLocalUser>({ id: user.id, isSuspended: true, movedToUri: null })) });
	await expect(client({ text: 'hello' })).rejects.toMatchObject({ code: 'YOUR_ACCOUNT_SUSPENDED' }); expect(deps.noteCreateService.fetchAndCreate).not.toHaveBeenCalled();
});

test.each([[0.5, 0], [16.9, 16], [-1, 0], [Infinity, 0], [NaN, 0], ['bad', 0], [null, 0]] as const)('attachment limit %s normalizes to wire integer %i for base and user policies', async (value, expected) => {
	const service = Object.create(RoleService.prototype) as RoleService;
	setFixture(service, { meta: { policies: { noteFilesLimit: value } }, config: { maxFileSize: 32 * 1024 * 1024 }, getUserRoles: async () => [] });
	for (const actor of [null, user.id]) {
		const policies = await service.getUserPolicies(actor, true);
		expect(policies.noteFilesLimit).toBe(expected);
		for (const schema of [packedRolePoliciesSchema, notificationRolePoliciesSchema, metaRolePoliciesSchema]) expect(v.safeParse(schema, policies).success).toBe(true);
	}
});

test('actual role assign/unassign changes fresh posting policies even with stale assignment cache', async () => {
	const role = Object.assign(new MiRole(), { id: 'postingrole1', target: 'manual', isPublic: false, policies: { canNote: { priority: 1, useDefault: false, value: false } } });
	type Assignment = { id: string; roleId: string; userId: string; expiresAt: Date | null };
	const assignments: Assignment[] = [];
	const service = Object.create(RoleService.prototype) as RoleService;
	setFixture(service, {
		meta: { policies: {} }, config: { maxFileSize: 32 * 1024 * 1024 },
		rolesRepository: { findBy: async () => [role], findOneByOrFail: async () => role, update: async () => {} },
		roleAssignmentsRepository: {
			findBy: async () => [...assignments],
			findOneBy: async ({ roleId, userId }: { roleId: string; userId: string }) => assignments.find(row => row.roleId === roleId && row.userId === userId) ?? null,
			insertOne: async (row: Assignment) => { assignments.push(row); return row; },
			delete: async (id: string) => { const index = assignments.findIndex(row => row.id === id); if (index >= 0) assignments.splice(index, 1); },
		},
		rolesCache: { fetch: async () => [role] }, roleAssignmentByUserIdCache: { fetch: async () => [] },
		idService: { gen: () => 'assignment1' }, globalEventService: { publishInternalEvent: vi.fn() },
		usersRepository: { findOneByOrFail: async () => user },
	});
	expect((await service.getUserPolicies(user.id)).canNote).toBe(true);
	await service.assign(user.id, role.id);
	expect((await service.getUserPolicies(user.id)).canNote).toBe(true);
	expect((await service.getUserPolicies(user.id, true)).canNote).toBe(false);
	await service.unassign(user.id, role.id);
	expect((await service.getUserPolicies(user.id, true)).canNote).toBe(true);
});

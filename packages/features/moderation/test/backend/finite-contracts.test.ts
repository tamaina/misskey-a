/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { moderationContract } from '../../backend/api.contract.js';
import { createModerationOperations, type ModerationApiDependencies } from '../../backend/api.operations.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
import type { MiSignin } from '../../../auth/backend/models/Signin.js';
import type { RolePolicies } from '../../../roles/backend/services/RoleService.js';
import type { MiUser, MiLocalUser } from '../../../users/backend/models/User.js';
import type { MiUserProfile } from '../../../users/backend/models/UserProfile.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S {
	if (schema === undefined) throw new Error('Missing native schema');
	return schema;
}

const actor: ApiActor = { id: 'actor123', isSuspended: false, movedToUri: null };

test('native moderation schemas materialize defaults and preserve nullable report resolution', () => {
	expect(v.parse(requiredSchema(moderationContract.adminAbuseUserReports['~orpc'].inputSchema), { future: true }))
		.toEqual({ limit: 10, state: null, reporterOrigin: 'combined', targetUserOrigin: 'combined' });
	expect(v.parse(requiredSchema(moderationContract.adminResolveAbuseUserReport['~orpc'].inputSchema), { reportId: 'report123', resolvedAs: null, future: true }))
		.toEqual({ reportId: 'report123', resolvedAs: null });
	expect(v.safeParse(requiredSchema(moderationContract.adminGetUserIps['~orpc'].inputSchema), { userId: 'bad-id' }).success).toBe(false);
});

test('IP records preserve selected dates and the response envelope rejects undeclared fields', async () => {
	const deps = mockDeep<ModerationApiDependencies<ApiActor>>();
	const date = new Date('2026-10-09T00:00:00Z');
	deps.userIpsRepository.find.mockResolvedValue([{ id: 'ip123', userId: 'user123', ip: '127.0.0.1', createdAt: date }]);
	const result = await createModerationOperations(deps).adminGetUserIps({ userId: 'user123' }, actor);
	expect(v.parse(requiredSchema(moderationContract.adminGetUserIps['~orpc'].outputSchema), result)).toEqual([{ ip: '127.0.0.1', createdAt: date.toISOString() }]);
	expect(deps.userIpsRepository.find).toHaveBeenCalledWith({ where: { userId: 'user123' }, order: { id: 'DESC' }, take: 30 });
	expect(v.safeParse(requiredSchema(moderationContract.adminGetUserIps['~orpc'].outputSchema), [{ ...result[0], future: true }]).success).toBe(false);
});

test('email recipients require a verified email before writes; webhook recipients require their correlated ID', async () => {
	const deps = mockDeep<ModerationApiDependencies<ApiActor>>();
	const operations = createModerationOperations(deps);
	deps.userProfilesRepository.findOneBy.mockResolvedValue(null);
	await expect(operations.adminAbuseReportNotificationRecipientCreate({ isActive: true, name: 'Recipient', method: 'email' }, actor))
		.rejects.toMatchObject({ code: 'CORRELATION_CHECK_EMAIL' });
	deps.userProfilesRepository.findOneBy.mockResolvedValue(mockDeep<MiUserProfile>({ email: 'user@example.test', emailVerified: false }));
	await expect(operations.adminAbuseReportNotificationRecipientCreate({ isActive: true, name: 'Recipient', method: 'email', userId: 'user123' }, actor))
		.rejects.toMatchObject({ code: 'EMAIL_ADDRESS_NOT_SET' });
	await expect(operations.adminAbuseReportNotificationRecipientUpdate({ id: 'recipient123', isActive: true, name: 'Recipient', method: 'webhook' }, actor))
		.rejects.toMatchObject({ code: 'CORRELATION_CHECK_WEBHOOK' });
	expect(deps.abuseReportNotificationService.createRecipient).not.toHaveBeenCalled();
	expect(deps.abuseReportNotificationService.updateRecipient).not.toHaveBeenCalled();
});

test('moderator targets cannot be suspended and non-administrators cannot inspect an administrator profile', async () => {
	const deps = mockDeep<ModerationApiDependencies<ApiActor>>();
	const target = mockDeep<MiUser>({ id: 'user123' });
	deps.usersRepository.findOneBy.mockResolvedValue(target);
	deps.roleService.isModerator.mockResolvedValue(true);
	const operations = createModerationOperations(deps);
	await expect(operations.adminSuspendUser({ userId: target.id }, actor)).rejects.toThrow('cannot suspend moderator account');
	expect(deps.userSuspendService.suspend).not.toHaveBeenCalled();
	deps.userProfilesRepository.findOneBy.mockResolvedValue(mockDeep<MiUserProfile>());
	deps.roleService.getUserPolicies.mockResolvedValue(mockDeep<RolePolicies>({ canPublicNote: true }));
	deps.usersRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiUser>({ id: actor.id }));
	deps.roleService.isAdministrator.mockImplementation(async user => user?.id === target.id);
	await expect(operations.adminShowUser({ userId: target.id }, actor)).rejects.toThrow('cannot show info of admin');
	expect(deps.signinsRepository.findBy).not.toHaveBeenCalled();
});

test('reporting yourself or an administrator never submits a report; missing reports keep their original error', async () => {
	const deps = mockDeep<ModerationApiDependencies<ApiActor>>();
	const operations = createModerationOperations(deps);
	deps.getterService.getUser.mockResolvedValue(mockDeep<MiLocalUser>({ id: actor.id }));
	await expect(operations.usersReportAbuse({ userId: actor.id, comment: 'report' }, actor)).rejects.toMatchObject({ code: 'CANNOT_REPORT_YOURSELF' });
	deps.getterService.getUser.mockResolvedValue(mockDeep<MiLocalUser>({ id: 'user123' }));
	deps.roleService.isAdministrator.mockResolvedValue(true);
	await expect(operations.usersReportAbuse({ userId: 'user123', comment: 'report' }, actor)).rejects.toMatchObject({ code: 'CANNOT_REPORT_THE_ADMIN' });
	expect(deps.abuseReportService.report).not.toHaveBeenCalled();
	deps.abuseUserReportsRepository.findOneBy.mockResolvedValue(null);
	await expect(operations.adminResolveAbuseUserReport({ reportId: 'report123' }, actor))
		.rejects.toMatchObject({ code: 'NO_SUCH_ABUSE_REPORT', data: { id: 'ac3794dd-2ce4-d878-e546-73c60c06b398' } });
});

test('unsetting an absent avatar is a no-op; its audit write remains asynchronous after the primary update', async () => {
	const deps = mockDeep<ModerationApiDependencies<ApiActor>>();
	const operations = createModerationOperations(deps);
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<MiUser>({ id: 'user123', avatarId: null }));
	await operations.adminUnsetUserAvatar({ userId: 'user123' }, actor);
	expect(deps.usersRepository.update).not.toHaveBeenCalled();
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<MiUser>({ id: 'user123', username: 'alice', host: null, avatarId: 'file123' }));
	let release: () => void = () => {};
	const pending = new Promise<void>(resolve => { release = resolve; });
	deps.moderationLogService.log.mockReturnValue(pending);
	try {
		const completion = operations.adminUnsetUserAvatar({ userId: 'user123' }, actor).then(() => 'completed');
		expect(await Promise.race([completion, new Promise<string>(resolve => setImmediate(() => resolve('pending')))]))
			.toBe('completed');
		expect(deps.usersRepository.update).toHaveBeenCalledWith('user123', { avatar: null, avatarId: null, avatarUrl: null, avatarBlurhash: null });
		expect(deps.moderationLogService.log).toHaveBeenCalledWith(actor, 'unsetUserAvatar', { userId: 'user123', userUsername: 'alice', userHost: null, fileId: 'file123' });
	} finally { release(); }
});

test('admin account details preserve actual raw signin wire fields without inventing a createdAt field', async () => {
	const deps = mockDeep<ModerationApiDependencies<ApiActor>>();
	deps.usersRepository.findOneBy.mockResolvedValue(mockDeep<MiUser>({ id: 'user123' }));
	deps.usersRepository.findOneByOrFail.mockResolvedValue(mockDeep<MiUser>({ id: actor.id }));
	deps.userProfilesRepository.findOneBy.mockResolvedValue(mockDeep<MiUserProfile>());
	deps.roleService.isAdministrator.mockResolvedValue(true);
	deps.roleService.getUserPolicies.mockResolvedValue(mockDeep<RolePolicies>({ canPublicNote: true }));
	deps.roleService.getUserAssigns.mockResolvedValue([]);
	deps.roleService.getUserRoles.mockResolvedValue([]);
	deps.roleEntityService.packMany.mockResolvedValue([]);
	deps.signinsRepository.findBy.mockResolvedValue([mockDeep<MiSignin>({ id: 'signin123', userId: 'user123', ip: '127.0.0.1', headers: { 'user-agent': 'fixture' }, success: false })]);
	const result = await createModerationOperations(deps).adminShowUser({ userId: 'user123' }, actor);
	expect(v.parse(requiredSchema(moderationContract.adminShowUser['~orpc'].outputSchema).entries.signins, result.signins)).toEqual([
		{ id: 'signin123', userId: 'user123', ip: '127.0.0.1', headers: { 'user-agent': 'fixture' }, success: false },
	]);
	expect(result.signins[0]).not.toHaveProperty('createdAt');
});

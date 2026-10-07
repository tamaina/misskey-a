/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { packedAbuseReportNotificationRecipientSchema } from '../../contract/packed.js';
import { inlineAdminGetUserIpsInput, inlineAdminGetUserIpsOutput, inlineAdminGetUserIpsDefinition } from '../../contract/endpoint-definitions.js';
import { packedAdminAbuseUserReportsInput, packedAdminAbuseUserReportsOutput, packedAdminShowModerationLogsInput, packedAdminShowModerationLogsOutput, packedAdminAbuseReportNotificationRecipientCreateInput } from '../../contract/packed-endpoint-definitions.js';
import { moderationCommandInputs } from '../../contract/index.js';
import { adminShowUserOutput } from '../../contract/admin-user-endpoint-definition.js';
import { AbuseReportNotificationRecipientEntityService } from '../../backend/serializers/AbuseReportNotificationRecipientEntityService.js';
import { AbuseUserReportEntityService } from '../../backend/serializers/AbuseUserReportEntityService.js';
import { ModerationLogEntityService } from '../../backend/serializers/ModerationLogEntityService.js';
import { EndpointImplementation as IpsEndpoint } from '../../backend/endpoints/admin/get-user-ips.js';
import type { MiAbuseReportNotificationRecipient, UserIpsRepository } from '@features/persistence/backend/repositories/models.js';
import type { Packed } from '@features/index/contract/packed.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

const date = new Date('2026-10-07T00:00:00.000Z');
const user = { id: 'user123', name: null, username: 'fixture', host: null, avatarUrl: 'https://example.com/avatar.png', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const } satisfies Packed<'UserLite'>;
const detailedUser = { ...user, url: null, uri: null, movedTo: null, alsoKnownAs: null, createdAt: date.toISOString(), updatedAt: null, lastFetchedAt: null, bannerUrl: null, bannerBlurhash: null, isLocked: false, isSilenced: false, isSuspended: false, description: null, location: null, birthday: null, lang: null, fields: [], verifiedLinks: [], followersCount: 0, followingCount: 0, notesCount: 0, pinnedNoteIds: [], pinnedNotes: [], pinnedPageId: null, pinnedPage: null, publicReactions: false, followingVisibility: 'public' as const, followersVisibility: 'public' as const, chatScope: 'everyone' as const, canChat: true, roles: [], memo: null } satisfies Packed<'UserDetailedNotMe'>;
const webhook = { id: 'webhook123', isActive: true, updatedAt: date.toISOString(), latestSentAt: null, latestStatus: null, name: 'Fixture', on: ['abuseReport'] as ['abuseReport'], url: 'https://example.com/webhook', secret: '' } satisfies Packed<'SystemWebhook'>;

function checkFinite(schema: v.GenericSchema, value: Record<string, unknown>) {
	expect(v.parse(schema, value)).toEqual(value);
	for (const bad of [{ ...value, future: true }, { ...value, id: 7 }, { ...value, id: null }]) expect(v.safeParse(schema, bad).success).toBe(false);
	const { id: _id, ...missing } = value;
	expect(v.safeParse(schema, missing).success).toBe(false);
}

test.each([[false, false], [true, false], [false, true], [true, true]])('real recipient serializer preserves conditional user/webhook fields: %s/%s', async (hasUser, hasWebhook) => {
	const recipient = { id: 'recipient123', isActive: true, updatedAt: date, name: 'Fixture', method: hasWebhook ? 'webhook' : 'email', userId: hasUser ? user.id : null, user: null, userProfile: null, systemWebhookId: hasWebhook ? webhook.id : null, systemWebhook: null } satisfies MiAbuseReportNotificationRecipient;
	const serializer = new AbuseReportNotificationRecipientEntityService(mockDeep(), mockDeep(), mockDeep());
	const result = await serializer.pack(recipient, { users: new Map([[user.id, user]]), webhooks: new Map([[webhook.id, webhook]]) });
	checkFinite(packedAbuseReportNotificationRecipientSchema, result);
	expect(result.user).toEqual(hasUser ? user : undefined);
	expect(result.systemWebhook).toEqual(hasWebhook ? webhook : undefined);
	expect(Object.hasOwn(result, 'user')).toBe(true);
	expect(v.parse(packedAbuseReportNotificationRecipientSchema, JSON.parse(JSON.stringify(result)))).toEqual(JSON.parse(JSON.stringify(result)));
	for (const field of ['userId', 'systemWebhookId', 'user', 'systemWebhook']) expect(v.safeParse(packedAbuseReportNotificationRecipientSchema, { ...result, [field]: null }).success).toBe(false);
});

test('real moderation log serializer retains dynamic info in a finite outer model', async () => {
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	const packedUser = detailedUser;
	const log = { id: 'log123', userId: user.id, user: null, type: 'fixture', info: { arbitrary: { action: true }, userId: user.id } };
	const result = await new ModerationLogEntityService(mockDeep(), mockDeep(), ids).pack(log, { packedUser });
	checkFinite(packedAdminShowModerationLogsOutput.item, result);
	expect(result.info).toEqual(log.info);
});

test.each([null, 'accept', 'reject'] as const)('real abuse report serializer preserves nullable resolution and assignee: %s', async resolvedAs => {
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	const packedUser = detailedUser;
	const report = { id: 'report123', targetUserId: user.id, targetUser: null, reporterId: user.id, reporter: null, assigneeId: resolvedAs ? user.id : null, assignee: null, resolved: resolvedAs !== null, forwarded: false, comment: 'fixture', moderationNote: '', resolvedAs, targetUserHost: null, reporterHost: null };
	const result = await new AbuseUserReportEntityService(mockDeep(), mockDeep(), ids).pack(report, { packedReporter: packedUser, packedTargetUser: packedUser, packedAssignee: packedUser });
	checkFinite(packedAdminAbuseUserReportsOutput.item, result);
	expect(result.assignee).toEqual(resolvedAs ? packedUser : null);
});

test('real IP handler produces finite dated records with existing admin auth metadata', async () => {
	const repository = mockDeep<UserIpsRepository>();
	repository.find.mockResolvedValue([{ id: 'ip123', userId: user.id, ip: '127.0.0.1', createdAt: date }]);
	const endpoint = new IpsEndpoint(repository, mockDeep());
	const result = await endpoint.exec({ userId: user.id }, mockDeep<MiLocalUser>({ id: user.id }), null);
	expect(v.parse(inlineAdminGetUserIpsOutput, result)).toEqual([{ ip: '127.0.0.1', createdAt: date.toISOString() }]);
	expect(v.safeParse(inlineAdminGetUserIpsOutput, [{ ...result[0], future: true }]).success).toBe(false);
	for (const bad of [{ ip: 'ip' }, { ip: null, createdAt: date.toISOString() }, { ip: 'ip', createdAt: 7 }]) expect(v.safeParse(inlineAdminGetUserIpsOutput, [bad]).success).toBe(false);
});

test('native moderation input defaults and nullable optional semantics stay explicit', () => {
	expectTypeOf<v.InferOutput<typeof inlineAdminGetUserIpsInput>>().toEqualTypeOf<{ userId: string }>();
	expect(v.parse(inlineAdminGetUserIpsInput, { userId: user.id, future: true })).toEqual({ userId: user.id });
	expect(v.parse(packedAdminAbuseUserReportsInput, { future: true })).toEqual({ limit: 10, state: null, reporterOrigin: 'combined', targetUserOrigin: 'combined' });
	expect(v.parse(packedAdminShowModerationLogsInput, { future: true })).toEqual({ limit: 10 });
	expect(v.parse(moderationCommandInputs['admin/resolve-abuse-user-report'], { reportId: 'report123', resolvedAs: null, future: true })).toEqual({ reportId: 'report123', resolvedAs: null });
	for (const schema of Object.values(moderationCommandInputs)) {
		expect(v.safeParse(schema, {}).success).toBe(false);
		expect(v.safeParse(schema, { userId: 7, reportId: 7, id: 7 }).success).toBe(false);
	}
	expect(v.parse(packedAdminAbuseReportNotificationRecipientCreateInput, { name: 'Fixture', isActive: true, method: 'email', future: true })).toEqual({ name: 'Fixture', isActive: true, method: 'email' });
	// Raw signins and private role/policy composition remain their explicit legacy producer boundary.
	expect(adminShowUserOutput.type).toBe('loose_object');
});

test('legacy IP HTTP accepts unknown keys, keeps raw responses and rejects invalid inputs', async () => {
	const projection = projectEndpointContract(inlineAdminGetUserIpsDefinition);
	const input = { userId: user.id, i: 'transport', future: true };
	const raw = [{ ip: 'ip', createdAt: date.toISOString(), future: true }];
	const endpoint = new ContractEndpoint({}, projection, async ps => { expect(ps).toBe(input); return raw; });
	expect(await endpoint.exec(input, null, null)).toBe(raw);
	expect(v.safeParse(inlineAdminGetUserIpsOutput, raw).success).toBe(false);
	await expect(endpoint.exec({ userId: 7 }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	expect(projection.input.additionalProperties).toBeUndefined();
	expect(projection.response?.items).toHaveProperty('additionalProperties', false);
});

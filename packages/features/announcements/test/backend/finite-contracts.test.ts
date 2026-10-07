/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { inlineAdminAnnouncementsCreateDefinition as createDefinition, inlineAdminAnnouncementsCreateInput as createInput, inlineAdminAnnouncementsCreateOutput as createOutput, inlineAdminAnnouncementsListInput as listInput, inlineAdminAnnouncementsListOutput as listOutput } from '../../contract/endpoint-definitions.js';
import { announcementCommandInputs } from '../../contract/index.js';
import { packedAnnouncementsInput, packedAnnouncementsOutput, packedAnnouncementsShowInput, packedAnnouncementsShowOutput } from '../../contract/packed-endpoint-definitions.js';
import { packedAnnouncementSchema } from '../../contract/packed.js';
import { AnnouncementEntityService } from '../../backend/serializers/AnnouncementEntityService.js';
import { AnnouncementService } from '../../backend/services/AnnouncementService.js';
import { EndpointImplementation as CreateEndpoint } from '../../backend/endpoints/admin/announcements/create.js';
import { EndpointImplementation as ListEndpoint } from '../../backend/endpoints/admin/announcements/list.js';
import { MiAnnouncement } from '../../backend/models/Announcement.js';
import { ContractEndpoint, projectEndpointContract } from '@features/api/backend/transport/contract-endpoint.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';

const date = new Date('2026-01-01T00:00:00.000Z');

function announcement() {
	return new MiAnnouncement({ id: 'announcement123', updatedAt: null, title: 'Title', text: 'Text', imageUrl: null, icon: 'info', display: 'normal', needConfirmationToRead: false, silence: false, forExistingUsers: false, isActive: true, userId: null });
}

function fixture() {
	const announcements = mockDeep<AnnouncementsRepository>();
	const reads = mockDeep<AnnouncementReadsRepository>();
	const ids = mockDeep<IdService>();
	ids.parse.mockReturnValue({ date });
	ids.gen.mockReturnValue('announcement123');
	const serializer = new AnnouncementEntityService(announcements, reads, ids);
	return { announcements, reads, ids, serializer };
}

test('all announcement native inputs are finite while retaining defaults, nullability and validation', () => {
	expectTypeOf<string extends keyof v.InferOutput<typeof createInput> ? true : false>().toEqualTypeOf<false>();
	expectTypeOf<string extends keyof v.InferOutput<typeof createOutput> ? true : false>().toEqualTypeOf<false>();
	expect(v.parse(createInput, { title: 'T', text: 'T', imageUrl: null, future: true })).toEqual({ title: 'T', text: 'T', imageUrl: null, icon: 'info', display: 'normal', forExistingUsers: false, silence: false, needConfirmationToRead: false, userId: null });
	expect(v.safeParse(createInput, { title: 'T', text: 'T' }).success).toBe(false);
	expect(v.safeParse(createInput, { title: '', text: 'T', imageUrl: null }).success).toBe(false);
	expect(v.parse(listInput, { future: true })).toEqual({ limit: 10, status: 'active' });
	expect(v.parse(packedAnnouncementsInput, { future: true })).toEqual({ limit: 10, isActive: true });
	expect(v.parse(packedAnnouncementsShowInput, { announcementId: 'announcement123', future: true })).toEqual({ announcementId: 'announcement123' });
	for (const [name, input] of Object.entries(announcementCommandInputs)) {
		const params = name === 'i/read-announcement' ? { announcementId: 'announcement123' } : { id: 'announcement123' };
		expect(v.parse(input, { ...params, future: true })).toEqual(params);
		expect(v.safeParse(input, {}).success).toBe(false);
	}
	expect(v.parse(announcementCommandInputs['admin/announcements/update'], { id: 'announcement123', imageUrl: null })).toEqual({ id: 'announcement123', imageUrl: null });
	expect(v.safeParse(announcementCommandInputs['admin/announcements/update'], { id: 'announcement123', title: 7 }).success).toBe(false);
});

test.each([undefined, null, false, true])('real public serializer retains optional isRead=%s and rejects finite-output violations', async isRead => {
	const { serializer } = fixture();
	const result = await serializer.pack({ ...announcement(), isRead });
	for (const output of [packedAnnouncementSchema, createOutput, packedAnnouncementsShowOutput]) {
		expect(v.parse(output, result)).toEqual(result);
		for (const invalid of [{ ...result, title: undefined }, { ...result, icon: 'other' }, { ...result, imageUrl: 7 }, { ...result, isRead: null }, { ...result, future: true }]) expect(v.safeParse(output, invalid).success).toBe(false);
	}
	expect(v.parse(packedAnnouncementsOutput, [result])).toEqual([result]);
	expect(result).toMatchObject({ updatedAt: null, imageUrl: null, forYou: false, isRead: isRead ?? undefined });
	const { isRead: ignored, ...withoutRead } = result;
	expect(ignored).toBe(isRead ?? undefined);
	expect(v.safeParse(packedAnnouncementSchema, withoutRead).success).toBe(true);
});

test('authenticated serializer resolves read state and targeted forYou; creation handler uses full real serializer output', async () => {
	const { announcements, reads, ids, serializer } = fixture();
	const user = mockDeep<MiLocalUser>({ id: 'user123' });
	reads.countBy.mockResolvedValue(1);
	const targeted = await serializer.pack({ ...announcement(), userId: user.id }, user);
	expect(targeted).toMatchObject({ isRead: true, forYou: true });
	expect(v.parse(packedAnnouncementSchema, targeted)).toEqual(targeted);
	expect(reads.countBy).toHaveBeenCalledWith({ announcementId: 'announcement123', userId: user.id });
	announcements.insertOne.mockResolvedValue(announcement());
	const service = new AnnouncementService(announcements, reads, mockDeep(), ids, mockDeep(), mockDeep(), serializer);
	const endpoint = new CreateEndpoint(service);
	const params = { title: 'Title', text: 'Text', imageUrl: '', i: 'transport', future: true };
	const result = await endpoint.exec(params, user, null);
	expect(v.parse(createOutput, result)).toEqual(result);
	expect(result).toMatchObject({ icon: 'info', display: 'normal', needConfirmationToRead: false, silence: false, forYou: false });
	expect(params).toMatchObject({ icon: 'info', display: 'normal', userId: null, future: true });
	expect(announcements.insertOne).toHaveBeenCalledWith(expect.objectContaining({ imageUrl: null, icon: 'info', display: 'normal', forExistingUsers: false, userId: null }));
});

test('admin list handler emits its distinct finite raw shape and read count', async () => {
	const { announcements, reads, ids } = fixture();
	const pagination = mockDeep<QueryService>();
	const query = mockDeep<ReturnType<AnnouncementsRepository['createQueryBuilder']>>();
	pagination.makePaginationQuery.mockReturnValue(query);
	query.andWhere.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	query.getMany.mockResolvedValue([announcement()]);
	reads.countBy.mockResolvedValue(3);
	const endpoint = new ListEndpoint(announcements, reads, pagination, ids);
	const result = await endpoint.exec({}, mockDeep<MiLocalUser>({ id: 'user123' }), null);
	expect(v.parse(listOutput, result)).toEqual(result);
	expect(result[0]).toMatchObject({ reads: 3, userId: null, updatedAt: null, isActive: true });
	expect(query.limit).toHaveBeenCalledWith(10);
	for (const invalid of [{ ...result[0], reads: undefined }, { ...result[0], reads: '3' }, { ...result[0], future: true }]) expect(v.safeParse(listOutput, [invalid]).success).toBe(false);
});

test('HTTP projection preserves open input, AJV defaults/errors and unparsed outputs', async () => {
	const { serializer } = fixture();
	const result = { ...await serializer.pack(announcement()), future: true };
	const projection = projectEndpointContract(createDefinition);
	expect(projection.input).not.toHaveProperty('additionalProperties');
	expect(projection.response).toMatchObject({ additionalProperties: false });
	expect(toLegacyJsonSchema(packedAnnouncementSchema, { target: 'openapi-3.0', typeMode: 'output' })).toMatchObject({ additionalProperties: false });
	const params = { title: 'Title', text: 'Text', imageUrl: null, i: 'transport', future: true };
	const endpoint = new ContractEndpoint({}, projection, async ps => { expect(ps).toBe(params); return result; });
	expect(await endpoint.exec(params, null, null)).toBe(result);
	expect(params).toMatchObject({ icon: 'info', display: 'normal', future: true });
	expect(v.safeParse(createOutput, result).success).toBe(false);
	await expect(endpoint.exec({ title: 'Title', text: 'Text' }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM', id: '3d81ceae-475f-4600-b2a8-2bc116157532', info: { param: '#/required' } });
});

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { announcementsContract } from '../../backend/api.definition.js';

import { expect, expectTypeOf, test, vi } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';

import { AnnouncementEntityService } from '../../backend/serializers/AnnouncementEntityService.js';
import { createRouterClient } from '@orpc/server';
import { Brackets, EntityNotFoundError } from 'typeorm';
import type { SelectQueryBuilder } from 'typeorm';
import { createAnnouncementsRouter } from '../../backend/api.implementation.js';
import type { AnnouncementsDependencies } from '../../backend/api.implementation.js';
import type { ApiActor, ApiAuthorization, ApiContext, ApiServices } from '../../../api/backend/transport/context.js';
import { MiAnnouncement } from '../../backend/models/Announcement.js';

import { packedSchemas } from '../../../index/backend/packed.schema.js';
import { announcementsContract as nativeContract2 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract3 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract4 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract5 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract6 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract7 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract8 } from '../../backend/api.definition.js';
import { announcementsContract as nativeContract9 } from '../../backend/api.definition.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@features/persistence/backend/repositories/models.js';
const announcementUpdateInput = requiredSchema(announcementsContract.update['~orpc'].inputSchema);
const announcementDeleteInput = requiredSchema(announcementsContract.delete['~orpc'].inputSchema);
const announcementReadInput = requiredSchema(announcementsContract.read['~orpc'].inputSchema);
const announcementCommandInputs = { 'admin/announcements/update': announcementUpdateInput, 'admin/announcements/delete': announcementDeleteInput, 'i/read-announcement': announcementReadInput };

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const createInput = requiredSchema(nativeContract2.create['~orpc'].inputSchema);
const createOutput = requiredSchema(nativeContract3.create['~orpc'].outputSchema);
const listInput = requiredSchema(nativeContract4.adminList['~orpc'].inputSchema);
const listOutput = requiredSchema(nativeContract5.adminList['~orpc'].outputSchema);
const packedAnnouncementsInput = requiredSchema(nativeContract6.list['~orpc'].inputSchema);
const packedAnnouncementsOutput = requiredSchema(nativeContract7.list['~orpc'].outputSchema);
const packedAnnouncementsShowInput = requiredSchema(nativeContract8.show['~orpc'].inputSchema);
const packedAnnouncementsShowOutput = requiredSchema(nativeContract9.show['~orpc'].outputSchema);
const packedAnnouncementSchema = packedSchemas.Announcement;

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

function nativeFixture(actor: ApiActor | null = { id: 'admin123', isSuspended: false, movedToUri: null }) {
	const dependencies = mockDeep<AnnouncementsDependencies<ApiActor>>();
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([actor, null]);
	const authorization = mockDeep<ApiAuthorization<ApiActor>>();
	authorization.rootUserId.mockReturnValue(actor?.id ?? null);
	const context: ApiContext<ApiActor> = { services, authorization, credential: actor ? 'credential' : null, ip: '127.0.0.1', headers: {} };
	const query = mockDeep<SelectQueryBuilder<MiAnnouncement>>();
	query.andWhere.mockReturnValue(query);
	query.orWhere.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	dependencies.announcementsRepository.createQueryBuilder.mockReturnValue(query);
	dependencies.queryService.makePaginationQuery.mockReturnValue(query);
	dependencies.idService.parse.mockReturnValue({ date });
	return { dependencies, query, actor, client: createRouterClient(createAnnouncementsRouter(dependencies), { context }) };
}

test('native create injects construction dependencies and materializes defaults before invoking the domain service', async () => {
	const { dependencies, client, actor } = nativeFixture();
	const packed = await fixture().serializer.pack(announcement());
	dependencies.announcementService.create.mockResolvedValue({ packed });
	expect(await client.create({ title: 'Title', text: 'Text', imageUrl: '' })).toEqual(packed);
	expect(dependencies.announcementService.create).toHaveBeenCalledExactlyOnceWith({
		title: 'Title', text: 'Text', imageUrl: null, updatedAt: null,
		icon: 'info', display: 'normal', forExistingUsers: false, silence: false,
		needConfirmationToRead: false, userId: null,
	}, actor);
});
test('native admin list retains status/user filters and awaits read counts with ISO dates', async () => {
	const { dependencies, query, client } = nativeFixture();
	const row = announcement();
	row.updatedAt = date;
	query.getMany.mockResolvedValue([row]);
	dependencies.announcementReadsRepository.countBy.mockResolvedValue(3);
	const output = await client.adminList({ status: 'archived', userId: 'target123' });
	expect(query.andWhere).toHaveBeenCalledWith('announcement.isActive = false');
	expect(query.andWhere).toHaveBeenCalledWith('announcement.userId = :userId', { userId: 'target123' });
	expect(query.limit).toHaveBeenCalledExactlyOnceWith(10);
	expect(dependencies.announcementReadsRepository.countBy).toHaveBeenCalledExactlyOnceWith({ announcementId: row.id });
	expect(output).toEqual([{
		id: row.id, createdAt: date.toISOString(), updatedAt: date.toISOString(), title: row.title,
		text: row.text, imageUrl: null, icon: 'info', display: 'normal', isActive: true,
		forExistingUsers: false, silence: false, needConfirmationToRead: false, userId: null, reads: 3,
	}]);
	expect(v.parse(listOutput, output)).toEqual(output);
});
test.each([false, true])('native public list retains actor targeting and anonymous access (anonymous=%s)', async anonymous => {
	const native = anonymous ? nativeFixture(null) : nativeFixture();
	const { dependencies, query, client, actor } = native;
	const rows = [announcement()];
	const packed = [await fixture().serializer.pack(rows[0])];
	query.getMany.mockResolvedValue(rows);
	dependencies.announcementEntityService.packMany.mockResolvedValue(packed);
	expect(await client.list({})).toEqual(packed);
	expect(query.andWhere).toHaveBeenCalledWith('announcement.isActive = :isActive', { isActive: true });
	const bracket = query.andWhere.mock.calls.map(([where]) => where).find(where => where instanceof Brackets);
	expect(bracket).toBeInstanceOf(Brackets);
	if (!(bracket instanceof Brackets)) throw new Error('Missing targeting predicate');
	bracket.whereFactory(query);
	expect(query.orWhere).toHaveBeenCalledWith('announcement.userId IS NULL');
	if (actor) expect(query.orWhere).toHaveBeenCalledWith('announcement.userId = :meId', { meId: actor.id });
	else expect(query.orWhere).toHaveBeenCalledTimes(1);
	expect(dependencies.announcementEntityService.packMany).toHaveBeenCalledExactlyOnceWith(rows, actor);
});
test('native show translates missing entities with its route UUID and forwards the authenticated actor', async () => {
	const { dependencies, client, actor } = nativeFixture(null);
	dependencies.announcementService.getAnnouncement.mockRejectedValue(new EntityNotFoundError(MiAnnouncement, { id: 'missing123' }));
	await expect(client.show({ announcementId: 'missing123' })).rejects.toMatchObject({
		code: 'NO_SUCH_ANNOUNCEMENT', data: { id: 'b57b5e1d-4f49-404a-9edb-46b00268f121' },
	});
	expect(dependencies.announcementService.getAnnouncement).toHaveBeenCalledExactlyOnceWith('missing123', actor);
});
test('native credential policy precedes input validation and domain calls', async () => {
	const { dependencies, client } = nativeFixture(null);
	await expect(client.update({ id: '' })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED' });
	expect(dependencies.announcementsRepository.findOneBy).not.toHaveBeenCalled();
	expect(dependencies.announcementService.update).not.toHaveBeenCalled();
});

test('native public announcement selects wire fields without invoking output validation', async () => {
	const { dependencies, client } = nativeFixture(null);
	const { serializer } = fixture();
	const row = mockDeep<MiAnnouncement>({ id: 'announcement123', updatedAt: null, title: 'Public', text: 'Text', imageUrl: null, icon: 'info', display: 'normal', userId: null, needConfirmationToRead: false, silence: false });
	const publicValue = await serializer.pack(row);
	const extended = { ...publicValue, privateTargetingData: 'secret' };
	dependencies.announcementService.getAnnouncement.mockResolvedValue(extended);
	const output = announcementsContract.show['~orpc'].outputSchema;
	if (output === undefined) throw new Error('Missing announcement output');
	const validate = vi.spyOn(output, '~run');
	try {
		const response = await client.show({ announcementId: row.id });
		expect(response).toEqual(publicValue);
		expect(response).not.toHaveProperty('privateTargetingData');
		expect(validate).not.toHaveBeenCalled();
	} finally { validate.mockRestore(); }
});

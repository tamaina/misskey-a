/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';

import { announcementUpdateInput, announcementDeleteInput, announcementReadInput } from '../../backend/api.schema.js';
const announcementCommandInputs = { 'admin/announcements/update': announcementUpdateInput, 'admin/announcements/delete': announcementDeleteInput, 'i/read-announcement': announcementReadInput };

import { AnnouncementEntityService } from '../../backend/serializers/AnnouncementEntityService.js';
import { AnnouncementService } from '../../backend/services/AnnouncementService.js';
import { MiAnnouncement } from '../../backend/models/Announcement.js';

import { packedSchemas } from '../../../index/backend/packed.schema.js';
import { announcementsContract as nativeContract1 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract2 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract3 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract4 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract5 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract6 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract7 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract8 } from '../../backend/api.contract.js';
import { announcementsContract as nativeContract9 } from '../../backend/api.contract.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@features/persistence/backend/repositories/models.js';

function requiredSchema<S extends v.GenericSchema>(schema: S | undefined): S { if (schema === undefined) throw new Error('Missing native schema'); return schema; }

const createDefinition = nativeContract1.create;
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

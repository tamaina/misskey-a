/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { createProcedureClient } from '@orpc/server';
import { createNotesTimelineProcedure } from '../../backend/endpoints/notes/timeline.js';
import { antennaName } from '../../backend/endpoints/input.schema.js';
import { packedAntennaSchema } from '../../backend/antenna.schema.js';
import { notesTimelineInput as packedNotesTimelineInput, notesTimelineOutput as packedNotesTimelineOutput } from '../../backend/endpoints/notes/timeline.contract.js';
import { AntennaEntityService } from '../../backend/serializers/AntennaEntityService.js';
import { NotesGlobalTimelineApplicationService as GlobalTimeline } from '../../backend/applications/notes/global-timeline.js';
import type { TimelinesContext } from '../../backend/operations.js';
import type { ApiActor, ApiServices } from '../../../api/backend/transport/context.js';
import type { MiAntenna } from '../../backend/models/Antenna.js';

const date = new Date('2026-01-01T00:00:00Z');

function checkClosed(schema: v.GenericSchema, value: Record<string, unknown>, required: string, wrong: Record<string, unknown>) {
	expect(v.safeParse(schema, value).success).toBe(true);
	expect(v.safeParse(schema, { ...value, future: true }).success).toBe(false);
	const missing = { ...value };
	delete missing[required];
	expect(v.safeParse(schema, missing).success).toBe(false);
	expect(v.safeParse(schema, { ...value, ...wrong }).success).toBe(false);
}

test('actual antenna producer validates all fixed legacy fields without defaulting missing booleans', async () => {
	const ids = mockDeep<ConstructorParameters<typeof AntennaEntityService>[1]>();
	ids.parse.mockReturnValue({ date });
	const service = new AntennaEntityService(mockDeep(), ids);
	const antenna = mockDeep<MiAntenna>({ id: 'antenna123', name: 'watch', keywords: [['hello']], excludeKeywords: [], src: 'all', userListId: null, users: [], caseSensitive: false, localOnly: false, excludeBots: false, withReplies: true, withFile: false, excludeNotesInSensitiveChannel: false, isActive: true });
	const output = await service.pack(antenna);
	checkClosed(packedAntennaSchema, output, 'notify', { hasUnreadNote: 1 });
	expect(output.notify).toBe(false);
	expect(output.hasUnreadNote).toBe(false);
	for (const key of ['localOnly', 'excludeBots', 'caseSensitive', 'withReplies']) {
		const missing = { ...output };
		Reflect.deleteProperty(missing, key);
		expect(v.safeParse(packedAntennaSchema, missing).success).toBe(false);
	}
});

test('native timeline defaults retain JSON scalar types and reject array requests', () => {
	const parsed = v.parse(packedNotesTimelineInput, { future: true });
	expect(parsed).not.toHaveProperty('future');
	expect(parsed.limit).toBe(10);
	for (const value of [[], { limit: 0 }, { withFiles: 'true' }]) expect(v.safeParse(packedNotesTimelineInput, value).success).toBe(false);
	expect(v.parse(packedNotesTimelineOutput, [])).toEqual([]);
});

test('native timeline credential policy precedes validation and application access', async () => {
	const services = mockDeep<ApiServices<ApiActor>>();
	services.authenticate.mockResolvedValue([null, null]);
	const context = mockDeep<TimelinesContext<ApiActor>>({ services, credential: null, ip: '127.0.0.1', headers: {} });
	const client = createProcedureClient(createNotesTimelineProcedure<ApiActor>(), { context });
	await expect(client({ limit: 0 })).rejects.toMatchObject({ code: 'CREDENTIAL_REQUIRED', data: { id: '1384574d-a912-4b81-8601-c7b1c4085df1' } });
	expect(context.operations.timelines.notesTimeline).not.toHaveBeenCalled();
});

test.each([false, true])('actual global timeline producer retains packed and empty arrays: %s', async empty => {
	const notes = mockDeep<ConstructorParameters<typeof GlobalTimeline>[1]>();
	const queries = mockDeep<ConstructorParameters<typeof GlobalTimeline>[2]>();
	const roles = mockDeep<ConstructorParameters<typeof GlobalTimeline>[3]>();
	roles.getUserPolicies.mockResolvedValue(mockDeep<Awaited<ReturnType<ConstructorParameters<typeof GlobalTimeline>[3]['getUserPolicies']>>>({ gtlAvailable: true }));
	const query = mockDeep<ReturnType<ConstructorParameters<typeof GlobalTimeline>[0]['createQueryBuilder']>>();
	query.andWhere.mockReturnValue(query);
	query.innerJoinAndSelect.mockReturnValue(query);
	query.leftJoinAndSelect.mockReturnValue(query);
	query.limit.mockReturnValue(query);
	query.getMany.mockResolvedValue([]);
	queries.makePaginationQuery.mockReturnValue(query);
	const user = { id: 'user123', name: null, username: 'alice', host: null, avatarUrl: 'https://example/avatar', avatarBlurhash: null, avatarDecorations: [], emojis: {}, onlineStatus: 'unknown' as const };
	const note = { id: 'note123', createdAt: date.toISOString(), text: null, userId: user.id, user, visibility: 'public' as const, reactionAcceptance: null, reactionEmojis: {}, reactions: {}, reactionCount: 0, renoteCount: 0, repliesCount: 0 };
	const response = empty ? [] : [note];
	notes.packMany.mockResolvedValue(response);
	const endpoint = new GlobalTimeline(mockDeep(), notes, queries, roles, mockDeep());
	const output = await endpoint.execute(v.parse(packedNotesTimelineInput, {}), null);
	expect(output).toBe(response);
	expect(v.parse(packedNotesTimelineOutput, output)).toEqual(response);
});

test('antenna names keep Unicode code-point length rather than UTF-16 length', () => {
	expect(v.safeParse(antennaName, '😀'.repeat(100)).success).toBe(true);
	expect(v.safeParse(antennaName, '😀'.repeat(101)).success).toBe(false);
	expect(v.safeParse(antennaName, '').success).toBe(false);
});

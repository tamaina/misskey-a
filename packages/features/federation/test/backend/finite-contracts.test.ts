/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { packedFederationInstanceSchema } from '../../contract/packed.js';
import { packedFederationInstancesInput, packedFederationStatsDefinition, packedFederationStatsOutput } from '../../contract/packed-endpoint-definitions.js';
import { inlineAdminRelaysAddOutput, inlineAdminRelaysListOutput, inlineApGetOutput } from '../../contract/endpoint-definitions.js';
import { voidAdminFederationUpdateInstanceInput } from '../../contract/void-endpoint-definitions.js';
import { InstanceEntityService } from '../../../instance/backend/serializers/InstanceEntityService.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { MiInstance } from '../../backend/models/Instance.js';
import type { MiMeta } from '../../../instance/backend/models/Meta.js';
import type { RoleService } from '../../../roles/backend/services/RoleService.js';
import type { UtilityService } from '../../backend/services/UtilityService.js';
import type { RelayService } from '../../backend/services/RelayService.js';
import { MiRelay } from '../../backend/models/Relay.js';
import { EndpointImplementation as ListRelays } from '../../backend/endpoints/admin/relays/list.js';
import { ContractEndpoint, projectEndpointContract } from '../../../api/backend/transport/contract-endpoint.js';

const instance = mockDeep<MiInstance>({
	id: 'instance1', firstRetrievedAt: new Date('2026-01-01T00:00:00Z'), host: 'remote.test',
	usersCount: 3, notesCount: 5, followingCount: 2, followersCount: 4,
	isNotResponding: false, suspensionState: 'none', softwareName: null, softwareVersion: null,
	openRegistrations: null, name: null, description: null, maintainerName: null, maintainerEmail: null,
	iconUrl: null, faviconUrl: null, themeColor: null, infoUpdatedAt: null, latestRequestReceivedAt: null,
	moderationNote: 'moderator only',
});

test('actual federation serializer covers moderator, nullable dates and software suspension', async () => {
	const roles = mockDeep<RoleService>();
	const utility = mockDeep<UtilityService>();
	utility.isBlockedHost.mockReturnValue(false);
	utility.isSilencedHost.mockReturnValue(false);
	utility.isMediaSilencedHost.mockReturnValue(false);
	const service = new InstanceEntityService(mockDeep<MiMeta>({ blockedHosts: [], silencedHosts: [], mediaSilencedHosts: [] }), roles, utility);
	for (const moderator of [false, true]) {
		roles.isModerator.mockResolvedValue(moderator);
		for (const softwareSuspended of [false, true]) {
			utility.isDeliverSuspendedSoftware.mockReturnValue(softwareSuspended ? { software: 'misskey', versionRange: '*' } : undefined);
			const result = await service.pack(instance, { id: 'viewer' });
			expect(v.parse(packedFederationInstanceSchema, result)).toEqual(result);
			expect(result.moderationNote).toBe(moderator ? 'moderator only' : null);
			expect(result.suspensionState).toBe(softwareSuspended ? 'softwareSuspended' : 'none');
			expect(result.infoUpdatedAt).toBeNull();
			for (const invalid of [{ ...result, future: true }, { ...result, host: undefined }, { ...result, usersCount: 'bad' }]) {
				expect(v.safeParse(packedFederationInstanceSchema, invalid).success).toBe(false);
			}
		}
	}
	const dated = await service.pack({ ...instance, infoUpdatedAt: new Date('2026-02-01Z'), latestRequestReceivedAt: new Date('2026-02-02Z'), suspensionState: 'manuallySuspended', moderationNote: '' });
	expect(v.parse(packedFederationInstanceSchema, dated)).toEqual(dated);
});

test('actual relay list fields remain finite and metadata does not supply missing status', async () => {
	const relay = Object.assign(new MiRelay(), { id: 'relay1', inbox: 'https://relay.test/inbox', status: 'requesting' as const });
	const service = mockDeep<RelayService>();
	service.listRelay.mockResolvedValue([relay]);
	const result = await new ListRelays(service).exec({}, mockDeep<MiLocalUser>(), null);
	expect(v.parse(inlineAdminRelaysListOutput, result)).toEqual([relay]);
	for (const invalid of [{ ...relay, future: true }, { id: relay.id, inbox: relay.inbox }, { ...relay, status: 'bad' }]) {
		expect(v.safeParse(inlineAdminRelaysAddOutput, invalid).success).toBe(false);
		expect(v.safeParse(inlineAdminRelaysListOutput, [invalid]).success).toBe(false);
	}
});

test('native finite inputs strip extras and preserve defaults, nulls and invalid input checks', () => {
	expect(v.parse(packedFederationInstancesInput, { host: null, future: true })).toEqual({ host: null, limit: 30, offset: 0 });
	expect(v.parse(voidAdminFederationUpdateInstanceInput, { host: 'remote.test', future: true })).toEqual({ host: 'remote.test' });
	for (const input of [{}, { host: 1 }, { host: 'remote.test', moderationNote: null }]) expect(v.safeParse(voidAdminFederationUpdateInstanceInput, input).success).toBe(false);
	for (const input of [{ limit: 0 }, { offset: 'bad' }, { sort: 'bad' }]) expect(v.safeParse(packedFederationInstancesInput, input).success).toBe(false);
	const stats = { topSubInstances: [], otherFollowersCount: 2, topPubInstances: [], otherFollowingCount: 3 };
	expect(v.parse(packedFederationStatsOutput, stats)).toEqual(stats);
	for (const invalid of [{ ...stats, future: true }, { ...stats, otherFollowersCount: undefined }, { ...stats, topPubInstances: 'bad' }]) expect(v.safeParse(packedFederationStatsOutput, invalid).success).toBe(false);
});

test('HTTP preserves AJV request identity/defaults/errors and unparsed extra response fields', async () => {
	const request = { future: true };
	const response = { topSubInstances: [], otherFollowersCount: 2, topPubInstances: [], otherFollowingCount: 3, future: true };
	const endpoint = new ContractEndpoint({}, projectEndpointContract(packedFederationStatsDefinition), async ps => { expect(ps).toBe(request); return response; });
	expect(await endpoint.exec(request, null, null)).toBe(response);
	expect(request).toEqual({ future: true, limit: 10 });
	await expect(endpoint.exec({ limit: 0 }, null, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
	const activity = { '@context': ['https://www.w3.org/ns/activitystreams'], type: 'Person', extension: { nested: true } };
	expect(v.parse(inlineApGetOutput, activity)).toEqual(activity);
});

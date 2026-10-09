/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, test } from 'vitest';
import * as v from 'valibot';
import { mockDeep } from 'vitest-mock-extended';
import { federationInstanceSchema as packedFederationInstanceSchema } from '../../backend/federation.schema.js';
import { federationInstancesInput as packedFederationInstancesInput } from '../../backend/endpoints/federation/instances.contract.js';
import { federationStatsInput, federationStatsOutput as packedFederationStatsOutput } from '../../backend/endpoints/federation/stats.contract.js';
import { adminRelaysAddOutput as inlineAdminRelaysAddOutput } from '../../backend/endpoints/admin/relays/add.contract.js';
import { adminRelaysListOutput as inlineAdminRelaysListOutput } from '../../backend/endpoints/admin/relays/list.contract.js';
import { apGetOutput as inlineApGetOutput } from '../../backend/endpoints/ap/get.contract.js';
import { adminFederationUpdateInstanceInput as voidAdminFederationUpdateInstanceInput } from '../../backend/endpoints/admin/federation/update-instance.contract.js';
import { InstanceEntityService } from '../../../instance/backend/serializers/InstanceEntityService.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
import type { MiInstance } from '../../backend/models/Instance.js';
import type { MiMeta } from '../../../instance/backend/models/Meta.js';
import type { RoleService } from '../../../roles/backend/services/RoleService.js';
import type { UtilityService } from '../../backend/services/UtilityService.js';
import type { RelayService } from '../../backend/services/RelayService.js';
import { ApGetApplicationService } from '../../backend/endpoints/ap/get.application.js';
import type { ApResolverService } from '../../backend/services/ApResolverService.js';
import { MiRelay } from '../../backend/models/Relay.js';
import { AdminRelaysListApplicationService as ListRelays } from '../../backend/endpoints/admin/relays/list.application.js';

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
	const result = await new ListRelays(service).execute({}, mockDeep<MiLocalUser>());
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

test('native defaults and genuine ActivityPub extensions preserve JSON keys', () => {
 expect(v.parse(federationStatsInput, { future: true })).toEqual({ limit: 10 });
 expect(v.safeParse(federationStatsInput, { limit: 0 }).success).toBe(false);
 const activity: unknown = JSON.parse('{"@context":["https://www.w3.org/ns/activitystreams"],"type":"Person","__proto__":{"nested":true},"constructor":null}');
 expect(v.parse(inlineApGetOutput, activity)).toEqual(activity);
 for (const bad of [new Date(), new Map(), { extension: undefined }, { extension: () => 1 }]) expect(v.safeParse(inlineApGetOutput, bad).success).toBe(false);
});

test('local AP renderer optional fields retain JSON wire omissions without admitting native objects', async () => {
 const service = mockDeep<ApResolverService>();
 const resolver = mockDeep<Awaited<ReturnType<ApResolverService['createResolver']>>>();
 service.createResolver.mockResolvedValue(resolver);
 resolver.resolve.mockResolvedValue({ type: 'Note', content: undefined, name: null, id: 'https://local.test/notes/note1' });
 const application = new ApGetApplicationService(service);
 expect(await application.execute({ uri: 'https://local.test/notes/note1' }, mockDeep<MiLocalUser>())).toEqual({ type: 'Note', name: null, id: 'https://local.test/notes/note1' });
});

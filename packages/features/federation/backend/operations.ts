/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { adminFederationDeleteAllFilesInput, adminFederationDeleteAllFilesOutput } from './endpoints/admin/federation/delete-all-files.contract.js';
import type { adminFederationRefreshRemoteInstanceMetadataInput, adminFederationRefreshRemoteInstanceMetadataOutput } from './endpoints/admin/federation/refresh-remote-instance-metadata.contract.js';
import type { adminFederationRemoveAllFollowingInput, adminFederationRemoveAllFollowingOutput } from './endpoints/admin/federation/remove-all-following.contract.js';
import type { adminFederationUpdateInstanceInput, adminFederationUpdateInstanceOutput } from './endpoints/admin/federation/update-instance.contract.js';
import type { adminRelaysAddInput, adminRelaysAddOutput } from './endpoints/admin/relays/add.contract.js';
import type { adminRelaysListInput, adminRelaysListOutput } from './endpoints/admin/relays/list.contract.js';
import type { adminRelaysRemoveInput, adminRelaysRemoveOutput } from './endpoints/admin/relays/remove.contract.js';
import type { apGetInput, apGetOutput } from './endpoints/ap/get.contract.js';
import type { apShowInput, apShowOutput } from './endpoints/ap/show.contract.js';
import type { federationFollowersInput, federationFollowersOutput } from './endpoints/federation/followers.contract.js';
import type { federationFollowingInput, federationFollowingOutput } from './endpoints/federation/following.contract.js';
import type { federationInstancesInput, federationInstancesOutput } from './endpoints/federation/instances.contract.js';
import type { federationShowInstanceInput, federationShowInstanceOutput } from './endpoints/federation/show-instance.contract.js';
import type { federationStatsInput, federationStatsOutput } from './endpoints/federation/stats.contract.js';
import type { federationUpdateRemoteUserInput, federationUpdateRemoteUserOutput } from './endpoints/federation/update-remote-user.contract.js';
import type { federationUsersInput, federationUsersOutput } from './endpoints/federation/users.contract.js';

export interface FederationOperations<Actor extends ApiActor> {
	adminFederationDeleteAllFiles(input: v.InferOutput<typeof adminFederationDeleteAllFilesInput>, actor: Actor): Promise<v.InferOutput<typeof adminFederationDeleteAllFilesOutput>>;
	adminFederationRefreshRemoteInstanceMetadata(input: v.InferOutput<typeof adminFederationRefreshRemoteInstanceMetadataInput>, actor: Actor): Promise<v.InferOutput<typeof adminFederationRefreshRemoteInstanceMetadataOutput>>;
	adminFederationRemoveAllFollowing(input: v.InferOutput<typeof adminFederationRemoveAllFollowingInput>, actor: Actor): Promise<v.InferOutput<typeof adminFederationRemoveAllFollowingOutput>>;
	adminFederationUpdateInstance(input: v.InferOutput<typeof adminFederationUpdateInstanceInput>, actor: Actor): Promise<v.InferOutput<typeof adminFederationUpdateInstanceOutput>>;
	adminRelaysAdd(input: v.InferOutput<typeof adminRelaysAddInput>, actor: Actor): Promise<v.InferOutput<typeof adminRelaysAddOutput>>;
	adminRelaysList(input: v.InferOutput<typeof adminRelaysListInput>, actor: Actor): Promise<v.InferOutput<typeof adminRelaysListOutput>>;
	adminRelaysRemove(input: v.InferOutput<typeof adminRelaysRemoveInput>, actor: Actor): Promise<v.InferOutput<typeof adminRelaysRemoveOutput>>;
	apGet(input: v.InferOutput<typeof apGetInput>, actor: Actor): Promise<v.InferOutput<typeof apGetOutput>>;
	apShow(input: v.InferOutput<typeof apShowInput>, actor: Actor): Promise<v.InferOutput<typeof apShowOutput>>;
	federationFollowers(input: v.InferOutput<typeof federationFollowersInput>, actor: Actor | null): Promise<v.InferOutput<typeof federationFollowersOutput>>;
	federationFollowing(input: v.InferOutput<typeof federationFollowingInput>, actor: Actor | null): Promise<v.InferOutput<typeof federationFollowingOutput>>;
	federationInstances(input: v.InferOutput<typeof federationInstancesInput>, actor: Actor | null): Promise<v.InferOutput<typeof federationInstancesOutput>>;
	federationShowInstance(input: v.InferOutput<typeof federationShowInstanceInput>, actor: Actor | null): Promise<v.InferOutput<typeof federationShowInstanceOutput>>;
	federationStats(input: v.InferOutput<typeof federationStatsInput>, actor: Actor | null): Promise<v.InferOutput<typeof federationStatsOutput>>;
	federationUpdateRemoteUser(input: v.InferOutput<typeof federationUpdateRemoteUserInput>, actor: Actor): Promise<v.InferOutput<typeof federationUpdateRemoteUserOutput>>;
	federationUsers(input: v.InferOutput<typeof federationUsersInput>, actor: Actor | null): Promise<v.InferOutput<typeof federationUsersOutput>>;
}
export type FederationContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { federation: FederationOperations<Actor> } };
export type FederationApplications<Actor extends ApiActor> = { [K in keyof FederationOperations<Actor>]: { execute: FederationOperations<Actor>[K] } };

export function createFederationOperations<Actor extends ApiActor>(applications: FederationApplications<Actor>): FederationOperations<Actor> {
	return {
		adminFederationDeleteAllFiles: (input, actor) => applications.adminFederationDeleteAllFiles.execute(input, actor),
		adminFederationRefreshRemoteInstanceMetadata: (input, actor) => applications.adminFederationRefreshRemoteInstanceMetadata.execute(input, actor),
		adminFederationRemoveAllFollowing: (input, actor) => applications.adminFederationRemoveAllFollowing.execute(input, actor),
		adminFederationUpdateInstance: (input, actor) => applications.adminFederationUpdateInstance.execute(input, actor),
		adminRelaysAdd: (input, actor) => applications.adminRelaysAdd.execute(input, actor),
		adminRelaysList: (input, actor) => applications.adminRelaysList.execute(input, actor),
		adminRelaysRemove: (input, actor) => applications.adminRelaysRemove.execute(input, actor),
		apGet: (input, actor) => applications.apGet.execute(input, actor),
		apShow: (input, actor) => applications.apShow.execute(input, actor),
		federationFollowers: (input, actor) => applications.federationFollowers.execute(input, actor),
		federationFollowing: (input, actor) => applications.federationFollowing.execute(input, actor),
		federationInstances: (input, actor) => applications.federationInstances.execute(input, actor),
		federationShowInstance: (input, actor) => applications.federationShowInstance.execute(input, actor),
		federationStats: (input, actor) => applications.federationStats.execute(input, actor),
		federationUpdateRemoteUser: (input, actor) => applications.federationUpdateRemoteUser.execute(input, actor),
		federationUsers: (input, actor) => applications.federationUsers.execute(input, actor),
	};
}

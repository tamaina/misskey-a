/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { AdminFederationDeleteAllFilesInput, AdminFederationDeleteAllFilesOutput } from './endpoints/admin/federation/delete-all-files.contract.js';
import type { AdminFederationRefreshRemoteInstanceMetadataInput, AdminFederationRefreshRemoteInstanceMetadataOutput } from './endpoints/admin/federation/refresh-remote-instance-metadata.contract.js';
import type { AdminFederationRemoveAllFollowingInput, AdminFederationRemoveAllFollowingOutput } from './endpoints/admin/federation/remove-all-following.contract.js';
import type { AdminFederationUpdateInstanceInput, AdminFederationUpdateInstanceOutput } from './endpoints/admin/federation/update-instance.contract.js';
import type { AdminRelaysAddInput, AdminRelaysAddOutput } from './endpoints/admin/relays/add.contract.js';
import type { AdminRelaysListInput, AdminRelaysListOutput } from './endpoints/admin/relays/list.contract.js';
import type { AdminRelaysRemoveInput, AdminRelaysRemoveOutput } from './endpoints/admin/relays/remove.contract.js';
import type { ApGetInput, ApGetOutput } from './endpoints/ap/get.contract.js';
import type { ApShowInput, ApShowOutput } from './endpoints/ap/show.contract.js';
import type { FederationFollowersInput, FederationFollowersOutput } from './endpoints/federation/followers.contract.js';
import type { FederationFollowingInput, FederationFollowingOutput } from './endpoints/federation/following.contract.js';
import type { FederationInstancesInput, FederationInstancesOutput } from './endpoints/federation/instances.contract.js';
import type { FederationShowInstanceInput, FederationShowInstanceOutput } from './endpoints/federation/show-instance.contract.js';
import type { FederationStatsInput, FederationStatsOutput } from './endpoints/federation/stats.contract.js';
import type { FederationUpdateRemoteUserInput, FederationUpdateRemoteUserOutput } from './endpoints/federation/update-remote-user.contract.js';
import type { FederationUsersInput, FederationUsersOutput } from './endpoints/federation/users.contract.js';

export interface FederationOperations<Actor extends ApiActor> {
	adminFederationDeleteAllFiles(input: AdminFederationDeleteAllFilesInput, actor: Actor): Promise<AdminFederationDeleteAllFilesOutput>;
	adminFederationRefreshRemoteInstanceMetadata(input: AdminFederationRefreshRemoteInstanceMetadataInput, actor: Actor): Promise<AdminFederationRefreshRemoteInstanceMetadataOutput>;
	adminFederationRemoveAllFollowing(input: AdminFederationRemoveAllFollowingInput, actor: Actor): Promise<AdminFederationRemoveAllFollowingOutput>;
	adminFederationUpdateInstance(input: AdminFederationUpdateInstanceInput, actor: Actor): Promise<AdminFederationUpdateInstanceOutput>;
	adminRelaysAdd(input: AdminRelaysAddInput, actor: Actor): Promise<AdminRelaysAddOutput>;
	adminRelaysList(input: AdminRelaysListInput, actor: Actor): Promise<AdminRelaysListOutput>;
	adminRelaysRemove(input: AdminRelaysRemoveInput, actor: Actor): Promise<AdminRelaysRemoveOutput>;
	apGet(input: ApGetInput, actor: Actor): Promise<ApGetOutput>;
	apShow(input: ApShowInput, actor: Actor): Promise<ApShowOutput>;
	federationFollowers(input: FederationFollowersInput, actor: Actor | null): Promise<FederationFollowersOutput>;
	federationFollowing(input: FederationFollowingInput, actor: Actor | null): Promise<FederationFollowingOutput>;
	federationInstances(input: FederationInstancesInput, actor: Actor | null): Promise<FederationInstancesOutput>;
	federationShowInstance(input: FederationShowInstanceInput, actor: Actor | null): Promise<FederationShowInstanceOutput>;
	federationStats(input: FederationStatsInput, actor: Actor | null): Promise<FederationStatsOutput>;
	federationUpdateRemoteUser(input: FederationUpdateRemoteUserInput, actor: Actor): Promise<FederationUpdateRemoteUserOutput>;
	federationUsers(input: FederationUsersInput, actor: Actor | null): Promise<FederationUsersOutput>;
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

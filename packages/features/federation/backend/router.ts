/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { FederationDependencies } from './api.dependencies.js';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { federationContract } from './api.contract.js';
import { createAdminFederationDeleteAllFilesProcedure } from './endpoints/admin/federation/delete-all-files.js';
import { createAdminFederationRefreshRemoteInstanceMetadataProcedure } from './endpoints/admin/federation/refresh-remote-instance-metadata.js';
import { createAdminFederationRemoveAllFollowingProcedure } from './endpoints/admin/federation/remove-all-following.js';
import { createAdminFederationUpdateInstanceProcedure } from './endpoints/admin/federation/update-instance.js';
import { createAdminRelaysAddProcedure } from './endpoints/admin/relays/add.js';
import { createAdminRelaysListProcedure } from './endpoints/admin/relays/list.js';
import { createAdminRelaysRemoveProcedure } from './endpoints/admin/relays/remove.js';
import { createApGetProcedure } from './endpoints/ap/get.js';
import { createApShowProcedure } from './endpoints/ap/show.js';
import { createFederationFollowersProcedure } from './endpoints/federation/followers.js';
import { createFederationFollowingProcedure } from './endpoints/federation/following.js';
import { createFederationInstancesProcedure } from './endpoints/federation/instances.js';
import { createFederationShowInstanceProcedure } from './endpoints/federation/show-instance.js';
import { createFederationStatsProcedure } from './endpoints/federation/stats.js';
import { createFederationUpdateRemoteUserProcedure } from './endpoints/federation/update-remote-user.js';
import { createFederationUsersProcedure } from './endpoints/federation/users.js';
export function createFederationRouter<Actor extends ApiActor>(deps: FederationDependencies) {
	return implement(federationContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		adminFederationDeleteAllFiles: createAdminFederationDeleteAllFilesProcedure<Actor>(deps),
		adminFederationRefreshRemoteInstanceMetadata: createAdminFederationRefreshRemoteInstanceMetadataProcedure<Actor>(deps),
		adminFederationRemoveAllFollowing: createAdminFederationRemoveAllFollowingProcedure<Actor>({ ...deps, followingsRepository: deps.removeAllFollowingsRepository }),
		adminFederationUpdateInstance: createAdminFederationUpdateInstanceProcedure<Actor>(deps),
		adminRelaysAdd: createAdminRelaysAddProcedure<Actor>(deps),
		adminRelaysList: createAdminRelaysListProcedure<Actor>(deps),
		adminRelaysRemove: createAdminRelaysRemoveProcedure<Actor>(deps),
		apGet: createApGetProcedure<Actor>(deps),
		apShow: createApShowProcedure<Actor>(deps),
		federationFollowers: createFederationFollowersProcedure<Actor>(deps),
		federationFollowing: createFederationFollowingProcedure<Actor>(deps),
		federationInstances: createFederationInstancesProcedure<Actor>(deps),
		federationShowInstance: createFederationShowInstanceProcedure<Actor>(deps),
		federationStats: createFederationStatsProcedure<Actor>(deps),
		federationUpdateRemoteUser: createFederationUpdateRemoteUserProcedure<Actor>(deps),
		federationUsers: createFederationUsersProcedure<Actor>(deps),
	});
}

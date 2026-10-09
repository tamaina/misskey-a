/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { FederationContext } from './operations.js';
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

export function createFederationRouter<Actor extends ApiActor>() {
	return implement(federationContract).$context<FederationContext<Actor>>().router({
		adminFederationDeleteAllFiles: createAdminFederationDeleteAllFilesProcedure<Actor>(),
		adminFederationRefreshRemoteInstanceMetadata: createAdminFederationRefreshRemoteInstanceMetadataProcedure<Actor>(),
		adminFederationRemoveAllFollowing: createAdminFederationRemoveAllFollowingProcedure<Actor>(),
		adminFederationUpdateInstance: createAdminFederationUpdateInstanceProcedure<Actor>(),
		adminRelaysAdd: createAdminRelaysAddProcedure<Actor>(),
		adminRelaysList: createAdminRelaysListProcedure<Actor>(),
		adminRelaysRemove: createAdminRelaysRemoveProcedure<Actor>(),
		apGet: createApGetProcedure<Actor>(),
		apShow: createApShowProcedure<Actor>(),
		federationFollowers: createFederationFollowersProcedure<Actor>(),
		federationFollowing: createFederationFollowingProcedure<Actor>(),
		federationInstances: createFederationInstancesProcedure<Actor>(),
		federationShowInstance: createFederationShowInstanceProcedure<Actor>(),
		federationStats: createFederationStatsProcedure<Actor>(),
		federationUpdateRemoteUser: createFederationUpdateRemoteUserProcedure<Actor>(),
		federationUsers: createFederationUsersProcedure<Actor>(),
	});
}

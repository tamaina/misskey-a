/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adminFederationDeleteAllFilesContract } from './endpoints/admin/federation/delete-all-files.contract.js';
import { adminFederationRefreshRemoteInstanceMetadataContract } from './endpoints/admin/federation/refresh-remote-instance-metadata.contract.js';
import { adminFederationRemoveAllFollowingContract } from './endpoints/admin/federation/remove-all-following.contract.js';
import { adminFederationUpdateInstanceContract } from './endpoints/admin/federation/update-instance.contract.js';
import { adminRelaysAddContract } from './endpoints/admin/relays/add.contract.js';
import { adminRelaysListContract } from './endpoints/admin/relays/list.contract.js';
import { adminRelaysRemoveContract } from './endpoints/admin/relays/remove.contract.js';
import { apGetContract } from './endpoints/ap/get.contract.js';
import { apShowContract } from './endpoints/ap/show.contract.js';
import { federationFollowersContract } from './endpoints/federation/followers.contract.js';
import { federationFollowingContract } from './endpoints/federation/following.contract.js';
import { federationInstancesContract } from './endpoints/federation/instances.contract.js';
import { federationShowInstanceContract } from './endpoints/federation/show-instance.contract.js';
import { federationStatsContract } from './endpoints/federation/stats.contract.js';
import { federationUpdateRemoteUserContract } from './endpoints/federation/update-remote-user.contract.js';
import { federationUsersContract } from './endpoints/federation/users.contract.js';

export const federationContract = {
	adminFederationDeleteAllFiles: adminFederationDeleteAllFilesContract,
	adminFederationRefreshRemoteInstanceMetadata: adminFederationRefreshRemoteInstanceMetadataContract,
	adminFederationRemoveAllFollowing: adminFederationRemoveAllFollowingContract,
	adminFederationUpdateInstance: adminFederationUpdateInstanceContract,
	adminRelaysAdd: adminRelaysAddContract,
	adminRelaysList: adminRelaysListContract,
	adminRelaysRemove: adminRelaysRemoveContract,
	apGet: apGetContract,
	apShow: apShowContract,
	federationFollowers: federationFollowersContract,
	federationFollowing: federationFollowingContract,
	federationInstances: federationInstancesContract,
	federationShowInstance: federationShowInstanceContract,
	federationStats: federationStatsContract,
	federationUpdateRemoteUser: federationUpdateRemoteUserContract,
	federationUsers: federationUsersContract,
};

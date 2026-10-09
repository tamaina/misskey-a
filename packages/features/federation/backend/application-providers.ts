/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AdminFederationDeleteAllFilesApplicationService } from './endpoints/admin/federation/delete-all-files.application.js';
import { AdminFederationRefreshRemoteInstanceMetadataApplicationService } from './endpoints/admin/federation/refresh-remote-instance-metadata.application.js';
import { AdminFederationRemoveAllFollowingApplicationService } from './endpoints/admin/federation/remove-all-following.application.js';
import { AdminFederationUpdateInstanceApplicationService } from './endpoints/admin/federation/update-instance.application.js';
import { AdminRelaysAddApplicationService } from './endpoints/admin/relays/add.application.js';
import { AdminRelaysListApplicationService } from './endpoints/admin/relays/list.application.js';
import { AdminRelaysRemoveApplicationService } from './endpoints/admin/relays/remove.application.js';
import { ApGetApplicationService } from './endpoints/ap/get.application.js';
import { ApShowApplicationService } from './endpoints/ap/show.application.js';
import { FederationFollowersApplicationService } from './endpoints/federation/followers.application.js';
import { FederationFollowingApplicationService } from './endpoints/federation/following.application.js';
import { FederationInstancesApplicationService } from './endpoints/federation/instances.application.js';
import { FederationShowInstanceApplicationService } from './endpoints/federation/show-instance.application.js';
import { FederationStatsApplicationService } from './endpoints/federation/stats.application.js';
import { FederationUpdateRemoteUserApplicationService } from './endpoints/federation/update-remote-user.application.js';
import { FederationUsersApplicationService } from './endpoints/federation/users.application.js';

export const federationApplicationProviders = [
	AdminFederationDeleteAllFilesApplicationService,
	AdminFederationRefreshRemoteInstanceMetadataApplicationService,
	AdminFederationRemoveAllFollowingApplicationService,
	AdminFederationUpdateInstanceApplicationService,
	AdminRelaysAddApplicationService,
	AdminRelaysListApplicationService,
	AdminRelaysRemoveApplicationService,
	ApGetApplicationService,
	ApShowApplicationService,
	FederationFollowersApplicationService,
	FederationFollowingApplicationService,
	FederationInstancesApplicationService,
	FederationShowInstanceApplicationService,
	FederationStatsApplicationService,
	FederationUpdateRemoteUserApplicationService,
	FederationUsersApplicationService,
];
export const federationApplicationMap = {
	adminFederationDeleteAllFiles: AdminFederationDeleteAllFilesApplicationService,
	adminFederationRefreshRemoteInstanceMetadata: AdminFederationRefreshRemoteInstanceMetadataApplicationService,
	adminFederationRemoveAllFollowing: AdminFederationRemoveAllFollowingApplicationService,
	adminFederationUpdateInstance: AdminFederationUpdateInstanceApplicationService,
	adminRelaysAdd: AdminRelaysAddApplicationService,
	adminRelaysList: AdminRelaysListApplicationService,
	adminRelaysRemove: AdminRelaysRemoveApplicationService,
	apGet: ApGetApplicationService,
	apShow: ApShowApplicationService,
	federationFollowers: FederationFollowersApplicationService,
	federationFollowing: FederationFollowingApplicationService,
	federationInstances: FederationInstancesApplicationService,
	federationShowInstance: FederationShowInstanceApplicationService,
	federationStats: FederationStatsApplicationService,
	federationUpdateRemoteUser: FederationUpdateRemoteUserApplicationService,
	federationUsers: FederationUsersApplicationService,
};

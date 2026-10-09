/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { AdminFederationDeleteAllFilesDependencies } from './endpoints/admin/federation/delete-all-files.js';
import type { AdminFederationRefreshRemoteInstanceMetadataDependencies } from './endpoints/admin/federation/refresh-remote-instance-metadata.js';
import type { AdminFederationRemoveAllFollowingDependencies } from './endpoints/admin/federation/remove-all-following.js';
import type { AdminFederationUpdateInstanceDependencies } from './endpoints/admin/federation/update-instance.js';
import type { AdminRelaysAddDependencies } from './endpoints/admin/relays/add.js';
import type { AdminRelaysListDependencies } from './endpoints/admin/relays/list.js';
import type { AdminRelaysRemoveDependencies } from './endpoints/admin/relays/remove.js';
import type { ApGetDependencies } from './endpoints/ap/get.js';
import type { ApShowDependencies } from './endpoints/ap/show.js';
import type { FederationFollowersDependencies } from './endpoints/federation/followers.js';
import type { FederationFollowingDependencies } from './endpoints/federation/following.js';
import type { FederationInstancesDependencies } from './endpoints/federation/instances.js';
import type { FederationShowInstanceDependencies } from './endpoints/federation/show-instance.js';
import type { FederationStatsDependencies } from './endpoints/federation/stats.js';
import type { FederationUpdateRemoteUserDependencies } from './endpoints/federation/update-remote-user.js';
import type { FederationUsersDependencies } from './endpoints/federation/users.js';
export type FederationDependencies = AdminFederationDeleteAllFilesDependencies
	& AdminFederationRefreshRemoteInstanceMetadataDependencies
	& AdminFederationRemoveAllFollowingDependencies
	& AdminFederationUpdateInstanceDependencies
	& AdminRelaysAddDependencies
	& AdminRelaysListDependencies
	& AdminRelaysRemoveDependencies
	& ApGetDependencies
	& ApShowDependencies
	& FederationFollowersDependencies
	& FederationFollowingDependencies
	& FederationInstancesDependencies
	& FederationShowInstanceDependencies
	& FederationStatsDependencies
	& FederationUpdateRemoteUserDependencies
	& FederationUsersDependencies
	& { removeAllFollowingsRepository: AdminFederationRemoveAllFollowingDependencies['followingsRepository'] };

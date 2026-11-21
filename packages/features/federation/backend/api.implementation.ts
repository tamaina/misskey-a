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
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { federationContract } from './api.definition.js';
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
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveFilesRepository, InstancesRepository, UsersRepository, FollowingsRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from '@features/drive/backend/services/DriveService.js';
import { UtilityService } from './services/UtilityService.js';
import { FetchInstanceMetadataService } from './services/FetchInstanceMetadataService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { FederatedInstanceService } from './services/FederatedInstanceService.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { RelayService } from './services/RelayService.js';
import { ApResolverService } from './services/ApResolverService.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { ApDbResolverService } from './services/ApDbResolverService.js';
import { ApPersonService } from './services/ApPersonService.js';
import { ApNoteService } from './services/ApNoteService.js';
import { FollowingEntityService } from '@features/relationships/backend/serializers/FollowingEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { InstanceEntityService } from '@features/instance/backend/serializers/InstanceEntityService.js';
import { MetaService } from '@features/instance/backend/services/MetaService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';

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

type FederationRouter = ReturnType<typeof createFederationRouter<MiLocalUser>>;

/** Compose once at root registration, after all domain initialization hooks. */
@Injectable()
export class FederationApiProvider {
	private router: FederationRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): FederationRouter {
		if (this.router !== undefined) return this.router;
		this.router = createFederationRouter<MiLocalUser>({
			driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
			driveService: this.moduleRef.get(DriveService, { strict: false }),
			instancesRepository: this.moduleRef.get<InstancesRepository>(DI.instancesRepository, { strict: false }),
			utilityService: this.moduleRef.get(UtilityService, { strict: false }),
			fetchInstanceMetadataService: this.moduleRef.get(FetchInstanceMetadataService, { strict: false }),
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
			removeAllFollowingsRepository: this.moduleRef.get<FollowingsRepository>(DI.notesRepository, { strict: false }),
			queueService: this.moduleRef.get(QueueService, { strict: false }),
			federatedInstanceService: this.moduleRef.get(FederatedInstanceService, { strict: false }),
			moderationLogService: this.moduleRef.get(ModerationLogService, { strict: false }),
			relayService: this.moduleRef.get(RelayService, { strict: false }),
			apResolverService: this.moduleRef.get(ApResolverService, { strict: false }),
			userEntityService: this.moduleRef.get(UserEntityService, { strict: false }),
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			apDbResolverService: this.moduleRef.get(ApDbResolverService, { strict: false }),
			apPersonService: this.moduleRef.get(ApPersonService, { strict: false }),
			apNoteService: this.moduleRef.get(ApNoteService, { strict: false }),
			followingsRepository: this.moduleRef.get<FollowingsRepository>(DI.followingsRepository, { strict: false }),
			followingEntityService: this.moduleRef.get(FollowingEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			instanceEntityService: this.moduleRef.get(InstanceEntityService, { strict: false }),
			metaService: this.moduleRef.get(MetaService, { strict: false }),
			getterService: this.moduleRef.get(GetterService, { strict: false }),
		});
		return this.router;
	}
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { DriveFilesRepository, InstancesRepository, UsersRepository, FollowingsRepository } from './../../persistence/backend/repositories/models.js';
import { DriveService } from './../../drive/backend/services/DriveService.js';
import { UtilityService } from './services/UtilityService.js';
import { FetchInstanceMetadataService } from './services/FetchInstanceMetadataService.js';
import { QueueService } from './../../runtime/backend/services/QueueService.js';
import { FederatedInstanceService } from './services/FederatedInstanceService.js';
import { ModerationLogService } from './../../moderation/backend/services/ModerationLogService.js';
import { RelayService } from './services/RelayService.js';
import { ApResolverService } from './services/ApResolverService.js';
import { UserEntityService } from './../../users/backend/serializers/UserEntityService.js';
import { NoteEntityService } from './../../notes/backend/serializers/NoteEntityService.js';
import { ApDbResolverService } from './services/ApDbResolverService.js';
import { ApPersonService } from './services/ApPersonService.js';
import { ApNoteService } from './services/ApNoteService.js';
import { FollowingEntityService } from './../../relationships/backend/serializers/FollowingEntityService.js';
import { QueryService } from './../../notes/backend/services/QueryService.js';
import { RoleService } from './../../roles/backend/services/RoleService.js';
import { InstanceEntityService } from './../../instance/backend/serializers/InstanceEntityService.js';
import { MetaService } from './../../instance/backend/services/MetaService.js';
import { GetterService } from './../../api/backend/transport/GetterService.js';
import { createFederationRouter } from './router.js';
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

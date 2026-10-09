/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveService } from './services/DriveService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { DriveFileEntityService } from './serializers/DriveFileEntityService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { DriveFileSelectorRepository } from './selector.repository.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import type { ChatMessagesRepository } from '@features/persistence/backend/repositories/models.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { DriveFolderEntityService } from './serializers/DriveFolderEntityService.js';
import { createDriveManagementRouter } from './management.router.js';
type FeatureRouter = ReturnType<typeof createDriveManagementRouter>;
@Injectable()
export class DriveManagementApiProvider {
	private router: FeatureRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): FeatureRouter {
		if (this.router !== undefined) return this.router;
		this.router = createDriveManagementRouter({
			driveFilesRepository: this.moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false }),
			driveService: this.moduleRef.get(DriveService, { strict: false }),
			queueService: this.moduleRef.get(QueueService, { strict: false }),
			driveFileEntityService: this.moduleRef.get(DriveFileEntityService, { strict: false }),
			queryService: this.moduleRef.get(QueryService, { strict: false }),
			driveFileSelectorRepository: this.moduleRef.get<DriveFileSelectorRepository>(DI.driveFilesRepository, { strict: false }),
			usersRepository: this.moduleRef.get<UsersRepository>(DI.usersRepository, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
			chatMessagesRepository: this.moduleRef.get<ChatMessagesRepository>(DI.chatMessagesRepository, { strict: false }),
			chatService: this.moduleRef.get(ChatService, { strict: false }),
			chatEntityService: this.moduleRef.get(ChatEntityService, { strict: false }),
			notesRepository: this.moduleRef.get<NotesRepository>(DI.notesRepository, { strict: false }),
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			globalEventService: this.moduleRef.get(GlobalEventService, { strict: false }),
			driveFoldersRepository: this.moduleRef.get<DriveFoldersRepository>(DI.driveFoldersRepository, { strict: false }),
			driveFolderEntityService: this.moduleRef.get(DriveFolderEntityService, { strict: false }),
		});
		return this.router;
	}
}

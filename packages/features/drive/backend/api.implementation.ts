/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { drivePilotContract } from './endpoints/drive/files/create.contract.js';
import { createDriveFileProcedure } from './endpoints/drive/files/create.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { CreateFileDependencies } from './create-file.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { MiDriveFile } from './models/DriveFile.js';
import { DriveService } from './services/DriveService.js';
import { DriveFileEntityService } from './serializers/DriveFileEntityService.js';
import type { DriveFilesRepository, UsersRepository, ChatMessagesRepository, NotesRepository, DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { DriveFileSelectorRepository } from './selector.repository.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { ChatService } from '@features/chat/backend/services/ChatService.js';
import { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import { DriveFolderEntityService } from './serializers/DriveFolderEntityService.js';
import { driveManagementContract } from './api.definition.js';
import { createAdminDeleteAllFilesOfAUserProcedure } from './endpoints/admin/delete-all-files-of-a-user.js';
import { createAdminDriveCleanRemoteFilesProcedure } from './endpoints/admin/drive/clean-remote-files.js';
import { createAdminDriveCleanupProcedure } from './endpoints/admin/drive/cleanup.js';
import { createAdminDriveFilesProcedure } from './endpoints/admin/drive/files.js';
import { createAdminDriveShowFileProcedure } from './endpoints/admin/drive/show-file.js';
import { createDriveFilesAttachedChatMessagesProcedure } from './endpoints/drive/files/attached-chat-messages.js';
import { createDriveFilesAttachedNotesProcedure } from './endpoints/drive/files/attached-notes.js';
import { createDriveFilesCheckExistenceProcedure } from './endpoints/drive/files/check-existence.js';
import { createDriveFilesDeleteProcedure } from './endpoints/drive/files/delete.js';
import { createDriveFilesFindByHashProcedure } from './endpoints/drive/files/find-by-hash.js';
import { createDriveFilesFindProcedure } from './endpoints/drive/files/find.js';
import { createDriveFilesMoveBulkProcedure } from './endpoints/drive/files/move-bulk.js';
import { createDriveFilesShowProcedure } from './endpoints/drive/files/show.js';
import { createDriveFilesUpdateProcedure } from './endpoints/drive/files/update.js';
import { createDriveFilesUploadFromUrlProcedure } from './endpoints/drive/files/upload-from-url.js';
import { createDriveFilesProcedure } from './endpoints/drive/files.js';
import { createDriveFoldersCreateProcedure } from './endpoints/drive/folders/create.js';
import { createDriveFoldersDeleteProcedure } from './endpoints/drive/folders/delete.js';
import { createDriveFoldersFindProcedure } from './endpoints/drive/folders/find.js';
import { createDriveFoldersShowProcedure } from './endpoints/drive/folders/show.js';
import { createDriveFoldersUpdateProcedure } from './endpoints/drive/folders/update.js';
import { createDriveFoldersProcedure } from './endpoints/drive/folders.js';
import { createDriveStreamProcedure } from './endpoints/drive/stream.js';
import { createDriveProcedure } from './endpoints/drive.js';

export function createDriveRouter<Actor extends ApiActor, File>(deps: CreateFileDependencies<Actor, File>) {
	return implement(drivePilotContract).$context<ApiContext<Actor>>().router({ files: { create: createDriveFileProcedure(deps) } });
}

type DriveRouter = ReturnType<typeof createDriveRouter<MiLocalUser, MiDriveFile>>;

@Injectable()
export class DriveApiProvider {
	private router: DriveRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): DriveRouter {
		if (this.router !== undefined) return this.router;
		const settings = this.moduleRef.get<MiMeta>(DI.meta, { strict: false });
		const drive = this.moduleRef.get(DriveService, { strict: false });
		const files = this.moduleRef.get(DriveFileEntityService, { strict: false });
		this.router = createDriveRouter<MiLocalUser, MiDriveFile>({
			validateFileName: name => files.validateFileName(name),
			enableIpLogging: () => settings.enableIpLogging,
			addFile: options => drive.addFile(options),
			pack: file => files.pack(file, { self: true }),
			logError: error => { if (error instanceof Error || typeof error === 'string') console.error(error); },
		});
		return this.router;
	}
}

export interface DriveManagementDependencies {
	driveFilesRepository: DriveFilesRepository;
	driveService: Pick<DriveService, 'deleteFile' | 'moveFiles' | 'updateFile' | 'uploadFromUrl'>;
	queueService: Pick<QueueService, 'createCleanRemoteFilesJob'>;
	driveFileEntityService: Pick<DriveFileEntityService, 'packMany' | 'pack' | 'calcDriveUsageOf'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	driveFileSelectorRepository: DriveFileSelectorRepository;
	usersRepository: UsersRepository;
	roleService: Pick<RoleService, 'isModerator' | 'getUserPolicies'>;
	idService: Pick<IdService, 'parse' | 'gen'>;
	chatMessagesRepository: ChatMessagesRepository;
	chatService: Pick<ChatService, 'checkChatAvailability'>;
	chatEntityService: Pick<ChatEntityService, 'packMessagesDetailed'>;
	notesRepository: NotesRepository;
	noteEntityService: Pick<NoteEntityService, 'packMany'>;
	globalEventService: Pick<GlobalEventService, 'publishMainStream' | 'publishDriveStream'>;
	driveFoldersRepository: DriveFoldersRepository;
	driveFolderEntityService: Pick<DriveFolderEntityService, 'pack'>;
}

export function createDriveManagementRouter(deps: DriveManagementDependencies) {
	return implement(driveManagementContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>().router({
		'admin/delete-all-files-of-a-user': createAdminDeleteAllFilesOfAUserProcedure(deps),
		'admin/drive/clean-remote-files': createAdminDriveCleanRemoteFilesProcedure(deps),
		'admin/drive/cleanup': createAdminDriveCleanupProcedure(deps),
		'admin/drive/files': createAdminDriveFilesProcedure(deps),
		'admin/drive/show-file': createAdminDriveShowFileProcedure(deps),
		'drive/files/attached-chat-messages': createDriveFilesAttachedChatMessagesProcedure(deps),
		'drive/files/attached-notes': createDriveFilesAttachedNotesProcedure(deps),
		'drive/files/check-existence': createDriveFilesCheckExistenceProcedure(deps),
		'drive/files/delete': createDriveFilesDeleteProcedure(deps),
		'drive/files/find-by-hash': createDriveFilesFindByHashProcedure(deps),
		'drive/files/find': createDriveFilesFindProcedure(deps),
		'drive/files/move-bulk': createDriveFilesMoveBulkProcedure(deps),
		'drive/files/show': createDriveFilesShowProcedure(deps),
		'drive/files/update': createDriveFilesUpdateProcedure(deps),
		'drive/files/upload-from-url': createDriveFilesUploadFromUrlProcedure(deps),
		'drive/files': createDriveFilesProcedure(deps),
		'drive/folders/create': createDriveFoldersCreateProcedure(deps),
		'drive/folders/delete': createDriveFoldersDeleteProcedure(deps),
		'drive/folders/find': createDriveFoldersFindProcedure(deps),
		'drive/folders/show': createDriveFoldersShowProcedure(deps),
		'drive/folders/update': createDriveFoldersUpdateProcedure(deps),
		'drive/folders': createDriveFoldersProcedure(deps),
		'drive/stream': createDriveStreamProcedure(deps),
		'drive': createDriveProcedure(deps),
	});
}

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

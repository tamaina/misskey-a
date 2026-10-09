/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { DriveService } from './services/DriveService.js';
import type { QueueService } from '@features/runtime/backend/services/QueueService.js';
import type { DriveFileEntityService } from './serializers/DriveFileEntityService.js';
import type { QueryService } from '@features/notes/backend/services/QueryService.js';
import type { DriveFileSelectorRepository } from './selector.repository.js';
import type { UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { RoleService } from '@features/roles/backend/services/RoleService.js';
import type { IdService } from '@features/runtime/backend/services/IdService.js';
import type { ChatMessagesRepository } from '@features/persistence/backend/repositories/models.js';
import type { ChatService } from '@features/chat/backend/services/ChatService.js';
import type { ChatEntityService } from '@features/chat/backend/serializers/ChatEntityService.js';
import type { NotesRepository } from '@features/persistence/backend/repositories/models.js';
import type { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { DriveFoldersRepository } from '@features/persistence/backend/repositories/models.js';
import type { DriveFolderEntityService } from './serializers/DriveFolderEntityService.js';
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

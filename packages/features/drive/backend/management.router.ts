/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { driveManagementContract } from './management.contract.js';
import type { DriveManagementDependencies } from './management.dependencies.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
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

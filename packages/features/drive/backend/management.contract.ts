/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { InferContractRouterOutputs } from '@orpc/contract';
import { adminDeleteAllFilesOfAUserContract, adminDeleteAllFilesOfAUserInput } from './endpoints/admin/delete-all-files-of-a-user.contract.js';
import { adminDriveCleanRemoteFilesContract, adminDriveCleanRemoteFilesInput } from './endpoints/admin/drive/clean-remote-files.contract.js';
import { adminDriveCleanupContract, adminDriveCleanupInput } from './endpoints/admin/drive/cleanup.contract.js';
import { adminDriveFilesContract, adminDriveFilesInput } from './endpoints/admin/drive/files.contract.js';
import { adminDriveShowFileContract, adminDriveShowFileInput } from './endpoints/admin/drive/show-file.contract.js';
import { driveContract, driveInput } from './endpoints/drive.contract.js';
import { driveFilesContract, driveFilesInput } from './endpoints/drive/files.contract.js';
import { driveFilesAttachedNotesContract, driveFilesAttachedNotesInput } from './endpoints/drive/files/attached-notes.contract.js';
import { driveFilesAttachedChatMessagesContract, driveFilesAttachedChatMessagesInput } from './endpoints/drive/files/attached-chat-messages.contract.js';
import { driveFilesCheckExistenceContract, driveFilesCheckExistenceInput } from './endpoints/drive/files/check-existence.contract.js';
import { driveFilesDeleteContract, driveFilesDeleteInput } from './endpoints/drive/files/delete.contract.js';
import { driveFilesFindContract, driveFilesFindInput } from './endpoints/drive/files/find.contract.js';
import { driveFilesFindByHashContract, driveFilesFindByHashInput } from './endpoints/drive/files/find-by-hash.contract.js';
import { driveFilesShowContract, driveFilesShowInput } from './endpoints/drive/files/show.contract.js';
import { driveFilesUpdateContract, driveFilesUpdateInput } from './endpoints/drive/files/update.contract.js';
import { driveFilesMoveBulkContract, driveFilesMoveBulkInput } from './endpoints/drive/files/move-bulk.contract.js';
import { driveFilesUploadFromUrlContract, driveFilesUploadFromUrlInput } from './endpoints/drive/files/upload-from-url.contract.js';
import { driveFoldersContract, driveFoldersInput } from './endpoints/drive/folders.contract.js';
import { driveFoldersCreateContract, driveFoldersCreateInput } from './endpoints/drive/folders/create.contract.js';
import { driveFoldersDeleteContract, driveFoldersDeleteInput } from './endpoints/drive/folders/delete.contract.js';
import { driveFoldersFindContract, driveFoldersFindInput } from './endpoints/drive/folders/find.contract.js';
import { driveFoldersShowContract, driveFoldersShowInput } from './endpoints/drive/folders/show.contract.js';
import { driveFoldersUpdateContract, driveFoldersUpdateInput } from './endpoints/drive/folders/update.contract.js';
import { driveStreamContract, driveStreamInput } from './endpoints/drive/stream.contract.js';

export const driveManagementContract = {
	'admin/delete-all-files-of-a-user': adminDeleteAllFilesOfAUserContract,
	'admin/drive/clean-remote-files': adminDriveCleanRemoteFilesContract,
	'admin/drive/cleanup': adminDriveCleanupContract,
	'admin/drive/files': adminDriveFilesContract,
	'admin/drive/show-file': adminDriveShowFileContract,
	'drive': driveContract,
	'drive/files': driveFilesContract,
	'drive/files/attached-notes': driveFilesAttachedNotesContract,
	'drive/files/attached-chat-messages': driveFilesAttachedChatMessagesContract,
	'drive/files/check-existence': driveFilesCheckExistenceContract,
	'drive/files/delete': driveFilesDeleteContract,
	'drive/files/find': driveFilesFindContract,
	'drive/files/find-by-hash': driveFilesFindByHashContract,
	'drive/files/show': driveFilesShowContract,
	'drive/files/update': driveFilesUpdateContract,
	'drive/files/move-bulk': driveFilesMoveBulkContract,
	'drive/files/upload-from-url': driveFilesUploadFromUrlContract,
	'drive/folders': driveFoldersContract,
	'drive/folders/create': driveFoldersCreateContract,
	'drive/folders/delete': driveFoldersDeleteContract,
	'drive/folders/find': driveFoldersFindContract,
	'drive/folders/show': driveFoldersShowContract,
	'drive/folders/update': driveFoldersUpdateContract,
	'drive/stream': driveStreamContract,
};
export interface DriveManagementInputs {
	'admin/delete-all-files-of-a-user': v.InferOutput<typeof adminDeleteAllFilesOfAUserInput>;
	'admin/drive/clean-remote-files': v.InferOutput<typeof adminDriveCleanRemoteFilesInput>;
	'admin/drive/cleanup': v.InferOutput<typeof adminDriveCleanupInput>;
	'admin/drive/files': v.InferOutput<typeof adminDriveFilesInput>;
	'admin/drive/show-file': v.InferOutput<typeof adminDriveShowFileInput>;
	'drive': v.InferOutput<typeof driveInput>;
	'drive/files': v.InferOutput<typeof driveFilesInput>;
	'drive/files/attached-notes': v.InferOutput<typeof driveFilesAttachedNotesInput>;
	'drive/files/attached-chat-messages': v.InferOutput<typeof driveFilesAttachedChatMessagesInput>;
	'drive/files/check-existence': v.InferOutput<typeof driveFilesCheckExistenceInput>;
	'drive/files/delete': v.InferOutput<typeof driveFilesDeleteInput>;
	'drive/files/find': v.InferOutput<typeof driveFilesFindInput>;
	'drive/files/find-by-hash': v.InferOutput<typeof driveFilesFindByHashInput>;
	'drive/files/show': v.InferOutput<typeof driveFilesShowInput>;
	'drive/files/update': v.InferOutput<typeof driveFilesUpdateInput>;
	'drive/files/move-bulk': v.InferOutput<typeof driveFilesMoveBulkInput>;
	'drive/files/upload-from-url': v.InferOutput<typeof driveFilesUploadFromUrlInput>;
	'drive/folders': v.InferOutput<typeof driveFoldersInput>;
	'drive/folders/create': v.InferOutput<typeof driveFoldersCreateInput>;
	'drive/folders/delete': v.InferOutput<typeof driveFoldersDeleteInput>;
	'drive/folders/find': v.InferOutput<typeof driveFoldersFindInput>;
	'drive/folders/show': v.InferOutput<typeof driveFoldersShowInput>;
	'drive/folders/update': v.InferOutput<typeof driveFoldersUpdateInput>;
	'drive/stream': v.InferOutput<typeof driveStreamInput>;
}
export type DriveManagementOutputs = InferContractRouterOutputs<typeof driveManagementContract>;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';
import { adminDeleteAllFilesOfAUserContract } from './endpoints/admin/delete-all-files-of-a-user.contract.js';
import { adminDriveCleanRemoteFilesContract } from './endpoints/admin/drive/clean-remote-files.contract.js';
import { adminDriveCleanupContract } from './endpoints/admin/drive/cleanup.contract.js';
import { adminDriveFilesContract } from './endpoints/admin/drive/files.contract.js';
import { adminDriveShowFileContract } from './endpoints/admin/drive/show-file.contract.js';
import { driveContract } from './endpoints/drive.contract.js';
import { driveFilesContract } from './endpoints/drive/files.contract.js';
import { driveFilesAttachedNotesContract } from './endpoints/drive/files/attached-notes.contract.js';
import { driveFilesAttachedChatMessagesContract } from './endpoints/drive/files/attached-chat-messages.contract.js';
import { driveFilesCheckExistenceContract } from './endpoints/drive/files/check-existence.contract.js';
import { driveFilesDeleteContract } from './endpoints/drive/files/delete.contract.js';
import { driveFilesFindContract } from './endpoints/drive/files/find.contract.js';
import { driveFilesFindByHashContract } from './endpoints/drive/files/find-by-hash.contract.js';
import { driveFilesShowContract } from './endpoints/drive/files/show.contract.js';
import { driveFilesUpdateContract } from './endpoints/drive/files/update.contract.js';
import { driveFilesMoveBulkContract } from './endpoints/drive/files/move-bulk.contract.js';
import { driveFilesUploadFromUrlContract } from './endpoints/drive/files/upload-from-url.contract.js';
import { driveFoldersContract } from './endpoints/drive/folders.contract.js';
import { driveFoldersCreateContract } from './endpoints/drive/folders/create.contract.js';
import { driveFoldersDeleteContract } from './endpoints/drive/folders/delete.contract.js';
import { driveFoldersFindContract } from './endpoints/drive/folders/find.contract.js';
import { driveFoldersShowContract } from './endpoints/drive/folders/show.contract.js';
import { driveFoldersUpdateContract } from './endpoints/drive/folders/update.contract.js';
import { driveStreamContract } from './endpoints/drive/stream.contract.js';

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

export type DriveManagementInputs = {
	[Name in keyof typeof driveManagementContract]: InferSchemaOutput<NonNullable<(typeof driveManagementContract)[Name]['~orpc']['inputSchema']>>;
};

export type DriveManagementOutputs = InferContractRouterOutputs<typeof driveManagementContract>;

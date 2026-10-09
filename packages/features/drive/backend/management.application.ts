/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { DriveManagementOperations } from './management.router.js';
import { AdminDeleteAllFilesOfAUserOperation } from './endpoints/admin/delete-all-files-of-a-user.js';
import { AdminDriveCleanRemoteFilesOperation } from './endpoints/admin/drive/clean-remote-files.js';
import { AdminDriveCleanupOperation } from './endpoints/admin/drive/cleanup.js';
import { AdminDriveFilesOperation } from './endpoints/admin/drive/files.js';
import { AdminDriveShowFileOperation } from './endpoints/admin/drive/show-file.js';
import { DriveOperation } from './endpoints/drive.js';
import { DriveFilesOperation } from './endpoints/drive/files.js';
import { DriveFilesAttachedNotesOperation } from './endpoints/drive/files/attached-notes.js';
import { DriveFilesAttachedChatMessagesOperation } from './endpoints/drive/files/attached-chat-messages.js';
import { DriveFilesCheckExistenceOperation } from './endpoints/drive/files/check-existence.js';
import { DriveFilesDeleteOperation } from './endpoints/drive/files/delete.js';
import { DriveFilesFindOperation } from './endpoints/drive/files/find.js';
import { DriveFilesFindByHashOperation } from './endpoints/drive/files/find-by-hash.js';
import { DriveFilesShowOperation } from './endpoints/drive/files/show.js';
import { DriveFilesUpdateOperation } from './endpoints/drive/files/update.js';
import { DriveFilesMoveBulkOperation } from './endpoints/drive/files/move-bulk.js';
import { DriveFilesUploadFromUrlOperation } from './endpoints/drive/files/upload-from-url.js';
import { DriveFoldersOperation } from './endpoints/drive/folders.js';
import { DriveFoldersCreateOperation } from './endpoints/drive/folders/create.js';
import { DriveFoldersDeleteOperation } from './endpoints/drive/folders/delete.js';
import { DriveFoldersFindOperation } from './endpoints/drive/folders/find.js';
import { DriveFoldersShowOperation } from './endpoints/drive/folders/show.js';
import { DriveFoldersUpdateOperation } from './endpoints/drive/folders/update.js';
import { DriveStreamOperation } from './endpoints/drive/stream.js';

@Injectable()
export class DriveManagementApplicationService implements DriveManagementOperations<MiLocalUser> {
	constructor(
		private readonly adminDeleteAllFilesOfAUserOperation: AdminDeleteAllFilesOfAUserOperation,
		private readonly adminDriveCleanRemoteFilesOperation: AdminDriveCleanRemoteFilesOperation,
		private readonly adminDriveCleanupOperation: AdminDriveCleanupOperation,
		private readonly adminDriveFilesOperation: AdminDriveFilesOperation,
		private readonly adminDriveShowFileOperation: AdminDriveShowFileOperation,
		private readonly driveOperation: DriveOperation,
		private readonly driveFilesOperation: DriveFilesOperation,
		private readonly driveFilesAttachedNotesOperation: DriveFilesAttachedNotesOperation,
		private readonly driveFilesAttachedChatMessagesOperation: DriveFilesAttachedChatMessagesOperation,
		private readonly driveFilesCheckExistenceOperation: DriveFilesCheckExistenceOperation,
		private readonly driveFilesDeleteOperation: DriveFilesDeleteOperation,
		private readonly driveFilesFindOperation: DriveFilesFindOperation,
		private readonly driveFilesFindByHashOperation: DriveFilesFindByHashOperation,
		private readonly driveFilesShowOperation: DriveFilesShowOperation,
		private readonly driveFilesUpdateOperation: DriveFilesUpdateOperation,
		private readonly driveFilesMoveBulkOperation: DriveFilesMoveBulkOperation,
		private readonly driveFilesUploadFromUrlOperation: DriveFilesUploadFromUrlOperation,
		private readonly driveFoldersOperation: DriveFoldersOperation,
		private readonly driveFoldersCreateOperation: DriveFoldersCreateOperation,
		private readonly driveFoldersDeleteOperation: DriveFoldersDeleteOperation,
		private readonly driveFoldersFindOperation: DriveFoldersFindOperation,
		private readonly driveFoldersShowOperation: DriveFoldersShowOperation,
		private readonly driveFoldersUpdateOperation: DriveFoldersUpdateOperation,
		private readonly driveStreamOperation: DriveStreamOperation,
	) {}

	'admin/delete-all-files-of-a-user': DriveManagementOperations<MiLocalUser>['admin/delete-all-files-of-a-user'] = async (input, actor, ip, headers) => this.adminDeleteAllFilesOfAUserOperation.execute(input, actor, ip, headers);
	'admin/drive/clean-remote-files': DriveManagementOperations<MiLocalUser>['admin/drive/clean-remote-files'] = async (input, actor, ip, headers) => this.adminDriveCleanRemoteFilesOperation.execute(input, actor, ip, headers);
	'admin/drive/cleanup': DriveManagementOperations<MiLocalUser>['admin/drive/cleanup'] = async (input, actor, ip, headers) => this.adminDriveCleanupOperation.execute(input, actor, ip, headers);
	'admin/drive/files': DriveManagementOperations<MiLocalUser>['admin/drive/files'] = async (input, actor, ip, headers) => this.adminDriveFilesOperation.execute(input, actor, ip, headers);
	'admin/drive/show-file': DriveManagementOperations<MiLocalUser>['admin/drive/show-file'] = async (input, actor, ip, headers) => this.adminDriveShowFileOperation.execute(input, actor, ip, headers);
	'drive': DriveManagementOperations<MiLocalUser>['drive'] = async (input, actor, ip, headers) => this.driveOperation.execute(input, actor, ip, headers);
	'drive/files': DriveManagementOperations<MiLocalUser>['drive/files'] = async (input, actor, ip, headers) => this.driveFilesOperation.execute(input, actor, ip, headers);
	'drive/files/attached-notes': DriveManagementOperations<MiLocalUser>['drive/files/attached-notes'] = async (input, actor, ip, headers) => this.driveFilesAttachedNotesOperation.execute(input, actor, ip, headers);
	'drive/files/attached-chat-messages': DriveManagementOperations<MiLocalUser>['drive/files/attached-chat-messages'] = async (input, actor, ip, headers) => this.driveFilesAttachedChatMessagesOperation.execute(input, actor, ip, headers);
	'drive/files/check-existence': DriveManagementOperations<MiLocalUser>['drive/files/check-existence'] = async (input, actor, ip, headers) => this.driveFilesCheckExistenceOperation.execute(input, actor, ip, headers);
	'drive/files/delete': DriveManagementOperations<MiLocalUser>['drive/files/delete'] = async (input, actor, ip, headers) => this.driveFilesDeleteOperation.execute(input, actor, ip, headers);
	'drive/files/find': DriveManagementOperations<MiLocalUser>['drive/files/find'] = async (input, actor, ip, headers) => this.driveFilesFindOperation.execute(input, actor, ip, headers);
	'drive/files/find-by-hash': DriveManagementOperations<MiLocalUser>['drive/files/find-by-hash'] = async (input, actor, ip, headers) => this.driveFilesFindByHashOperation.execute(input, actor, ip, headers);
	'drive/files/show': DriveManagementOperations<MiLocalUser>['drive/files/show'] = async (input, actor, ip, headers) => this.driveFilesShowOperation.execute(input, actor, ip, headers);
	'drive/files/update': DriveManagementOperations<MiLocalUser>['drive/files/update'] = async (input, actor, ip, headers) => this.driveFilesUpdateOperation.execute(input, actor, ip, headers);
	'drive/files/move-bulk': DriveManagementOperations<MiLocalUser>['drive/files/move-bulk'] = async (input, actor, ip, headers) => this.driveFilesMoveBulkOperation.execute(input, actor, ip, headers);
	'drive/files/upload-from-url': DriveManagementOperations<MiLocalUser>['drive/files/upload-from-url'] = async (input, actor, ip, headers) => this.driveFilesUploadFromUrlOperation.execute(input, actor, ip, headers);
	'drive/folders': DriveManagementOperations<MiLocalUser>['drive/folders'] = async (input, actor, ip, headers) => this.driveFoldersOperation.execute(input, actor, ip, headers);
	'drive/folders/create': DriveManagementOperations<MiLocalUser>['drive/folders/create'] = async (input, actor, ip, headers) => this.driveFoldersCreateOperation.execute(input, actor, ip, headers);
	'drive/folders/delete': DriveManagementOperations<MiLocalUser>['drive/folders/delete'] = async (input, actor, ip, headers) => this.driveFoldersDeleteOperation.execute(input, actor, ip, headers);
	'drive/folders/find': DriveManagementOperations<MiLocalUser>['drive/folders/find'] = async (input, actor, ip, headers) => this.driveFoldersFindOperation.execute(input, actor, ip, headers);
	'drive/folders/show': DriveManagementOperations<MiLocalUser>['drive/folders/show'] = async (input, actor, ip, headers) => this.driveFoldersShowOperation.execute(input, actor, ip, headers);
	'drive/folders/update': DriveManagementOperations<MiLocalUser>['drive/folders/update'] = async (input, actor, ip, headers) => this.driveFoldersUpdateOperation.execute(input, actor, ip, headers);
	'drive/stream': DriveManagementOperations<MiLocalUser>['drive/stream'] = async (input, actor, ip, headers) => this.driveStreamOperation.execute(input, actor, ip, headers);
}

export const driveManagementProviders = [DriveManagementApplicationService,
	AdminDeleteAllFilesOfAUserOperation,
	AdminDriveCleanRemoteFilesOperation,
	AdminDriveCleanupOperation,
	AdminDriveFilesOperation,
	AdminDriveShowFileOperation,
	DriveOperation,
	DriveFilesOperation,
	DriveFilesAttachedNotesOperation,
	DriveFilesAttachedChatMessagesOperation,
	DriveFilesCheckExistenceOperation,
	DriveFilesDeleteOperation,
	DriveFilesFindOperation,
	DriveFilesFindByHashOperation,
	DriveFilesShowOperation,
	DriveFilesUpdateOperation,
	DriveFilesMoveBulkOperation,
	DriveFilesUploadFromUrlOperation,
	DriveFoldersOperation,
	DriveFoldersCreateOperation,
	DriveFoldersDeleteOperation,
	DriveFoldersFindOperation,
	DriveFoldersShowOperation,
	DriveFoldersUpdateOperation,
	DriveStreamOperation,
];

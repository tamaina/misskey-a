/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DriveCreateInput, DriveCreateOutput } from './endpoints/drive/files/create.contract.js';
import type { UploadResource } from '../../api/backend/transport/context.js';

export interface CreateFileDependencies<Actor, File> {
	validateFileName(name: string): boolean;
	enableIpLogging(): boolean;
	addFile(options: {
		user: Actor; path: string; name: string | null; comment: string | null; folderId: string | null;
		force: boolean; sensitive: boolean; requestIp: string | null;
		requestHeaders: Record<string, string | string[] | undefined> | null;
	}): Promise<File>;
	pack(file: File): Promise<Omit<DriveCreateOutput, 'folder' | 'user' | 'userId'> & {
		folder?: unknown; user?: unknown; userId?: string | null;
	}>;
	logError(error: unknown): void;
}

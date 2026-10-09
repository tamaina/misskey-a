/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '../../persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { MiDriveFile } from './models/DriveFile.js';
import { DriveService } from './services/DriveService.js';
import { DriveFileEntityService } from './serializers/DriveFileEntityService.js';
import { createDriveRouter } from './api.router.js';
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

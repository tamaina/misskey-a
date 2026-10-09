/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import { EmojiEntityService } from '@features/emojis/backend/serializers/EmojiEntityService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DriveService } from '@features/drive/backend/services/DriveService.js';
import { DI } from '@/di-symbols.js';
import type { EmojisRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import { createEmojisRouter } from './api.router.js';
type EmojisRouter = ReturnType<typeof createEmojisRouter<MiLocalUser>>;
@Injectable()
export class EmojisApiProvider {
	private router: EmojisRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): EmojisRouter {
		if (this.router !== undefined) return this.router;
		const moduleRef = this.moduleRef;
		const queryService = moduleRef.get(QueryService, { strict: false });
		const idService = moduleRef.get(IdService, { strict: false });
		const emojis = moduleRef.get<EmojisRepository>(DI.emojisRepository, { strict: false });
		const driveFiles = moduleRef.get<DriveFilesRepository>(DI.driveFilesRepository, { strict: false });
		const customEmojiService = moduleRef.get(CustomEmojiService, { strict: false });
		const emojiEntityService = moduleRef.get(EmojiEntityService, { strict: false });
		const drive = moduleRef.get(DriveService, { strict: false });
		const utilityService = moduleRef.get(UtilityService, { strict: false });
		const queueService = moduleRef.get(QueueService, { strict: false });
		this.router = createEmojisRouter<MiLocalUser>({
			emojisRepository: emojis, driveFilesRepository: driveFiles,
			customEmojiService, emojiEntityService, driveService: drive, queryService, utilityService, idService, queueService
		});
		return this.router;
	}
}

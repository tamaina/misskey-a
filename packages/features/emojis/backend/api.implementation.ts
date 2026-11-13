/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterOutputs } from '@orpc/contract';
import { emojisContract } from './api.definition.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { EmojisRepository, DriveFilesRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiEmoji } from './models/Emoji.js';
import { CustomEmojiService } from '@features/emojis/backend/services/CustomEmojiService.js';
import { EmojiEntityService } from '@features/emojis/backend/serializers/EmojiEntityService.js';
import { DriveService } from '@features/drive/backend/services/DriveService.js';
import { QueryService } from '@features/notes/backend/services/QueryService.js';
import { UtilityService } from '@features/federation/backend/services/UtilityService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { QueueService } from '@features/runtime/backend/services/QueueService.js';
import { implement } from '@orpc/server';
import { createAddProcedure } from './endpoints/admin/emoji/add.js';
import { createAddAliasesBulkProcedure } from './endpoints/admin/emoji/add-aliases-bulk.js';
import { createCopyProcedure } from './endpoints/admin/emoji/copy.js';
import { createDeleteProcedure } from './endpoints/admin/emoji/delete.js';
import { createDeleteBulkProcedure } from './endpoints/admin/emoji/delete-bulk.js';
import { createImportZipProcedure } from './endpoints/admin/emoji/import-zip.js';
import { createListProcedure } from './endpoints/admin/emoji/list.js';
import { createListRemoteProcedure } from './endpoints/admin/emoji/list-remote.js';
import { createRemoveAliasesBulkProcedure } from './endpoints/admin/emoji/remove-aliases-bulk.js';
import { createSetAliasesBulkProcedure } from './endpoints/admin/emoji/set-aliases-bulk.js';
import { createSetCategoryBulkProcedure } from './endpoints/admin/emoji/set-category-bulk.js';
import { createSetLicenseBulkProcedure } from './endpoints/admin/emoji/set-license-bulk.js';
import { createUpdateProcedure } from './endpoints/admin/emoji/update.js';
import { createEmojiProcedure } from './endpoints/emoji.js';
import { createEmojisProcedure } from './endpoints/emojis.js';
import { createEmojiGetProcedure } from './endpoints/emoji-get.js';
import { createEmojisGetProcedure } from './endpoints/emojis-get.js';
import { createExportCustomEmojisProcedure } from './endpoints/export-custom-emojis.js';
import { createV2ListProcedure } from './endpoints/v2/admin/emoji/list.js';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { DI } from '@/di-symbols.js';

type Outputs = InferContractRouterOutputs<typeof emojisContract>;

export interface EmojisDependencies<Actor extends ApiActor> {
	emojisRepository: Pick<EmojisRepository, 'find' | 'findOneOrFail' | 'findOneBy' | 'createQueryBuilder'>;
	driveFilesRepository: Pick<DriveFilesRepository, 'findOneBy'>;
	customEmojiService: Pick<CustomEmojiService, 'checkDuplicate' | 'fetchEmojis' | 'addAliasesBulk' | 'removeAliasesBulk' | 'setAliasesBulk' | 'setCategoryBulk' | 'setLicenseBulk'> & {
		add(data: Parameters<CustomEmojiService['add']>[0], actor: Actor): Promise<MiEmoji>;
		update(data: Parameters<CustomEmojiService['update']>[0], actor: Actor): ReturnType<CustomEmojiService['update']>;
		delete(id: string, actor: Actor): Promise<void>;
		deleteBulk(ids: string[], actor: Actor): Promise<void>;
	};
	emojiEntityService: Pick<EmojiEntityService, 'packDetailed' | 'packDetailedMany' | 'packSimpleMany' | 'packDetailedAdminMany'>;
	driveService: Pick<DriveService, 'uploadFromUrl'>;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	utilityService: Pick<UtilityService, 'toPuny'>;
	idService: Pick<IdService, 'gen'>;
	queueService: Pick<QueueService, 'createImportCustomEmojisJob' | 'createExportCustomEmojisJob'>;
}

export function createEmojisRouter<Actor extends ApiActor>(deps: EmojisDependencies<Actor>) {
	return implement(emojisContract).$context<ApiContext<Actor>>().router({
		add: createAddProcedure<Actor>(deps),
		addAliasesBulk: createAddAliasesBulkProcedure<Actor>(deps),
		copy: createCopyProcedure<Actor>(deps),
		delete: createDeleteProcedure<Actor>(deps),
		deleteBulk: createDeleteBulkProcedure<Actor>(deps),
		importZip: createImportZipProcedure<Actor>(deps),
		list: createListProcedure<Actor>(deps),
		listRemote: createListRemoteProcedure<Actor>(deps),
		removeAliasesBulk: createRemoveAliasesBulkProcedure<Actor>(deps),
		setAliasesBulk: createSetAliasesBulkProcedure<Actor>(deps),
		setCategoryBulk: createSetCategoryBulkProcedure<Actor>(deps),
		setLicenseBulk: createSetLicenseBulkProcedure<Actor>(deps),
		update: createUpdateProcedure<Actor>(deps),
		emoji: createEmojiProcedure<Actor>(deps),
		emojis: createEmojisProcedure<Actor>(deps),
		emojiGet: createEmojiGetProcedure<Actor>(deps),
		emojisGet: createEmojisGetProcedure<Actor>(deps),
		exportCustomEmojis: createExportCustomEmojisProcedure<Actor>(deps),
		v2List: createV2ListProcedure<Actor>(deps),
	});
}

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

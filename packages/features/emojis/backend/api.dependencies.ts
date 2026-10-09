/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { emojisContract } from './api.contract.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { EmojisRepository, DriveFilesRepository } from '../../persistence/backend/repositories/models.js';
import type { MiEmoji } from './models/Emoji.js';
import type { CustomEmojiService } from './services/CustomEmojiService.js';
import type { EmojiEntityService } from './serializers/EmojiEntityService.js';
import type { DriveService } from '../../drive/backend/services/DriveService.js';
import type { QueryService } from '../../notes/backend/services/QueryService.js';
import type { UtilityService } from '../../federation/backend/services/UtilityService.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { QueueService } from '../../runtime/backend/services/QueueService.js';
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

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { emojisContract } from './api.contract.js';
import type { EmojisDependencies } from './api.dependencies.js';
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

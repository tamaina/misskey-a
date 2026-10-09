/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toEmojiDetailed } from '../../../emoji-output.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.definition.js';
import type { EmojisDependencies } from '../../../api.implementation.js';
import { apiError, internalError } from '@features/api/backend/transport/orpc-error.js';
import type { MiDriveFile } from '@features/drive/backend/models/DriveFile.js';
export function createCopyProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'emojisRepository' | 'driveService' | 'customEmojiService' | 'emojiEntityService'>) {
	return createApiProcedure<Actor>()(emojisContract.copy).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const fail = (code: string, message: string, id: string) => apiError({ code, message, id });
			const emoji = await deps.emojisRepository.findOneBy({ id: input.emojiId });
			if (emoji === null) throw fail('NO_SUCH_EMOJI', 'No such emoji.', 'e2785b66-dca3-4087-9cac-b93c541cc425');
			let file: MiDriveFile;
			try {
				file = await deps.driveService.uploadFromUrl({ url: emoji.originalUrl, user: null, force: true });
			} catch {
				throw apiError(internalError);
			}
			if (await deps.customEmojiService.checkDuplicate(emoji.name)) throw fail('DUPLICATE_NAME', 'Duplicate name.', 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975');
			const added = await deps.customEmojiService.add({
				originalUrl: file.url, publicUrl: file.webpublicUrl ?? file.url, fileType: file.webpublicType ?? file.type,
				name: emoji.name, category: emoji.category, aliases: emoji.aliases, host: null,
				license: emoji.license, isSensitive: emoji.isSensitive, localOnly: emoji.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
			}, actor);
			return toEmojiDetailed(await deps.emojiEntityService.packDetailed(added));
		});
}

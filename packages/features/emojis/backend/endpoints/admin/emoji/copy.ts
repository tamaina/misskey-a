/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.contract.js';
import type { EmojisDependencies } from '../../../api.dependencies.js';
import { apiError, internalError } from '../../../../../api/backend/transport/orpc-error.js';
import type { MiDriveFile } from '../../../../../drive/backend/models/DriveFile.js';
export function createCopyProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'emojisRepository' | 'driveService' | 'customEmojiService' | 'emojiEntityService'>) {
	return implement(emojisContract.copy, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/emoji/copy', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
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
			return deps.emojiEntityService.packDetailed(added);
		});
}

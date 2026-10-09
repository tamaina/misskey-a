/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.contract.js';
import type { EmojisDependencies } from '../../../api.dependencies.js';
import { FILE_TYPE_IMAGE } from '../../../../../drive/backend/file-types.js';
export function createAddProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'driveFilesRepository' | 'customEmojiService' | 'emojiEntityService'>) {
	return implement(emojisContract.add, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/emoji/add', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const fail = (code: string, message: string, id: string) => apiError({ code, message, id });
			const file = await deps.driveFilesRepository.findOneBy({ id: input.fileId });
			if (file === null) throw fail('NO_SUCH_FILE', 'No such file.', 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf');
			if (await deps.customEmojiService.checkDuplicate(input.name)) throw fail('DUPLICATE_NAME', 'Duplicate name.', 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975');
			if (!FILE_TYPE_IMAGE.includes(file.type)) throw fail('UNSUPPORTED_FILE_TYPE', 'Unsupported file type.', 'f7599d96-8750-af68-1633-9575d625c1a7');
			const emoji = await deps.customEmojiService.add({
				originalUrl: file.url, publicUrl: file.webpublicUrl ?? file.url, fileType: file.webpublicType ?? file.type,
				name: input.name, category: input.category ?? null, aliases: input.aliases ?? [], host: null,
				license: input.license ?? null, isSensitive: input.isSensitive ?? false, localOnly: input.localOnly ?? false,
				roleIdsThatCanBeUsedThisEmojiAsReaction: input.roleIdsThatCanBeUsedThisEmojiAsReaction ?? [],
			}, actor);
			return deps.emojiEntityService.packDetailed(emoji);
		});
}

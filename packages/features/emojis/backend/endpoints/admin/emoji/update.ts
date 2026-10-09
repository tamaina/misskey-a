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
export function createUpdateProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'driveFilesRepository' | 'customEmojiService'>) {
	return implement(emojisContract.update, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/emoji/update', requireCredential: true, requiredRolePolicy: 'canManageCustomEmojis', kind: 'write:admin:emoji' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const fail = (code: string, message: string, id: string) => apiError({ code, message, id });
			const file = input.fileId ? await deps.driveFilesRepository.findOneBy({ id: input.fileId }) : undefined;
			if (file === null) throw fail('NO_SUCH_FILE', 'No such file.', '14fb9fd9-0731-4e2f-aeb9-f09e4740333d');
			const selector = 'id' in input ? { id: input.id, name: input.name } : { name: input.name };
			const error = await deps.customEmojiService.update({
				...selector, originalUrl: file?.url, publicUrl: file ? file.webpublicUrl ?? file.url : undefined,
				fileType: file ? file.webpublicType ?? file.type : undefined, category: input.category,
				aliases: input.aliases, license: input.license, isSensitive: input.isSensitive, localOnly: input.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: input.roleIdsThatCanBeUsedThisEmojiAsReaction,
			}, actor);
			if (error === 'NO_SUCH_EMOJI') throw fail(error, 'No such emoji.', '684dec9d-a8c2-4364-9aa8-456c49cb1dc8');
			if (error === 'SAME_NAME_EMOJI_EXISTS') throw fail(error, 'Emoji that have same name already exists.', '7180fe9d-1ee3-bff9-647d-fe9896d2ffb8');
		});
}

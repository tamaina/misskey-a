/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.definition.js';
import type { EmojisDependencies } from '../../../api.implementation.js';
export function createSetAliasesBulkProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'customEmojiService'>) {
	return createApiProcedure<Actor>()(emojisContract.setAliasesBulk).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			await deps.customEmojiService.setAliasesBulk(input.ids, input.aliases);
		});
}

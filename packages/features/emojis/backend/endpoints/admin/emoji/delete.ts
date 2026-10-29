/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.definition.js';
import type { EmojisDependencies } from '../../../api.implementation.js';
export function createDeleteProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'customEmojiService'>) {
	return createApiProcedure<Actor>()(emojisContract.delete).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			// Preserve the service's existing missing-row behavior; the legacy handler does not remap it.
			await deps.customEmojiService.delete(input.id, actor);
		});
}

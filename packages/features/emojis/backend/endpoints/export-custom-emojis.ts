/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { emojisContract } from '../api.definition.js';
import type { EmojisDependencies } from '../api.implementation.js';
export function createExportCustomEmojisProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'queueService'>) {
	return implement(emojisContract.exportCustomEmojis, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'export-custom-emojis', requireCredential: true, secure: true, limit: { duration: 3600000, max: 1 } })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.queueService.createExportCustomEmojisJob(actor);
		});
}

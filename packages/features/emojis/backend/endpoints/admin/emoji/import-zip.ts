/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { emojisContract } from '../../../api.contract.js';
import type { EmojisDependencies } from '../../../api.dependencies.js';
export function createImportZipProcedure<Actor extends ApiActor>(deps: Pick<EmojisDependencies<Actor>, 'queueService'>) {
	return implement(emojisContract.importZip, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/emoji/import-zip', requireCredential: true, requireAdmin: true, secure: true })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.queueService.createImportCustomEmojisJob(actor, input.fileId);
		});
}

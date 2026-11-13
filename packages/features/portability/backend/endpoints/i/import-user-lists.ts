/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { importFile } from '../../import-file.js';
import { iImportUserListsErrors } from './import-user-lists.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { iImportUserListsContract } from './import-user-lists.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.implementation.js';
export function createIImportUserListsProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'createImportUserListsJob' | 'findOwnedFile' | 'isMovingDuringGracePeriod'>) {
	return createApiProcedure<Actor>()(iImportUserListsContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const file = await importFile(deps, actor, input.fileId, iImportUserListsErrors); deps.createImportUserListsJob(actor, file.id);
		});
}

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { importFile } from '../../import-file.js';
import { iImportMutingErrors } from './import-muting.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { iImportMutingContract } from './import-muting.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.implementation.js';
export function createIImportMutingProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'createImportMutingJob' | 'findOwnedFile' | 'isMovingDuringGracePeriod'>) {
	return createApiProcedure<Actor>()(iImportMutingContract).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const file = await importFile(deps, actor, input.fileId, iImportMutingErrors); deps.createImportMutingJob(actor, file.id);
		});
}

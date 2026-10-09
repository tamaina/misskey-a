/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { importFile } from '../../import-file.js';
import { iImportMutingErrors } from './import-muting.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { iImportMutingContract } from './import-muting.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.implementation.js';
export function createIImportMutingProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'createImportMutingJob' | 'findOwnedFile' | 'isMovingDuringGracePeriod'>) {
	return implement(iImportMutingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': iImportMutingContract['~orpc'].meta.requestName, 'requireCredential': true, 'secure': true, 'limit': { 'duration': 3600000, 'max': 1 }, 'prohibitMoved': true, 'requiredRolePolicy': 'canImportMuting' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const file = await importFile(deps, actor, input.fileId, iImportMutingErrors); deps.createImportMutingJob(actor, file.id);
		});
}

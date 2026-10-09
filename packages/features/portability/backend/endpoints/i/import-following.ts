/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { importFile } from '../../import-file.js';
import { iImportFollowingErrors } from './import-following.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { iImportFollowingContract } from './import-following.contract.js';
import type { ApiActor, ApiContext } from '../../../../api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.dependencies.js';
export function createIImportFollowingProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'createImportFollowingJob' | 'findOwnedFile' | 'isMovingDuringGracePeriod'>) {
	return implement(iImportFollowingContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': iImportFollowingContract['~orpc'].meta.requestName, 'requireCredential': true, 'secure': true, 'limit': { 'duration': 3600000, 'max': 1 }, 'prohibitMoved': true, 'requiredRolePolicy': 'canImportFollowing' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const file = await importFile(deps, actor, input.fileId, iImportFollowingErrors); deps.createImportFollowingJob(actor, file.id, input.withReplies);
		});
}

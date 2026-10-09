/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { iExportBlockingContract } from './export-blocking.contract.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.implementation.js';
export function createIExportBlockingProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'createExportBlockingJob'>) {
	return createApiProcedure<Actor>()(iExportBlockingContract).use(requirePrincipal<Actor>())
		.handler(async ({ context }) => {
			const actor = context.principal;
			deps.createExportBlockingJob({ id: actor.id });
		});
}

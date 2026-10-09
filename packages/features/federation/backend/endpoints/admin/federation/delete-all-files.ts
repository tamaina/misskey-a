/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../../operations.js';
import { adminFederationDeleteAllFilesContract } from './delete-all-files.contract.js';

export function createAdminFederationDeleteAllFilesProcedure<Actor extends ApiActor>() {
	return implement(adminFederationDeleteAllFilesContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/federation/delete-all-files', requireCredential: true, requireModerator: true, kind: 'write:admin:federation' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.federation.adminFederationDeleteAllFiles(input, context.principal));
}

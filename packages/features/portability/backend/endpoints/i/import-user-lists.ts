/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { iImportUserListsContract } from './import-user-lists.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PortabilityContext } from '../../api.router.js';

export function createIImportUserListsProcedure<Actor extends ApiActor>() {
	return implement(iImportUserListsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PortabilityContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': 'i/import-user-lists', 'requireCredential': true, 'secure': true, 'limit': { 'duration': 3600000, 'max': 1 }, 'prohibitMoved': true, 'requiredRolePolicy': 'canImportUserLists' })).use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.portability['i/import-user-lists'](input, context.principal));
}

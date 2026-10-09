/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { iExportClipsContract } from './export-clips.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PortabilityContext } from '../../api.router.js';

export function createIExportClipsProcedure<Actor extends ApiActor>() {
	return implement(iExportClipsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PortabilityContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': 'i/export-clips', 'requireCredential': true, 'secure': true, 'limit': { 'duration': 86400000, 'max': 1 } })).use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.portability['i/export-clips'](input, context.principal));
}

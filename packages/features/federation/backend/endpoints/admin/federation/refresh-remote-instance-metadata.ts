/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor } from '../../../../../api/backend/transport/context.js';
import type { FederationContext } from '../../../operations.js';
import { adminFederationRefreshRemoteInstanceMetadataContract } from './refresh-remote-instance-metadata.contract.js';

export function createAdminFederationRefreshRemoteInstanceMetadataProcedure<Actor extends ApiActor>() {
	return implement(adminFederationRefreshRemoteInstanceMetadataContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<FederationContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: 'admin/federation/refresh-remote-instance-metadata', requireCredential: true, requireModerator: true, kind: 'write:admin:federation' }))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.federation.adminFederationRefreshRemoteInstanceMetadata(input, context.principal));
}

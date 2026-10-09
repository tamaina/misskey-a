/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { iImportAntennasContract } from './import-antennas.contract.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';
import type { PortabilityContext } from '../../api.router.js';

export function createIImportAntennasProcedure<Actor extends ApiActor>() {
	return implement(iImportAntennasContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<PortabilityContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': 'i/import-antennas', 'requireCredential': true, 'secure': true, 'limit': { 'duration': 3600000, 'max': 1 }, 'prohibitMoved': true, 'requiredRolePolicy': 'canImportAntennas' })).use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.portability['i/import-antennas'](input, context.principal));
}

export type { AntennaArtifact as Antenna } from '../../antenna-artifact.schema.js';

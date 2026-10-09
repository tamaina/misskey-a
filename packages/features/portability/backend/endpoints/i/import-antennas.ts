/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { parseAntennaArtifact } from '../../antenna-artifact.schema.js';
import { exceedsAntennaLimit } from '../../import-file.js';
import { iImportAntennasErrors } from './import-antennas.contract.js';
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { iImportAntennasContract } from './import-antennas.contract.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import type { PortabilityDependencies } from '../../api.implementation.js';
export function createIImportAntennasProcedure<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: Pick<PortabilityDependencies<Actor, File>, 'userExists' | 'findOwnedFile' | 'downloadTextFile' | 'countAntennas' | 'getAntennaLimit' | 'createImportAntennasJob'>) {
	return implement(iImportAntennasContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>()).use(apiPolicy<Actor>({ 'name': iImportAntennasContract['~orpc'].meta.requestName, 'requireCredential': true, 'secure': true, 'limit': { 'duration': 3600000, 'max': 1 }, 'prohibitMoved': true, 'requiredRolePolicy': 'canImportAntennas' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			if (!await deps.userExists(actor.id)) throw apiError(iImportAntennasErrors.noSuchUser);
			const file = await deps.findOwnedFile(input.fileId, actor.id);
			if (file === null) throw apiError(iImportAntennasErrors.noSuchFile);
			if (file === undefined) throw new TypeError('Missing owned file');
			if (file.size === 0) throw apiError(iImportAntennasErrors.emptyFile);
			const artifact = parseAntennaArtifact(await deps.downloadTextFile(file.url));
			const count = await deps.countAntennas(actor.id);
			if (exceedsAntennaLimit(count, artifact, await deps.getAntennaLimit(actor.id))) throw apiError(iImportAntennasErrors.tooManyAntennas);
			deps.createImportAntennasJob(actor, artifact);
		});
}

export type { AntennaArtifact as Antenna } from '../../antenna-artifact.schema.js';

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { portabilityApiContract, type PortabilityInputs, type PortabilityOutputs } from './api.contract.js';
import { createIExportAntennasProcedure } from './endpoints/i/export-antennas.js';
import { createIExportBlockingProcedure } from './endpoints/i/export-blocking.js';
import { createIExportClipsProcedure } from './endpoints/i/export-clips.js';
import { createIExportFavoritesProcedure } from './endpoints/i/export-favorites.js';
import { createIExportFollowingProcedure } from './endpoints/i/export-following.js';
import { createIExportMuteProcedure } from './endpoints/i/export-mute.js';
import { createIExportNotesProcedure } from './endpoints/i/export-notes.js';
import { createIExportUserListsProcedure } from './endpoints/i/export-user-lists.js';
import { createIImportAntennasProcedure } from './endpoints/i/import-antennas.js';
import { createIImportBlockingProcedure } from './endpoints/i/import-blocking.js';
import { createIImportFollowingProcedure } from './endpoints/i/import-following.js';
import { createIImportMutingProcedure } from './endpoints/i/import-muting.js';
import { createIImportUserListsProcedure } from './endpoints/i/import-user-lists.js';

export type PortabilityOperations<Actor extends ApiActor> = {
	[Name in keyof PortabilityInputs]: (input: PortabilityInputs[Name], actor: Actor) => Promise<PortabilityOutputs[Name]>;
};
export type PortabilityContext<Actor extends ApiActor> = ApiContext<Actor> & { operations: { portability: PortabilityOperations<Actor> } };
export function createPortabilityRouter<Actor extends ApiActor>() {
	return implement(portabilityApiContract).$context<PortabilityContext<Actor>>().router({
		'i/export-antennas': createIExportAntennasProcedure<Actor>(),
		'i/export-blocking': createIExportBlockingProcedure<Actor>(),
		'i/export-clips': createIExportClipsProcedure<Actor>(),
		'i/export-favorites': createIExportFavoritesProcedure<Actor>(),
		'i/export-following': createIExportFollowingProcedure<Actor>(),
		'i/export-mute': createIExportMuteProcedure<Actor>(),
		'i/export-notes': createIExportNotesProcedure<Actor>(),
		'i/export-user-lists': createIExportUserListsProcedure<Actor>(),
		'i/import-antennas': createIImportAntennasProcedure<Actor>(),
		'i/import-blocking': createIImportBlockingProcedure<Actor>(),
		'i/import-following': createIImportFollowingProcedure<Actor>(),
		'i/import-muting': createIImportMutingProcedure<Actor>(),
		'i/import-user-lists': createIImportUserListsProcedure<Actor>(),
	});
}

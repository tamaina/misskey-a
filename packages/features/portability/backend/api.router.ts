/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { PortabilityDependencies } from './api.dependencies.js';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { portabilityApiContract } from './api.contract.js';
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
export function createPortabilityRouter<Actor extends ApiActor, File extends { id: string; size: number; url: string }>(deps: PortabilityDependencies<Actor, File>) {
	return implement(portabilityApiContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		'i/export-antennas': createIExportAntennasProcedure<Actor, File>(deps),
		'i/export-blocking': createIExportBlockingProcedure<Actor, File>(deps),
		'i/export-clips': createIExportClipsProcedure<Actor, File>(deps),
		'i/export-favorites': createIExportFavoritesProcedure<Actor, File>(deps),
		'i/export-following': createIExportFollowingProcedure<Actor, File>(deps),
		'i/export-mute': createIExportMuteProcedure<Actor, File>(deps),
		'i/export-notes': createIExportNotesProcedure<Actor, File>(deps),
		'i/export-user-lists': createIExportUserListsProcedure<Actor, File>(deps),
		'i/import-antennas': createIImportAntennasProcedure<Actor, File>(deps),
		'i/import-blocking': createIImportBlockingProcedure<Actor, File>(deps),
		'i/import-following': createIImportFollowingProcedure<Actor, File>(deps),
		'i/import-muting': createIImportMutingProcedure<Actor, File>(deps),
		'i/import-user-lists': createIImportUserListsProcedure<Actor, File>(deps),
	});
}

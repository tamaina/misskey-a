/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as v from 'valibot';
import type { InferContractRouterOutputs } from '@orpc/contract';
import { iExportAntennasContract, iExportAntennasInput } from './endpoints/i/export-antennas.contract.js';
import { iExportBlockingContract, iExportBlockingInput } from './endpoints/i/export-blocking.contract.js';
import { iExportClipsContract, iExportClipsInput } from './endpoints/i/export-clips.contract.js';
import { iExportFavoritesContract, iExportFavoritesInput } from './endpoints/i/export-favorites.contract.js';
import { iExportFollowingContract, iExportFollowingInput } from './endpoints/i/export-following.contract.js';
import { iExportMuteContract, iExportMuteInput } from './endpoints/i/export-mute.contract.js';
import { iExportNotesContract, iExportNotesInput } from './endpoints/i/export-notes.contract.js';
import { iExportUserListsContract, iExportUserListsInput } from './endpoints/i/export-user-lists.contract.js';
import { iImportAntennasContract, iImportAntennasInput } from './endpoints/i/import-antennas.contract.js';
import { iImportBlockingContract, iImportBlockingInput } from './endpoints/i/import-blocking.contract.js';
import { iImportFollowingContract, iImportFollowingInput } from './endpoints/i/import-following.contract.js';
import { iImportMutingContract, iImportMutingInput } from './endpoints/i/import-muting.contract.js';
import { iImportUserListsContract, iImportUserListsInput } from './endpoints/i/import-user-lists.contract.js';

export const portabilityApiContract = {
	'i/export-antennas': iExportAntennasContract,
	'i/export-blocking': iExportBlockingContract,
	'i/export-clips': iExportClipsContract,
	'i/export-favorites': iExportFavoritesContract,
	'i/export-following': iExportFollowingContract,
	'i/export-mute': iExportMuteContract,
	'i/export-notes': iExportNotesContract,
	'i/export-user-lists': iExportUserListsContract,
	'i/import-antennas': iImportAntennasContract,
	'i/import-blocking': iImportBlockingContract,
	'i/import-following': iImportFollowingContract,
	'i/import-muting': iImportMutingContract,
	'i/import-user-lists': iImportUserListsContract,
};
export interface PortabilityInputs {
	'i/export-antennas': v.InferOutput<typeof iExportAntennasInput>;
	'i/export-blocking': v.InferOutput<typeof iExportBlockingInput>;
	'i/export-clips': v.InferOutput<typeof iExportClipsInput>;
	'i/export-favorites': v.InferOutput<typeof iExportFavoritesInput>;
	'i/export-following': v.InferOutput<typeof iExportFollowingInput>;
	'i/export-mute': v.InferOutput<typeof iExportMuteInput>;
	'i/export-notes': v.InferOutput<typeof iExportNotesInput>;
	'i/export-user-lists': v.InferOutput<typeof iExportUserListsInput>;
	'i/import-antennas': v.InferOutput<typeof iImportAntennasInput>;
	'i/import-blocking': v.InferOutput<typeof iImportBlockingInput>;
	'i/import-following': v.InferOutput<typeof iImportFollowingInput>;
	'i/import-muting': v.InferOutput<typeof iImportMutingInput>;
	'i/import-user-lists': v.InferOutput<typeof iImportUserListsInput>;
}
export type PortabilityOutputs = InferContractRouterOutputs<typeof portabilityApiContract>;

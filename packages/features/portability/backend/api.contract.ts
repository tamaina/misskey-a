/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterOutputs } from '@orpc/contract';
import { iExportAntennasContract, type IExportAntennasInput } from './endpoints/i/export-antennas.contract.js';
import { iExportBlockingContract, type IExportBlockingInput } from './endpoints/i/export-blocking.contract.js';
import { iExportClipsContract, type IExportClipsInput } from './endpoints/i/export-clips.contract.js';
import { iExportFavoritesContract, type IExportFavoritesInput } from './endpoints/i/export-favorites.contract.js';
import { iExportFollowingContract, type IExportFollowingInput } from './endpoints/i/export-following.contract.js';
import { iExportMuteContract, type IExportMuteInput } from './endpoints/i/export-mute.contract.js';
import { iExportNotesContract, type IExportNotesInput } from './endpoints/i/export-notes.contract.js';
import { iExportUserListsContract, type IExportUserListsInput } from './endpoints/i/export-user-lists.contract.js';
import { iImportAntennasContract, type IImportAntennasInput } from './endpoints/i/import-antennas.contract.js';
import { iImportBlockingContract, type IImportBlockingInput } from './endpoints/i/import-blocking.contract.js';
import { iImportFollowingContract, type IImportFollowingInput } from './endpoints/i/import-following.contract.js';
import { iImportMutingContract, type IImportMutingInput } from './endpoints/i/import-muting.contract.js';
import { iImportUserListsContract, type IImportUserListsInput } from './endpoints/i/import-user-lists.contract.js';

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
	'i/export-antennas': IExportAntennasInput;
	'i/export-blocking': IExportBlockingInput;
	'i/export-clips': IExportClipsInput;
	'i/export-favorites': IExportFavoritesInput;
	'i/export-following': IExportFollowingInput;
	'i/export-mute': IExportMuteInput;
	'i/export-notes': IExportNotesInput;
	'i/export-user-lists': IExportUserListsInput;
	'i/import-antennas': IImportAntennasInput;
	'i/import-blocking': IImportBlockingInput;
	'i/import-following': IImportFollowingInput;
	'i/import-muting': IImportMutingInput;
	'i/import-user-lists': IImportUserListsInput;
}
export type PortabilityOutputs = InferContractRouterOutputs<typeof portabilityApiContract>;

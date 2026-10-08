/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instancePilotContract } from '../../instance/backend/endpoints/server-info.contract.js';
import { notesPilotContract } from '../../notes/backend/endpoints/notes/delete.contract.js';
import { drivePilotContract } from '../../drive/backend/endpoints/drive/files/create.contract.js';

export const pilotContract = {
	instance: instancePilotContract,
	notes: notesPilotContract,
	drive: drivePilotContract,
};

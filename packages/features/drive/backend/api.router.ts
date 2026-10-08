/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { drivePilotContract } from './endpoints/drive/files/create.contract.js';
import { createDriveFileProcedure } from './endpoints/drive/files/create.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';

export function createDriveRouter<Actor extends ApiActor>() {
	return implement(drivePilotContract).$context<ApiContext<Actor>>().router({ files: { create: createDriveFileProcedure<Actor>() } });
}

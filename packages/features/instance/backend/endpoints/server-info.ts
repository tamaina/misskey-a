/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { serverInfoContract, serverInfoGetContract } from './server-info.contract.js';
import { createServerInfoService } from '../server-info.js';
import type { ServerInfoDependencies } from '../server-info.js';
import type { ApiActor } from '../../../api/backend/transport/context.js';
export function createInstanceRouter<Actor extends ApiActor>(deps: ServerInfoDependencies) {
	const read = createServerInfoService(deps);
	const project = async () => {
		const info = await read();
		return { machine: info.machine, cpu: { model: info.cpu.model, cores: info.cpu.cores }, mem: { total: info.mem.total }, fs: { total: info.fs.total, used: info.fs.used } };
	};
	return {
		serverInfo: createApiProcedure<Actor>()(serverInfoContract).handler(project),
		serverInfoGet: createApiProcedure<Actor>()(serverInfoGetContract).handler(project),
	};
}

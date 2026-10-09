/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication } from '../../../api/backend/transport/middleware.js';
import { instancePilotContract } from './server-info.contract.js';
import { createServerInfoService } from '../server-info.js';
import type { ServerInfoDependencies } from '../server-info.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
export function createInstanceRouter<Actor extends ApiActor>(deps: ServerInfoDependencies) {
	const read = createServerInfoService(deps);
	const instance = implement(instancePilotContract).$context<ApiContext<Actor>>()
		.use(authentication<Actor>());
	return instance.router({
		serverInfo: instance.serverInfo.handler(({ context }) => read()),
		serverInfoGet: instance.serverInfoGet.handler(({ context }) => read()),
	});
}

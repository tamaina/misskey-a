/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { instancePilotContract } from './server-info.contract.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { authentication } from '../../../api/backend/transport/middleware.js';

export function createInstanceRouter<Actor extends ApiActor>() {
	const instance = implement(instancePilotContract).$context<ApiContext<Actor>>()
		.use(authentication<Actor>());
	return instance.router({
		serverInfo: instance.serverInfo.handler(({ context }) => context.services.serverInfo()),
		serverInfoGet: instance.serverInfoGet.handler(({ context }) => context.services.serverInfo()),
	});
}

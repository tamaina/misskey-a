/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { instanceApiContract } from './api.contract.js';
import { createInstanceRouter as createServerInfoRouter } from './endpoints/server-info.js';
import { createAdCreateProcedure } from './endpoints/admin/ad/create.js';
import { createAdDeleteProcedure } from './endpoints/admin/ad/delete.js';
import { createAdListProcedure } from './endpoints/admin/ad/list.js';
import { createAdUpdateProcedure } from './endpoints/admin/ad/update.js';
import { createAdminMetaProcedure } from './endpoints/admin/meta.js';
import { createAdminServerInfoProcedure } from './endpoints/admin/server-info.js';
import { createUpdateMetaProcedure } from './endpoints/admin/update-meta.js';
import { createEndpointProcedure } from './endpoints/endpoint.js';
import { createEndpointsProcedure } from './endpoints/endpoints.js';
import { createOnlineUsersCountProcedure, createOnlineUsersCountGetProcedure } from './endpoints/get-online-users-count.js';
import { createMetaProcedure } from './endpoints/meta.js';
import { createPingProcedure } from './endpoints/ping.js';
import { createPinnedUsersProcedure } from './endpoints/pinned-users.js';
import type { ApiContext } from '../../api/backend/transport/context.js';
import type { InstanceApiDependencies } from './api.dependencies.js';
import type { ServerInfoDependencies } from './server-info.js';
import type { ApiActor } from '../../api/backend/transport/context.js';
export function createInstanceRouter<Actor extends ApiActor>(deps: InstanceApiDependencies & { serverInfo: ServerInfoDependencies }) {
	return implement(instanceApiContract).$context<ApiContext<Actor>>().router({
		...createServerInfoRouter<Actor>(deps.serverInfo),
		adCreate: createAdCreateProcedure<Actor>(deps),
		adDelete: createAdDeleteProcedure<Actor>(deps),
		adList: createAdListProcedure<Actor>(deps),
		adUpdate: createAdUpdateProcedure<Actor>(deps),
		adminMeta: createAdminMetaProcedure<Actor>(deps),
		adminServerInfo: createAdminServerInfoProcedure<Actor>(deps),
		updateMeta: createUpdateMetaProcedure<Actor>(deps),
		endpoint: createEndpointProcedure<Actor>(deps),
		endpoints: createEndpointsProcedure<Actor>(deps),
		onlineUsersCount: createOnlineUsersCountProcedure<Actor>(deps),
		onlineUsersCountGet: createOnlineUsersCountGetProcedure<Actor>(deps),
		meta: createMetaProcedure<Actor>(deps),
		ping: createPingProcedure<Actor>(deps),
		pinnedUsers: createPinnedUsersProcedure<Actor>(deps),
	});
}

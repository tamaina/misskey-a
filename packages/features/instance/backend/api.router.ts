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
import type { InstanceApiContext } from './operations.js';
import type { ApiActor } from '../../api/backend/transport/context.js';

export function createInstanceRouter<Actor extends ApiActor>() {
	return implement(instanceApiContract).$context<InstanceApiContext<Actor>>().router({
		...createServerInfoRouter<Actor>(),
		adCreate: createAdCreateProcedure<Actor>(),
		adDelete: createAdDeleteProcedure<Actor>(),
		adList: createAdListProcedure<Actor>(),
		adUpdate: createAdUpdateProcedure<Actor>(),
		adminMeta: createAdminMetaProcedure<Actor>(),
		adminServerInfo: createAdminServerInfoProcedure<Actor>(),
		updateMeta: createUpdateMetaProcedure<Actor>(),
		endpoint: createEndpointProcedure<Actor>(),
		endpoints: createEndpointsProcedure<Actor>(),
		onlineUsersCount: createOnlineUsersCountProcedure<Actor>(),
		onlineUsersCountGet: createOnlineUsersCountGetProcedure<Actor>(),
		meta: createMetaProcedure<Actor>(),
		ping: createPingProcedure<Actor>(),
		pinnedUsers: createPinnedUsersProcedure<Actor>(),
	});
}

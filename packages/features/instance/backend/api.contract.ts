/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adCreateContract } from './endpoints/admin/ad/create.contract.js';
import { adDeleteContract } from './endpoints/admin/ad/delete.contract.js';
import { adListContract } from './endpoints/admin/ad/list.contract.js';
import { adUpdateContract } from './endpoints/admin/ad/update.contract.js';
import { adminMetaContract } from './endpoints/admin/meta.contract.js';
import { adminServerInfoContract } from './endpoints/admin/server-info.contract.js';
import { updateMetaContract } from './endpoints/admin/update-meta.contract.js';
import { endpointContract } from './endpoints/endpoint.contract.js';
import { endpointsContract } from './endpoints/endpoints.contract.js';
import { onlineUsersCountContract, onlineUsersCountGetContract } from './endpoints/get-online-users-count.contract.js';
import { metaContract } from './endpoints/meta.contract.js';
import { pingContract } from './endpoints/ping.contract.js';
import { pinnedUsersContract } from './endpoints/pinned-users.contract.js';
import { instancePilotContract } from './endpoints/server-info.contract.js';
import type { InferContractRouterInputs, InferContractRouterOutputs, InferSchemaOutput } from '@orpc/contract';

export const instanceApiContract = {
	...instancePilotContract,
	adCreate: adCreateContract,
	adDelete: adDeleteContract,
	adList: adListContract,
	adUpdate: adUpdateContract,
	adminMeta: adminMetaContract,
	adminServerInfo: adminServerInfoContract,
	updateMeta: updateMetaContract,
	endpoint: endpointContract,
	endpoints: endpointsContract,
	onlineUsersCount: onlineUsersCountContract,
	onlineUsersCountGet: onlineUsersCountGetContract,
	meta: metaContract,
	ping: pingContract,
	pinnedUsers: pinnedUsersContract,
};

export type InstanceApiInputs = InferContractRouterInputs<typeof instanceApiContract>;
export type InstanceApiOutputs = InferContractRouterOutputs<typeof instanceApiContract>;

export type InstanceApiParameters = {
	[Name in keyof typeof instanceApiContract]: InferSchemaOutput<NonNullable<(typeof instanceApiContract)[Name]['~orpc']['inputSchema']>>;
};

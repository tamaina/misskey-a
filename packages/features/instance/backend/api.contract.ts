/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { adCreateContract, adCreateInput } from './endpoints/admin/ad/create.contract.js';
import { adDeleteContract, adDeleteInput } from './endpoints/admin/ad/delete.contract.js';
import { adListContract, adListInput } from './endpoints/admin/ad/list.contract.js';
import { adUpdateContract, adUpdateInput } from './endpoints/admin/ad/update.contract.js';
import { adminMetaContract, adminMetaInput } from './endpoints/admin/meta.contract.js';
import { adminServerInfoContract, adminServerInfoInput } from './endpoints/admin/server-info.contract.js';
import { updateMetaContract, updateMetaInput } from './endpoints/admin/update-meta.contract.js';
import { endpointContract, endpointInput } from './endpoints/endpoint.contract.js';
import { endpointsContract, endpointsInput } from './endpoints/endpoints.contract.js';
import { onlineUsersCountContract, onlineUsersCountGetContract, onlineUsersCountInput } from './endpoints/get-online-users-count.contract.js';
import { metaContract, metaInput } from './endpoints/meta.contract.js';
import { pingContract, pingInput } from './endpoints/ping.contract.js';
import { pinnedUsersContract, pinnedUsersInput } from './endpoints/pinned-users.contract.js';
import { instancePilotContract } from './endpoints/server-info.contract.js';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import type * as v from 'valibot';

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
	adCreate: v.InferOutput<typeof adCreateInput>;
	adDelete: v.InferOutput<typeof adDeleteInput>;
	adList: v.InferOutput<typeof adListInput>;
	adUpdate: v.InferOutput<typeof adUpdateInput>;
	adminMeta: v.InferOutput<typeof adminMetaInput>;
	adminServerInfo: v.InferOutput<typeof adminServerInfoInput>;
	updateMeta: v.InferOutput<typeof updateMetaInput>;
	endpoint: v.InferOutput<typeof endpointInput>;
	endpoints: v.InferOutput<typeof endpointsInput>;
	onlineUsersCount: v.InferOutput<typeof onlineUsersCountInput>;
	onlineUsersCountGet: v.InferOutput<typeof onlineUsersCountInput>;
	meta: v.InferOutput<typeof metaInput>;
	ping: v.InferOutput<typeof pingInput>;
	pinnedUsers: v.InferOutput<typeof pinnedUsersInput>;
};

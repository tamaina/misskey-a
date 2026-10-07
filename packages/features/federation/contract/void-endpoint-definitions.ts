/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAdminFederationDeleteAllFilesInput = v.object({
	"host": v.string(),
});
export const voidAdminFederationDeleteAllFilesOutput = v.void();
export const voidAdminFederationDeleteAllFilesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/federation/delete-all-files", tags: ["admin"] },
	voidAdminFederationDeleteAllFilesInput,
	voidAdminFederationDeleteAllFilesOutput,
);

export const voidAdminFederationRefreshRemoteInstanceMetadataInput = v.object({
	"host": v.string(),
});
export const voidAdminFederationRefreshRemoteInstanceMetadataOutput = v.void();
export const voidAdminFederationRefreshRemoteInstanceMetadataDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/federation/refresh-remote-instance-metadata", tags: ["admin"] },
	voidAdminFederationRefreshRemoteInstanceMetadataInput,
	voidAdminFederationRefreshRemoteInstanceMetadataOutput,
);

export const voidAdminFederationRemoveAllFollowingInput = v.object({
	"host": v.string(),
});
export const voidAdminFederationRemoveAllFollowingOutput = v.void();
export const voidAdminFederationRemoveAllFollowingDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/federation/remove-all-following", tags: ["admin"] },
	voidAdminFederationRemoveAllFollowingInput,
	voidAdminFederationRemoveAllFollowingOutput,
);

export const voidAdminFederationUpdateInstanceInput = v.object({
	"host": v.string(),
	"isSuspended": v.exactOptional(v.boolean()),
	"moderationNote": v.exactOptional(v.string()),
});
export const voidAdminFederationUpdateInstanceOutput = v.void();
export const voidAdminFederationUpdateInstanceDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/federation/update-instance", tags: ["admin"] },
	voidAdminFederationUpdateInstanceInput,
	voidAdminFederationUpdateInstanceOutput,
);

export const voidAdminRelaysRemoveInput = v.object({
	"inbox": v.string(),
});
export const voidAdminRelaysRemoveOutput = v.void();
export const voidAdminRelaysRemoveDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/relays/remove", tags: ["admin"] },
	voidAdminRelaysRemoveInput,
	voidAdminRelaysRemoveOutput,
);

export const voidFederationUpdateRemoteUserInput = v.object({
	"userId": misskeyId,
});
export const voidFederationUpdateRemoteUserOutput = v.void();
export const voidFederationUpdateRemoteUserDefinition = defineEndpointContract(
	{ method: 'POST', path: "/federation/update-remote-user", tags: ["federation"] },
	voidFederationUpdateRemoteUserInput,
	voidFederationUpdateRemoteUserOutput,
);

export const voidEndpointDefinitions = {
	"admin/federation/delete-all-files": voidAdminFederationDeleteAllFilesDefinition,
	"admin/federation/refresh-remote-instance-metadata": voidAdminFederationRefreshRemoteInstanceMetadataDefinition,
	"admin/federation/remove-all-following": voidAdminFederationRemoveAllFollowingDefinition,
	"admin/federation/update-instance": voidAdminFederationUpdateInstanceDefinition,
	"admin/relays/remove": voidAdminRelaysRemoveDefinition,
	"federation/update-remote-user": voidFederationUpdateRemoteUserDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/federation/delete-all-files": voidAdminFederationDeleteAllFilesDefinition.contract,
	"admin/federation/refresh-remote-instance-metadata": voidAdminFederationRefreshRemoteInstanceMetadataDefinition.contract,
	"admin/federation/remove-all-following": voidAdminFederationRemoveAllFollowingDefinition.contract,
	"admin/federation/update-instance": voidAdminFederationUpdateInstanceDefinition.contract,
	"admin/relays/remove": voidAdminRelaysRemoveDefinition.contract,
	"federation/update-remote-user": voidFederationUpdateRemoteUserDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

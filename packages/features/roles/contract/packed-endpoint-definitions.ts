/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminRolesListInput = v.looseObject({});
export const packedAdminRolesListOutput = v.array(packedReference("Role"));
export const packedAdminRolesListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/list", tags: ["admin", "role"] },
	packedAdminRolesListInput,
	packedAdminRolesListOutput,
);

export const packedAdminRolesShowInput = v.looseObject({
	"roleId": misskeyId,
});
export const packedAdminRolesShowOutput = packedReference("Role");
export const packedAdminRolesShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/show", tags: ["admin", "role"] },
	packedAdminRolesShowInput,
	packedAdminRolesShowOutput,
);

export const packedRolesListInput = v.looseObject({});
export const packedRolesListOutput = v.array(packedReference("Role"));
export const packedRolesListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/roles/list", tags: ["role"] },
	packedRolesListInput,
	packedRolesListOutput,
);

export const packedRolesNotesInput = v.looseObject({
	"roleId": misskeyId,
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
});
export const packedRolesNotesOutput = v.array(packedReference("Note"));
export const packedRolesNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/roles/notes", tags: ["role", "notes"] },
	packedRolesNotesInput,
	packedRolesNotesOutput,
);

export const packedRolesShowInput = v.looseObject({
	"roleId": misskeyId,
});
export const packedRolesShowOutput = packedReference("Role");
export const packedRolesShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/roles/show", tags: ["role", "users"] },
	packedRolesShowInput,
	packedRolesShowOutput,
);

export const packedRolesUsersInput = v.looseObject({
	"roleId": misskeyId,
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
});
export const packedRolesUsersOutput = v.array(resultObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"user": packedReference("UserDetailed"),
	}));
export const packedRolesUsersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/roles/users", tags: ["role", "users"] },
	packedRolesUsersInput,
	packedRolesUsersOutput,
);

export const packedEndpointDefinitions = {
	"admin/roles/list": packedAdminRolesListDefinition,
	"admin/roles/show": packedAdminRolesShowDefinition,
	"roles/list": packedRolesListDefinition,
	"roles/notes": packedRolesNotesDefinition,
	"roles/show": packedRolesShowDefinition,
	"roles/users": packedRolesUsersDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/roles/list": packedAdminRolesListDefinition.contract,
	"admin/roles/show": packedAdminRolesShowDefinition.contract,
	"roles/list": packedRolesListDefinition.contract,
	"roles/notes": packedRolesNotesDefinition.contract,
	"roles/show": packedRolesShowDefinition.contract,
	"roles/users": packedRolesUsersDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

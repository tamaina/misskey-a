/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { opaqueObject } from '../../api/contract/opaque-object.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAdminRolesAssignInput = v.looseObject({
	"roleId": misskeyId,
	"userId": misskeyId,
	"expiresAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
});
export const voidAdminRolesAssignOutput = v.void();
export const voidAdminRolesAssignDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/assign", tags: ["admin", "role"] },
	voidAdminRolesAssignInput,
	voidAdminRolesAssignOutput,
);

export const voidAdminRolesDeleteInput = v.looseObject({
	"roleId": misskeyId,
});
export const voidAdminRolesDeleteOutput = v.void();
export const voidAdminRolesDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/delete", tags: ["admin", "role"] },
	voidAdminRolesDeleteInput,
	voidAdminRolesDeleteOutput,
);

export const voidAdminRolesUnassignInput = v.looseObject({
	"roleId": misskeyId,
	"userId": misskeyId,
});
export const voidAdminRolesUnassignOutput = v.void();
export const voidAdminRolesUnassignDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/unassign", tags: ["admin", "role"] },
	voidAdminRolesUnassignInput,
	voidAdminRolesUnassignOutput,
);

export const voidAdminRolesUpdateInput = v.looseObject({
	"roleId": misskeyId,
	"name": v.exactOptional(v.string()),
	"description": v.exactOptional(v.string()),
	"color": v.exactOptional(v.nullable(v.string())),
	"iconUrl": v.exactOptional(v.nullable(v.string())),
	"target": v.exactOptional(v.picklist(["manual", "conditional"])),
	"condFormula": v.optional(opaqueObject),
	"isPublic": v.exactOptional(v.boolean()),
	"isModerator": v.exactOptional(v.boolean()),
	"isAdministrator": v.exactOptional(v.boolean()),
	"isExplorable": v.exactOptional(v.boolean()),
	"asBadge": v.exactOptional(v.boolean()),
	"preserveAssignmentOnMoveAccount": v.exactOptional(v.boolean()),
	"canEditMembersByModerator": v.exactOptional(v.boolean()),
	"displayOrder": v.exactOptional(v.number()),
	"policies": v.optional(opaqueObject),
});
export const voidAdminRolesUpdateOutput = v.void();
export const voidAdminRolesUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/update", tags: ["admin", "role"] },
	voidAdminRolesUpdateInput,
	voidAdminRolesUpdateOutput,
);

export const voidAdminRolesUpdateDefaultPoliciesInput = v.looseObject({
	"policies": opaqueObject,
});
export const voidAdminRolesUpdateDefaultPoliciesOutput = v.void();
export const voidAdminRolesUpdateDefaultPoliciesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/roles/update-default-policies", tags: ["admin", "role"] },
	voidAdminRolesUpdateDefaultPoliciesInput,
	voidAdminRolesUpdateDefaultPoliciesOutput,
);

export const voidEndpointDefinitions = {
	"admin/roles/assign": voidAdminRolesAssignDefinition,
	"admin/roles/delete": voidAdminRolesDeleteDefinition,
	"admin/roles/unassign": voidAdminRolesUnassignDefinition,
	"admin/roles/update": voidAdminRolesUpdateDefinition,
	"admin/roles/update-default-policies": voidAdminRolesUpdateDefaultPoliciesDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/roles/assign": voidAdminRolesAssignDefinition.contract,
	"admin/roles/delete": voidAdminRolesDeleteDefinition.contract,
	"admin/roles/unassign": voidAdminRolesUnassignDefinition.contract,
	"admin/roles/update": voidAdminRolesUpdateDefinition.contract,
	"admin/roles/update-default-policies": voidAdminRolesUpdateDefaultPoliciesDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

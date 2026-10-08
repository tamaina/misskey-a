/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAdminAccountsDeleteInput = v.object({
	"userId": misskeyId,
});
export const voidAdminAccountsDeleteOutput = v.void();
export const voidAdminAccountsDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/accounts/delete", tags: ["admin"] },
	voidAdminAccountsDeleteInput,
	voidAdminAccountsDeleteOutput,
);

export const voidAdminDeleteAccountInput = v.object({
	"userId": misskeyId,
});
export const voidAdminDeleteAccountOutput = v.void();
export const voidAdminDeleteAccountDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/delete-account", tags: ["admin"] },
	voidAdminDeleteAccountInput,
	voidAdminDeleteAccountOutput,
);

export const voidIDeleteAccountInput = v.object({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});
export const voidIDeleteAccountOutput = v.void();
export const voidIDeleteAccountDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/delete-account" },
	voidIDeleteAccountInput,
	voidIDeleteAccountOutput,
);

export const voidUsersUpdateMemoInput = v.object({
	"userId": misskeyId,
	"memo": v.pipe(v.nullable(v.string()), v.metadata({ "description": "A personal memo for the target user. If null or empty, delete the memo." })),
});
export const voidUsersUpdateMemoOutput = v.void();
export const voidUsersUpdateMemoDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/update-memo", tags: ["account"] },
	voidUsersUpdateMemoInput,
	voidUsersUpdateMemoOutput,
);

export const voidEndpointDefinitions = {
	"admin/accounts/delete": voidAdminAccountsDeleteDefinition,
	"admin/delete-account": voidAdminDeleteAccountDefinition,
	"i/delete-account": voidIDeleteAccountDefinition,
	"users/update-memo": voidUsersUpdateMemoDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/accounts/delete": voidAdminAccountsDeleteDefinition.contract,
	"admin/delete-account": voidAdminDeleteAccountDefinition.contract,
	"i/delete-account": voidIDeleteAccountDefinition.contract,
	"users/update-memo": voidUsersUpdateMemoDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

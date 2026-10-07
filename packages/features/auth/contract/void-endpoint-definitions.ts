/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const voidAdminUnsetMfaInput = v.looseObject({
	"userId": misskeyId,
});
export const voidAdminUnsetMfaOutput = v.void();
export const voidAdminUnsetMfaDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/unset-mfa", tags: ["admin"] },
	voidAdminUnsetMfaInput,
	voidAdminUnsetMfaOutput,
);

export const voidAuthAcceptInput = v.looseObject({
	"token": v.string(),
});
export const voidAuthAcceptOutput = v.void();
export const voidAuthAcceptDefinition = defineEndpointContract(
	{ method: 'POST', path: "/auth/accept", tags: ["auth"] },
	voidAuthAcceptInput,
	voidAuthAcceptOutput,
);

export const voidI2faPasswordLessInput = v.looseObject({
	"value": v.boolean(),
});
export const voidI2faPasswordLessOutput = v.void();
export const voidI2faPasswordLessDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/2fa/password-less" },
	voidI2faPasswordLessInput,
	voidI2faPasswordLessOutput,
);

export const voidI2faUnregisterInput = v.looseObject({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});
export const voidI2faUnregisterOutput = v.void();
export const voidI2faUnregisterDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/2fa/unregister" },
	voidI2faUnregisterInput,
	voidI2faUnregisterOutput,
);

export const voidIChangePasswordInput = v.looseObject({
	"currentPassword": v.string(),
	"newPassword": jsonString({ "minLength": 1 }),
	"token": v.exactOptional(v.nullable(v.string())),
});
export const voidIChangePasswordOutput = v.void();
export const voidIChangePasswordDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/change-password" },
	voidIChangePasswordInput,
	voidIChangePasswordOutput,
);

export const voidIRegenerateTokenInput = v.looseObject({
	"password": v.string(),
});
export const voidIRegenerateTokenOutput = v.void();
export const voidIRegenerateTokenDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/regenerate-token" },
	voidIRegenerateTokenInput,
	voidIRegenerateTokenOutput,
);

export const voidInviteDeleteInput = v.looseObject({
	"inviteId": misskeyId,
});
export const voidInviteDeleteOutput = v.void();
export const voidInviteDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/invite/delete", tags: ["meta"] },
	voidInviteDeleteInput,
	voidInviteDeleteOutput,
);

export const voidRequestResetPasswordInput = v.looseObject({
	"username": v.string(),
	"email": v.string(),
});
export const voidRequestResetPasswordOutput = v.void();
export const voidRequestResetPasswordDefinition = defineEndpointContract(
	{ method: 'POST', path: "/request-reset-password", tags: ["reset password"] },
	voidRequestResetPasswordInput,
	voidRequestResetPasswordOutput,
);

export const voidResetPasswordInput = v.looseObject({
	"token": v.string(),
	"password": v.string(),
});
export const voidResetPasswordOutput = v.void();
export const voidResetPasswordDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reset-password", tags: ["reset password"] },
	voidResetPasswordInput,
	voidResetPasswordOutput,
);

export const voidVerifyEmailInput = v.looseObject({
	"code": v.string(),
});
export const voidVerifyEmailOutput = v.void();
export const voidVerifyEmailDefinition = defineEndpointContract(
	{ method: 'POST', path: "/verify-email", tags: ["account"] },
	voidVerifyEmailInput,
	voidVerifyEmailOutput,
);

export const voidEndpointDefinitions = {
	"admin/unset-mfa": voidAdminUnsetMfaDefinition,
	"auth/accept": voidAuthAcceptDefinition,
	"i/2fa/password-less": voidI2faPasswordLessDefinition,
	"i/2fa/unregister": voidI2faUnregisterDefinition,
	"i/change-password": voidIChangePasswordDefinition,
	"i/regenerate-token": voidIRegenerateTokenDefinition,
	"invite/delete": voidInviteDeleteDefinition,
	"request-reset-password": voidRequestResetPasswordDefinition,
	"reset-password": voidResetPasswordDefinition,
	"verify-email": voidVerifyEmailDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/unset-mfa": voidAdminUnsetMfaDefinition.contract,
	"auth/accept": voidAuthAcceptDefinition.contract,
	"i/2fa/password-less": voidI2faPasswordLessDefinition.contract,
	"i/2fa/unregister": voidI2faUnregisterDefinition.contract,
	"i/change-password": voidIChangePasswordDefinition.contract,
	"i/regenerate-token": voidIRegenerateTokenDefinition.contract,
	"invite/delete": voidInviteDeleteDefinition.contract,
	"request-reset-password": voidRequestResetPasswordDefinition.contract,
	"reset-password": voidResetPasswordDefinition.contract,
	"verify-email": voidVerifyEmailDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

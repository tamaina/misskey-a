/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { opaqueObject } from '../../api/contract/opaque-object.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { jsonString } from '../../api/contract/index.js';
import { misskeyId } from '../../api/contract/index.js';
import { webAuthnRegistrationOptionsSchema } from './webauthn-registration-options.js';

export const inlineAdminResetPasswordInput = v.object({
	"userId": misskeyId,
});
export const inlineAdminResetPasswordOutput = v.strictObject({
	"password": v.pipe(v.string(), v.metadata({ "minLength": 8, "maxLength": 8 })),
});
export const inlineAdminResetPasswordDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/reset-password', tags: ["admin"] },
	inlineAdminResetPasswordInput,
	inlineAdminResetPasswordOutput,
);

export const inlineAuthSessionGenerateInput = v.object({
	"appSecret": v.string(),
});
export const inlineAuthSessionGenerateOutput = v.strictObject({
	"token": v.string(),
	"url": v.pipe(v.string(), v.metadata({ "format": "url" })),
});
export const inlineAuthSessionGenerateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/auth/session/generate', tags: ["auth"] },
	inlineAuthSessionGenerateInput,
	inlineAuthSessionGenerateOutput,
);

export const inlineEmailAddressAvailableInput = v.object({
	"emailAddress": v.string(),
});
export const inlineEmailAddressAvailableOutput = v.strictObject({
	"available": v.boolean(),
	"reason": v.nullable(v.string()),
});
export const inlineEmailAddressAvailableDefinition = defineEndpointContract(
	{ method: 'POST', path: '/email-address/available', tags: ["users"] },
	inlineEmailAddressAvailableInput,
	inlineEmailAddressAvailableOutput,
);

export const inlineI2faDoneInput = v.object({
	"token": v.string(),
});
export const inlineI2faDoneOutput = v.strictObject({
	"backupCodes": v.array(v.string()),
});
export const inlineI2faDoneDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/2fa/done' },
	inlineI2faDoneInput,
	inlineI2faDoneOutput,
);

export const inlineI2faRegisterInput = v.object({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});
export const inlineI2faRegisterOutput = v.strictObject({
	"qr": v.string(),
	"url": v.string(),
	"secret": v.string(),
	"label": v.string(),
	"issuer": v.string(),
});
export const inlineI2faRegisterDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/2fa/register' },
	inlineI2faRegisterInput,
	inlineI2faRegisterOutput,
);

export const inlineI2faRegisterKeyInput = v.object({
	"password": v.string(),
	"token": v.exactOptional(v.nullable(v.string())),
});
export const inlineI2faRegisterKeyOutput = webAuthnRegistrationOptionsSchema;
export const inlineI2faRegisterKeyDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/2fa/register-key' },
	inlineI2faRegisterKeyInput,
	inlineI2faRegisterKeyOutput,
);

export const inlineIAppsInput = v.object({
	"sort": v.exactOptional(v.picklist(["+createdAt", "-createdAt", "+lastUsedAt", "-lastUsedAt"])),
});
export const inlineIAppsOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"name": v.optional(v.string()),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"lastUsedAt": v.optional(v.pipe(v.string(), v.metadata({ "format": "date-time" }))),
		"permission": v.pipe(v.array(v.string()), v.metadata({ "uniqueItems": true })),
		"iconUrl": v.exactOptional(v.nullable(v.string())),
		"description": v.exactOptional(v.nullable(v.string())),
	}));
export const inlineIAppsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/apps' },
	inlineIAppsInput,
	inlineIAppsOutput,
);

export const inlineIAuthorizedAppsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"sort": v.optional(v.picklist(["desc", "asc"]), "desc"),
});
export const inlineIAuthorizedAppsOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"name": v.string(),
		"callbackUrl": v.nullable(v.string()),
		"permission": v.pipe(v.array(v.string()), v.metadata({ "uniqueItems": true })),
		"isAuthorized": v.exactOptional(v.boolean()),
	}));
export const inlineIAuthorizedAppsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/authorized-apps' },
	inlineIAuthorizedAppsInput,
	inlineIAuthorizedAppsOutput,
);

export const inlineInviteLimitInput = v.object({});
export const inlineInviteLimitOutput = v.strictObject({
	"remaining": v.nullable(v.pipe(v.number(), v.integer())),
});
export const inlineInviteLimitDefinition = defineEndpointContract(
	{ method: 'POST', path: '/invite/limit', tags: ["meta"] },
	inlineInviteLimitInput,
	inlineInviteLimitOutput,
);

export const inlineI2faKeyDoneInput = jsonObject({
	password: v.string(),
	token: v.optional(v.nullable(v.string())),
	name: jsonString({ minLength: 1, maxLength: 30 }),
	credential: opaqueObject,
});
export const inlineI2faKeyDoneOutput = v.strictObject({ id: v.string(), name: v.string() });
export const inlineI2faKeyDoneDefinition = defineEndpointContract(
	{ method: 'POST', path: '/i/2fa/key-done' },
	inlineI2faKeyDoneInput,
	inlineI2faKeyDoneOutput,
);

export const inlineEndpointDefinitions = {
	'i/2fa/key-done': inlineI2faKeyDoneDefinition,
	"admin/reset-password": inlineAdminResetPasswordDefinition,
	"auth/session/generate": inlineAuthSessionGenerateDefinition,
	"email-address/available": inlineEmailAddressAvailableDefinition,
	"i/2fa/done": inlineI2faDoneDefinition,
	"i/2fa/register": inlineI2faRegisterDefinition,
	"i/2fa/register-key": inlineI2faRegisterKeyDefinition,
	"i/apps": inlineIAppsDefinition,
	"i/authorized-apps": inlineIAuthorizedAppsDefinition,
	"invite/limit": inlineInviteLimitDefinition,
} as const;

export const inlineEndpointContracts = {
	'i/2fa/key-done': inlineI2faKeyDoneDefinition.contract,
	"admin/reset-password": inlineAdminResetPasswordDefinition.contract,
	"auth/session/generate": inlineAuthSessionGenerateDefinition.contract,
	"email-address/available": inlineEmailAddressAvailableDefinition.contract,
	"i/2fa/done": inlineI2faDoneDefinition.contract,
	"i/2fa/register": inlineI2faRegisterDefinition.contract,
	"i/2fa/register-key": inlineI2faRegisterKeyDefinition.contract,
	"i/apps": inlineIAppsDefinition.contract,
	"i/authorized-apps": inlineIAuthorizedAppsDefinition.contract,
	"invite/limit": inlineInviteLimitDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

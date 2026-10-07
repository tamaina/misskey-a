/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString } from '../../api/contract/index.js';

// AJV keeps the legacy required scope list while both validators supply its static default.
// Opaque registry result payloads retain the legacy unconstrained response type.

export const remainingIRegistryGetInput = v.pipe(v.object({
	"key": v.string(),
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["key", "scope"] }));
export const remainingIRegistryGetOutput = v.pipe(v.any(), v.metadata({ type: 'object' }));
export const remainingIRegistryGetDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/get" },
	remainingIRegistryGetInput,
	remainingIRegistryGetOutput,
);

export const remainingIRegistryGetAllInput = v.pipe(v.object({
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["scope"] }));
export const remainingIRegistryGetAllOutput = v.pipe(v.any(), v.metadata({ type: 'object' }));
export const remainingIRegistryGetAllDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/get-all" },
	remainingIRegistryGetAllInput,
	remainingIRegistryGetAllOutput,
);

export const remainingIRegistryGetDetailInput = v.pipe(v.object({
	"key": v.string(),
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["key", "scope"] }));
export const remainingIRegistryGetDetailOutput = v.strictObject({
	"updatedAt": v.string(),
	"value": v.unknown(),
});
export const remainingIRegistryGetDetailDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/get-detail" },
	remainingIRegistryGetDetailInput,
	remainingIRegistryGetDetailOutput,
);

export const remainingIRegistryKeysInput = v.pipe(v.object({
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["scope"] }));
export const remainingIRegistryKeysOutput = v.array(v.string());
export const remainingIRegistryKeysDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/keys" },
	remainingIRegistryKeysInput,
	remainingIRegistryKeysOutput,
);

export const remainingIRegistryKeysWithTypeInput = v.pipe(v.object({
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["scope"] }));
export const remainingIRegistryKeysWithTypeOutput = v.record(v.string(), v.string());
export const remainingIRegistryKeysWithTypeDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/keys-with-type" },
	remainingIRegistryKeysWithTypeInput,
	remainingIRegistryKeysWithTypeOutput,
);

export const remainingIRegistryRemoveInput = v.pipe(v.object({
	"key": v.string(),
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["key", "scope"] }));
export const remainingIRegistryRemoveOutput = v.void();
export const remainingIRegistryRemoveDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/remove" },
	remainingIRegistryRemoveInput,
	remainingIRegistryRemoveOutput,
);

export const remainingIRegistrySetInput = v.pipe(v.object({
	"key": jsonString({ "minLength": 1 }),
	"value": v.unknown(),
	"scope": v.optional(v.array(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9_]+$")))), []),
	"domain": v.exactOptional(v.nullable(v.string())),
}), v.metadata({ required: ["key", "value", "scope"] }));
export const remainingIRegistrySetOutput = v.void();
export const remainingIRegistrySetDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/registry/set" },
	remainingIRegistrySetInput,
	remainingIRegistrySetOutput,
);

export const remainingInlineEndpointDefinitions = {
	"i/registry/get": remainingIRegistryGetDefinition,
	"i/registry/get-all": remainingIRegistryGetAllDefinition,
	"i/registry/get-detail": remainingIRegistryGetDetailDefinition,
	"i/registry/keys": remainingIRegistryKeysDefinition,
	"i/registry/keys-with-type": remainingIRegistryKeysWithTypeDefinition,
	"i/registry/remove": remainingIRegistryRemoveDefinition,
	"i/registry/set": remainingIRegistrySetDefinition,
} as const;

export const remainingInlineEndpointContracts = {
	"i/registry/get": remainingIRegistryGetDefinition.contract,
	"i/registry/get-all": remainingIRegistryGetAllDefinition.contract,
	"i/registry/get-detail": remainingIRegistryGetDetailDefinition.contract,
	"i/registry/keys": remainingIRegistryKeysDefinition.contract,
	"i/registry/keys-with-type": remainingIRegistryKeysWithTypeDefinition.contract,
	"i/registry/remove": remainingIRegistryRemoveDefinition.contract,
	"i/registry/set": remainingIRegistrySetDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof remainingInlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof remainingInlineEndpointContracts>;
export type RemainingInlineEndpoints = {
	[K in keyof typeof remainingInlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

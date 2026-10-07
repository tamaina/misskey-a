/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';

export const inlineAdminServerInfoInput = v.object({});
export const inlineAdminServerInfoOutput = v.strictObject({
	"machine": v.string(),
	"os": v.pipe(v.string(), v.metadata({ "example": "linux" })),
	"node": v.string(),
	"psql": v.string(),
	"redis": v.optional(v.string()),
	"cpu": v.strictObject({
		"model": v.string(),
		"cores": v.number(),
	}),
	"mem": v.strictObject({
		"total": v.pipe(v.number(), v.metadata({ "format": "bytes" })),
	}),
	"fs": v.strictObject({
		"total": v.pipe(v.number(), v.metadata({ "format": "bytes" })),
		"used": v.pipe(v.number(), v.metadata({ "format": "bytes" })),
	}),
	"net": v.strictObject({
		"interface": v.pipe(v.string(), v.metadata({ "example": "eth0" })),
	}),
});
export const inlineAdminServerInfoDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/server-info', tags: ["admin", "meta"] },
	inlineAdminServerInfoInput,
	inlineAdminServerInfoOutput,
);

export const inlineEndpointDefinitions = {
	"admin/server-info": inlineAdminServerInfoDefinition,
} as const;

export const inlineEndpointContracts = {
	"admin/server-info": inlineAdminServerInfoDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

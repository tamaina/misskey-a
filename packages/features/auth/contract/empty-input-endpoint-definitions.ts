/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { supportedCaptchaProviders } from './captcha-providers.js';

// The legacy {} schema accepts every value. The callback deliberately ignores input.
export const emptyAdminCaptchaCurrentInput = v.unknown();
export const emptyAdminCaptchaCurrentOutput = v.strictObject({
	provider: v.picklist(supportedCaptchaProviders),
	hcaptcha: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
	}),
	mcaptcha: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
		instanceUrl: v.nullable(v.string()),
	}),
	recaptcha: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
	}),
	turnstile: v.strictObject({
		siteKey: v.nullable(v.string()),
		secretKey: v.nullable(v.string()),
	}),
});
export const emptyAdminCaptchaCurrentDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/captcha/current', tags: ['admin', 'captcha'] },
	emptyAdminCaptchaCurrentInput,
	emptyAdminCaptchaCurrentOutput,
);

export const emptyInputEndpointDefinitions = {
	'admin/captcha/current': emptyAdminCaptchaCurrentDefinition,
} as const;

export const emptyInputEndpointContracts = {
	'admin/captcha/current': emptyAdminCaptchaCurrentDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof emptyInputEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof emptyInputEndpointContracts>;
export type EmptyInputEndpoints = {
	[K in keyof typeof emptyInputEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

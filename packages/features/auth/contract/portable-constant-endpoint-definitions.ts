/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { supportedCaptchaProviders } from './captcha-providers.js';

export const portableAdminCaptchaSaveInput = jsonObject({
	"provider": v.picklist(supportedCaptchaProviders),
	"captchaResult": v.exactOptional(v.nullable(v.string())),
	"sitekey": v.exactOptional(v.nullable(v.string())),
	"secret": v.exactOptional(v.nullable(v.string())),
	"instanceUrl": v.exactOptional(v.nullable(v.string())),
});
export const portableAdminCaptchaSaveOutput = v.void();
export const portableAdminCaptchaSaveDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/captcha/save", tags: ["admin", "captcha"] },
	portableAdminCaptchaSaveInput,
	portableAdminCaptchaSaveOutput,
);

export const portableConstantEndpointDefinitions = {
	"admin/captcha/save": portableAdminCaptchaSaveDefinition,
} as const;

export const portableConstantEndpointContracts = {
	"admin/captcha/save": portableAdminCaptchaSaveDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof portableConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof portableConstantEndpointContracts>;
export type PortableConstantEndpoints = {
	[K in keyof typeof portableConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

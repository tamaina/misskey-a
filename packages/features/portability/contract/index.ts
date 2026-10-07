/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectParams } from '../../api/contract/index.js';

const exportFollowingInput = v.object({
	excludeMuting: v.optional(v.boolean(), false),
	excludeInactive: v.optional(v.boolean(), false),
});

export const portabilityInputs = {
	'i/export-antennas': objectParams,
	'i/export-blocking': objectParams,
	'i/export-clips': objectParams,
	'i/export-favorites': objectParams,
	'i/export-following': exportFollowingInput,
	'i/export-mute': objectParams,
	'i/export-notes': objectParams,
	'i/export-user-lists': objectParams,
};

/** User data export queue requests. Queue acceptance is represented by an empty response. */
export const portabilityContract = {
	'i/export-antennas': oc.route({ method: 'POST', path: '/i/export-antennas' })
		.input(v.optional(portabilityInputs['i/export-antennas'], {}))
		.output(v.void()),
	'i/export-blocking': oc.route({ method: 'POST', path: '/i/export-blocking' })
		.input(v.optional(portabilityInputs['i/export-blocking'], {}))
		.output(v.void()),
	'i/export-clips': oc.route({ method: 'POST', path: '/i/export-clips' })
		.input(v.optional(portabilityInputs['i/export-clips'], {}))
		.output(v.void()),
	'i/export-favorites': oc.route({ method: 'POST', path: '/i/export-favorites' })
		.input(v.optional(portabilityInputs['i/export-favorites'], {}))
		.output(v.void()),
	'i/export-following': oc.route({ method: 'POST', path: '/i/export-following' })
		.input(v.optional(portabilityInputs['i/export-following'], { excludeMuting: false, excludeInactive: false }))
		.output(v.void()),
	'i/export-mute': oc.route({ method: 'POST', path: '/i/export-mute' })
		.input(v.optional(portabilityInputs['i/export-mute'], {}))
		.output(v.void()),
	'i/export-notes': oc.route({ method: 'POST', path: '/i/export-notes' })
		.input(v.optional(portabilityInputs['i/export-notes'], {}))
		.output(v.void()),
	'i/export-user-lists': oc.route({ method: 'POST', path: '/i/export-user-lists' })
		.input(v.optional(portabilityInputs['i/export-user-lists'], {}))
		.output(v.void()),
};

type Inputs = InferContractRouterInputs<typeof portabilityContract>;
type Outputs = InferContractRouterOutputs<typeof portabilityContract>;
export type PortabilityEndpoints = {
	[K in keyof typeof portabilityContract]: { req: Inputs[K]; res: Outputs[K] };
};

export { portabilityImportContract, portabilityImportErrors, portabilityImportInputs } from './imports.js';
export type { PortabilityImportEndpoints } from './imports.js';

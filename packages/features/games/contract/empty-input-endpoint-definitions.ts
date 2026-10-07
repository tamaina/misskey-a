/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { packedReference } from '../../api/contract/packed-reference.js';

// The legacy {} schema accepts every value. The callback deliberately ignores input.
export const emptyReversiInvitationsInput = v.unknown();
export const emptyReversiInvitationsOutput = v.array(packedReference('UserLite', { legacyOutputType: 'omit' }));
export const emptyReversiInvitationsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/reversi/invitations' },
	emptyReversiInvitationsInput,
	emptyReversiInvitationsOutput,
);

export const emptyInputEndpointDefinitions = {
	'reversi/invitations': emptyReversiInvitationsDefinition,
} as const;

export const emptyInputEndpointContracts = {
	'reversi/invitations': emptyReversiInvitationsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof emptyInputEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof emptyInputEndpointContracts>;
export type EmptyInputEndpoints = {
	[K in keyof typeof emptyInputEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};

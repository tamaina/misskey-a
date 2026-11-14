/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { InferContractRouterOutputs } from '@orpc/contract';
import type { emailContract } from '@features/email/backend/api.definition.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Contracts = typeof emailContract;
// SDK PilotEndpoints keys are derived from these metadata literals, not route values.
type Names = { [K in keyof Contracts]: Contracts[K]['~orpc']['meta']['requestName'] };
type RequestContracts = { [K in keyof Contracts as Names[K]]: Contracts[K] };
type Outputs = InferContractRouterOutputs<RequestContracts>;
export type Cases = [
	Assert<Equal<Names['state'], 'email/state'>>,
	Assert<Equal<Names['send'], 'email/send'>>,
	Assert<Equal<Names['configureForwarding'], 'email/forwarding/configure'>>,
	Assert<Equal<string extends keyof RequestContracts ? true : false, false>>,
	Assert<Equal<Outputs['email/state']['available'], boolean>>,
	Assert<Equal<Outputs['email/send']['id'], string>>,
	Assert<Equal<Outputs['email/list'][number]['localStored'], boolean>>,
];

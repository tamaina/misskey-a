/*
 * SPDX-FileCopyrightText: tamaina
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ContractRouterClient } from '@orpc/contract';
import type { residenceContract } from '../backend/residence.contract.js';
export type ResidenceClient = ContractRouterClient<typeof residenceContract>;
/** Refresh immediately before a new wallet action; never use location as a fallback. */
export async function requireResidenceForStart(client: Pick<ResidenceClient, 'getResidence'>) {
	const result = await client.getResidence({});
	if (!result.isReady || !result.residence) throw new Error('RESIDENCE_REQUIRED');
	return result.residence;
}

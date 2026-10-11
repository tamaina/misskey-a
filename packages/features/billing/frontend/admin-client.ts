/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ContractRouterClient } from '@orpc/contract';
import type { billingContract } from '../contract/billing.js';

/** Host supplies its authenticated native client; the form cannot choose an admin identity. */
export type BillingAdminClient = Pick<ContractRouterClient<typeof billingContract>, 'listChains' | 'upsertChain'>;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { pilotContract } from './api.contract.js';
import { sessionContract } from '../../auth/backend/session.contract.js';

/** Portable client composition includes the distinct account-session HTTP boundary. */
export const clientContract: typeof pilotContract & typeof sessionContract = { ...pilotContract, ...sessionContract };

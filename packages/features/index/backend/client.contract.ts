/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { pilotContract } from './api.definition.js';
import { sessionContract } from '../../auth/backend/api.definition.js';

/** Portable client composition includes the distinct account-session HTTP boundary. */
export const clientContract: typeof pilotContract & typeof sessionContract = { ...pilotContract, ...sessionContract };
